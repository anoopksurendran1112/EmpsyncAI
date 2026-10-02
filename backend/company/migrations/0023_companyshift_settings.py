from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('company', '0022_company_id_uuid'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyshift',
            name='days_applicable',
            field=models.CharField(default='Mon - Sat', max_length=100),
        ),
        migrations.AddField(
            model_name='companyshift',
            name='applicable_to',
            field=models.CharField(default='All Staff', max_length=100),
        ),
    ]
