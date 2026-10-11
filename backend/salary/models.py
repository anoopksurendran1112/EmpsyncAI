from django.db import models


class SalaryConfig(models.Model):
    """Company-level definition of salary earning & deduction components.

    Each component entry is a dict::

        {"key": "basic", "name": "Basic Pay", "type": "fixed", "value": 0}

    ``type`` is one of ``fixed``, ``percent_basic`` or ``percent_gross``.
    ``value`` holds the default amount (fixed) or the percentage (percent_*).

    An individual employee's values live on :class:`EmployeeSalary.components`,
    keyed by the component ``key``. Names/types are always resolved from here,
    so editing a company rule applies to every employee using it.
    """

    company = models.OneToOneField(
        'company.Company', on_delete=models.CASCADE, related_name='salary_config'
    )
    earnings = models.JSONField(default=list, blank=True)
    deductions = models.JSONField(default=list, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Salary config'
        verbose_name_plural = 'Salary configs'

    def __str__(self):
        return f'Salary config - {self.company}'


class EmployeeSalary(models.Model):
    """An employee's salary structure (values only, keyed by config component)."""

    SALARY_TYPE_CHOICES = [
        ('regular', 'Regular'),
        ('consolidated', 'Consolidated'),
        ('per_diem', 'Per diem'),
    ]
    EMPLOYMENT_TYPE_CHOICES = [
        ('permanent', 'Permanent'),
        ('probationary', 'Probationary'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_hold', 'On hold'),
        ('new_joiner', 'New joiner'),
        ('on_lwa', 'On LWA'),
        ('per_diem', 'Per diem'),
        ('exited', 'Exited'),
    ]

    company = models.ForeignKey(
        'company.Company', on_delete=models.CASCADE, related_name='employee_salaries'
    )
    employee = models.ForeignKey(
        'user.CustomUser', on_delete=models.CASCADE, related_name='salary_structures'
    )
    salary_type = models.CharField(max_length=20, choices=SALARY_TYPE_CHOICES, default='regular')
    employment_type = models.CharField(
        max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='permanent'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # {"<component_key>": {"value": <number>, "active": <bool>}, ...}
    components = models.JSONField(default=dict, blank=True)

    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        'user.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='salary_structures_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'employee')
        ordering = ['employee_id']

    def __str__(self):
        return f'{self.employee} - {self.company}'
