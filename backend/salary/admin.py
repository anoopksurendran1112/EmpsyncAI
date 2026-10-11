from django.contrib import admin

from .models import SalaryConfig, EmployeeSalary


@admin.register(SalaryConfig)
class SalaryConfigAdmin(admin.ModelAdmin):
    list_display = ('company', 'updated_at')


@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(admin.ModelAdmin):
    list_display = ('employee', 'company', 'salary_type', 'employment_type', 'status', 'updated_at')
    list_filter = ('company', 'salary_type', 'employment_type', 'status')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__email')
