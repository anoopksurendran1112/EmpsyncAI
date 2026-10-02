from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('company', '0023_companyshift_settings'),
    ]

    operations = [
        migrations.AlterField(
            model_name='companyshift',
            name='check_in',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='companyshift',
            name='check_out',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companyshift',
            name='staff_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
