import re

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


def build_company_summary(company):
    """Compute a company-wide payroll summary from the current salary structures.

    Nothing is persisted: every figure is derived on the fly from
    ``EmployeeSalary`` + ``SalaryConfig`` so the UI never needs static data.
    """
    from .models import EmployeeSalary

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

    structures = EmployeeSalary.objects.filter(company=company)
    for structure in structures:
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
