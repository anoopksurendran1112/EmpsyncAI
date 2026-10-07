from datetime import time, timedelta

from django.db import migrations


SEEDED_SHIFTS = [
    ('General Shift', time(8, 55), time(16, 35), 'Mon - Sat', 'Teaching & Technical', 72, 15),
    ('Supporting Staff 1', time(8, 40), time(17, 0), 'Mon - Sat', 'Non-Teaching', 18, 15),
    ('Supporting Staff 2', time(8, 50), time(17, 0), 'Mon - Sat', 'Non-Teaching', 10, 15),
    ('Physical Education 1', time(11, 0), time(18, 0), 'Mon - Sat', 'PE Staff', 3, 15),
    ('Physical Education 2', time(8, 55), time(16, 35), 'Mon - Sat', 'PE Staff', 2, 15),
    ('Front Office', time(8, 30), time(17, 0), 'Mon - Sat', 'Office', 6, 10),
    ('Library 1', time(8, 0), time(16, 0), 'Mon - Sat', 'Library', 3, 10),
    ('Library 2', time(8, 30), time(16, 40), 'Mon - Sat', 'Library', 2, 10),
    ('Principal', time(9, 10), time(17, 0), 'Mon - Sat', 'Principal', 1, 0),
    ('3 Days / Week', time(10, 30), time(16, 30), '3 Days / Week', 'Dr. Sudheer', 2, 15),
    ('Visiting Day', None, None, 'As Scheduled', 'Visiting Faculty', 3, 0),
    ('No Fixed Timing', None, None, 'As Scheduled', 'Drivers', 4, 0),
]


def remove_seeded_shifts(apps, schema_editor):
    CompanyShift = apps.get_model('company', 'CompanyShift')

    for name, check_in, check_out, days, applicable_to, staff_count, grace_minutes in SEEDED_SHIFTS:
        CompanyShift.objects.filter(
            shift=name,
            check_in=check_in,
            check_out=check_out,
            days_applicable=days,
            applicable_to=applicable_to,
            staff_count=staff_count,
            late_allowance=timedelta(minutes=grace_minutes),
            staff_type__isnull=True,
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('company', '0026_companyshift_staff_type'),
    ]

    operations = [
        migrations.RunPython(remove_seeded_shifts, migrations.RunPython.noop),
    ]
