from django.db import migrations


def backfill_revisions(apps, schema_editor):
    """Seed one 'initial' revision per existing EmployeeSalary row.

    The effective date is the employee's date of joining when available,
    otherwise the date the salary row was first created, so historical months
    resolve to the employee's earliest known structure.
    """
    EmployeeSalary = apps.get_model('salary', 'EmployeeSalary')
    EmployeeSalaryRevision = apps.get_model('salary', 'EmployeeSalaryRevision')

    for salary in EmployeeSalary.objects.select_related('employee').all():
        effective_from = None
        try:
            effective_from = salary.employee.profile.date_of_joining
        except Exception:
            effective_from = None

        if not effective_from:
            effective_from = (
                salary.created_at.date() if salary.created_at else salary.updated_at.date()
            )

        if EmployeeSalaryRevision.objects.filter(
            company_id=salary.company_id,
            employee_id=salary.employee_id,
            effective_from=effective_from,
        ).exists():
            continue

        EmployeeSalaryRevision.objects.create(
            company_id=salary.company_id,
            employee_id=salary.employee_id,
            effective_from=effective_from,
            salary_type=salary.salary_type,
            employment_type=salary.employment_type,
            status=salary.status,
            components=salary.components or {},
            note=salary.notes,
            reason='initial',
            created_by_id=salary.created_by_id,
        )


def remove_revisions(apps, schema_editor):
    """Reverse the backfill by dropping only the seeded 'initial' rows."""
    EmployeeSalaryRevision = apps.get_model('salary', 'EmployeeSalaryRevision')
    EmployeeSalaryRevision.objects.filter(reason='initial').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0002_employeesalaryrevision'),
    ]

    operations = [
        migrations.RunPython(backfill_revisions, remove_revisions),
    ]
