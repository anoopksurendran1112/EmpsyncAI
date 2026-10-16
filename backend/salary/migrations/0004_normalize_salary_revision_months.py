from django.db import migrations


def normalize_to_month_start(apps, schema_editor):
    """Snap every existing revision's effective_from to the first of its month.

    The salary model is now one record per employee per month. Existing rows may
    carry a mid-month date (e.g. a backfill timestamp); snapping them keeps the
    (company, employee, effective_from) uniqueness equivalent to one-per-month.
    """
    EmployeeSalaryRevision = apps.get_model('salary', 'EmployeeSalaryRevision')

    for revision in EmployeeSalaryRevision.objects.all():
        month_start = revision.effective_from.replace(day=1)
        if revision.effective_from == month_start:
            continue
        collision = (
            EmployeeSalaryRevision.objects
            .filter(
                company_id=revision.company_id,
                employee_id=revision.employee_id,
                effective_from=month_start,
            )
            .exclude(pk=revision.pk)
            .exists()
        )
        if collision:
            revision.delete()
        else:
            revision.effective_from = month_start
            revision.save(update_fields=['effective_from'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0003_backfill_salary_revisions'),
    ]

    operations = [
        migrations.RunPython(normalize_to_month_start, noop),
    ]
