import calendar
import re
from collections import defaultdict
from datetime import date, datetime, timedelta

ALLOWED_COMPONENT_TYPES = ('fixed', 'percent_basic', 'percent_gross')

DEFAULT_EARNINGS = [
    {'key': 'basic', 'name': 'Basic Pay', 'type': 'fixed', 'value': 0},
]
DEFAULT_DEDUCTIONS = []


def slugify_component_key(name):
    key = re.sub(r'[^a-z0-9]+', '_', str(name or '').lower()).strip('_')
    return key or 'component'


def get_or_create_config(company):
    from .models import SalaryConfig

    config, _ = SalaryConfig.objects.get_or_create(
        company=company,
        defaults={
            'earnings': [dict(item) for item in DEFAULT_EARNINGS],
            'deductions': [dict(item) for item in DEFAULT_DEDUCTIONS],
            'settings': {},
        },
    )
    return config


def parse_month(value):
    """Parse ``''`` / ``'YYYY-MM'`` / ``'YYYY-MM-DD'`` / ``date`` into a date.

    A bare ``YYYY-MM`` resolves to the **last day** of that month, which is the
    natural "as of" boundary for monthly reporting. Returns ``None`` when the
    value is empty or unparseable.
    """
    if value in (None, ''):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    try:
        if len(text) == 7:
            year, month = (int(part) for part in text.split('-'))
            return date(year, month, calendar.monthrange(year, month)[1])
        if len(text) >= 10:
            return date.fromisoformat(text[:10])
    except (ValueError, TypeError):
        return None
    return None


def structures_as_of(company, as_of=None):
    """Map ``employee_id`` -> structure-like object for the given point in time.

    ``as_of`` is a ``date``. When ``None`` the *latest* revision is returned (the
    "current" structure). For a given date the latest revision whose
    ``effective_from`` is on or before that date wins; months that predate every
    revision fall back to the earliest one so an employee never silently vanishes.

    Employees with no revisions fall back to their current ``EmployeeSalary``
    snapshot, so rows created before revisions existed still show up.
    """
    from .models import EmployeeSalary, EmployeeSalaryRevision

    by_employee = defaultdict(list)
    revisions = (
        EmployeeSalaryRevision.objects
        .filter(company=company)
        .order_by('employee_id', 'effective_from', 'id')
    )
    for revision in revisions:
        by_employee[revision.employee_id].append(revision)

    result = {}
    for employee_id, items in by_employee.items():
        if as_of is None:
            result[employee_id] = items[-1]
            continue
        applicable = [item for item in items if item.effective_from <= as_of]
        result[employee_id] = applicable[-1] if applicable else items[0]

    for structure in EmployeeSalary.objects.filter(company=company):
        result.setdefault(structure.employee_id, structure)
    return result


def latest_revision(company, employee):
    from .models import EmployeeSalaryRevision

    return (
        EmployeeSalaryRevision.objects
        .filter(company=company, employee=employee)
        .order_by('-effective_from', '-id')
        .first()
    )


def revision_effective_to_map(company, employee):
    """Map revision id -> the day it stops applying (next revision's start - 1).

    The newest revision maps to ``None`` (still in effect). This is derived, so
    an older record's range always ends where the next update begins.
    """
    from .models import EmployeeSalaryRevision

    revisions = list(
        EmployeeSalaryRevision.objects
        .filter(company=company, employee=employee)
        .order_by('effective_from', 'id')
    )
    result = {}
    for index, revision in enumerate(revisions):
        if index + 1 < len(revisions):
            result[revision.id] = revisions[index + 1].effective_from - timedelta(days=1)
        else:
            result[revision.id] = None
    return result


def record_revision(company, employee, *, effective_from, salary_type, employment_type,
                    status, components, note=None, reason='increment', created_by=None):
    """Upsert the single salary record for the month of ``effective_from``.

    Follows the monthly payroll pattern: the date is normalised to the **first of
    the month**, and each employee has at most one record per month. If a record
    already exists for that month it is updated in place (a correction); otherwise
    a new record is created.
    """
    from .models import EmployeeSalaryRevision

    month_start = effective_from.replace(day=1)
    existing = (
        EmployeeSalaryRevision.objects
        .filter(company=company, employee=employee, effective_from=month_start)
        .first()
    )

    fields = {
        'salary_type': salary_type,
        'employment_type': employment_type,
        'status': status,
        'components': components or {},
        'note': note,
        'reason': reason,
    }

    if existing is not None:
        for key, value in fields.items():
            setattr(existing, key, value)
        existing.save()
        return existing, False

    revision = EmployeeSalaryRevision.objects.create(
        company=company,
        employee=employee,
        effective_from=month_start,
        created_by=created_by,
        **fields,
    )
    return revision, True


def config_component_map(config):
    """Ordered mapping of component key -> metadata (earnings first, then deductions)."""
    mapping = {}
    for kind, items in (
        ('earning', config.earnings or []),
        ('deduction', config.deductions or []),
    ):
        for item in items:
            if not isinstance(item, dict):
                continue
            key = item.get('key')
            if not key:
                continue
            mapping[key] = {
                'key': key,
                'name': item.get('name', key),
                'kind': kind,
                'type': item.get('type', 'fixed'),
                'default_value': item.get('value', 0),
            }
    return mapping


def resolve_components(config, component_values):
    """Full ordered list of resolved component rows for one employee."""
    component_values = component_values or {}
    rows = []
    for key, meta in config_component_map(config).items():
        stored = component_values.get(key)
        if isinstance(stored, dict):
            value = stored.get('value')
            active = stored.get('active', True)
        elif stored is None:
            value = meta['default_value']
            active = True
        else:
            value, active = stored, True

        if value in (None, ''):
            value = meta['default_value'] if meta['type'] != 'fixed' else 0
        rows.append({
            'key': key,
            'name': meta['name'],
            'kind': meta['kind'],
            'type': meta['type'],
            'value': float(value or 0),
            'active': bool(active),
        })
    return rows


def compute_totals(rows):
    """Gross = fixed + % of basic, then % of gross on the running total."""
    basic = 0.0
    for row in rows:
        if row['kind'] == 'earning' and row['key'] == 'basic' and row['active']:
            basic = float(row['value'] or 0)

    gross = 0.0
    for row in rows:
        if row['kind'] != 'earning' or not row['active']:
            continue
        value = float(row['value'] or 0)
        if row['type'] == 'fixed':
            gross += value
        elif row['type'] == 'percent_basic':
            gross += basic * value / 100.0
    for row in rows:
        if row['kind'] == 'earning' and row['active'] and row['type'] == 'percent_gross':
            gross += gross * float(row['value'] or 0) / 100.0

    deductions = 0.0
    for row in rows:
        if row['kind'] != 'deduction' or not row['active']:
            continue
        value = float(row['value'] or 0)
        if row['type'] == 'fixed':
            deductions += value
        elif row['type'] == 'percent_basic':
            deductions += basic * value / 100.0
        elif row['type'] == 'percent_gross':
            deductions += gross * value / 100.0

    return {
        'basic': round(basic, 2),
        'gross': round(gross, 2),
        'deductions': round(deductions, 2),
        'net': round(gross - deductions, 2),
    }


def applied_amount(row, basic, gross):
    if not row['active']:
        return 0.0
    value = float(row['value'] or 0)
    if row['type'] == 'fixed':
        return round(value, 2)
    if row['type'] == 'percent_basic':
        return round(basic * value / 100.0, 2)
    return round(gross * value / 100.0, 2)


def serialize_components(config, component_values):
    """Return (enriched component rows, totals)."""
    rows = resolve_components(config, component_values)
    totals = compute_totals(rows)
    enriched = []
    for row in rows:
        entry = dict(row)
        entry['applied_amount'] = applied_amount(row, totals['basic'], totals['gross'])
        enriched.append(entry)
    return enriched, totals


def build_company_summary(company, as_of=None):
    """Compute a company-wide payroll summary for a point in time.

    ``as_of`` is a ``date`` (or ``None`` for the current structure). Nothing is
    persisted: every figure is derived on the fly from the effective-dated
    revisions + ``SalaryConfig`` so the UI never needs static data.
    """
    config = get_or_create_config(company)

    totals = {'staff_count': 0, 'gross': 0.0, 'deductions': 0.0, 'net': 0.0}
    split = {
        'permanent': {'staff_count': 0, 'gross': 0.0, 'deductions': 0.0, 'net': 0.0},
        'probationary': {'staff_count': 0, 'gross': 0.0, 'deductions': 0.0, 'net': 0.0},
    }

    # Seed component order from the company config so every component shows up,
    # even when no employee has a value for it yet.
    components = {}
    for meta in config_component_map(config).values():
        components[meta['key']] = {
            'key': meta['key'],
            'name': meta['name'],
            'kind': meta['kind'],
            'permanent': 0.0,
            'probationary': 0.0,
        }

    structures = structures_as_of(company, as_of)
    for structure in structures.values():
        rows, recorded = serialize_components(config, structure.components)
        rows, recorded = serialize_components(config, structure.components)
        employment = (
            structure.employment_type if structure.employment_type in split else 'permanent'
        )

        totals['staff_count'] += 1
        totals['gross'] += recorded['gross']
        totals['deductions'] += recorded['deductions']
        totals['net'] += recorded['net']

        split[employment]['staff_count'] += 1
        split[employment]['gross'] += recorded['gross']
        split[employment]['deductions'] += recorded['deductions']
        split[employment]['net'] += recorded['net']

        for row in rows:
            bucket = components.setdefault(
                row['key'],
                {
                    'key': row['key'],
                    'name': row['name'],
                    'kind': row['kind'],
                    'permanent': 0.0,
                    'probationary': 0.0,
                },
            )
            bucket[employment] += row['applied_amount']

    for bucket in components.values():
        bucket['permanent'] = round(bucket['permanent'], 2)
        bucket['probationary'] = round(bucket['probationary'], 2)
        bucket['total'] = round(bucket['permanent'] + bucket['probationary'], 2)

    for key in ('gross', 'deductions', 'net'):
        totals[key] = round(totals[key], 2)
        for employment in split:
            split[employment][key] = round(split[employment][key], 2)

    return {
        'totals': totals,
        'permanent': split['permanent'],
        'probationary': split['probationary'],
        'components': list(components.values()),
    }
