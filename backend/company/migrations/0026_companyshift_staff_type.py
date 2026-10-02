from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('company', '0025_seed_default_shifts'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyshift',
            name='staff_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='shifts',
                to='company.stafftype',
            ),
        ),
    ]
