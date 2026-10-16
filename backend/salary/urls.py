from django.urls import path

from .views import (
    employee_salary_history_view,
    employee_salary_view,
    salary_config_view,
    salary_employees_view,
    salary_summary_view,
)

urlpatterns = [
    path('api/salary/config', salary_config_view, name='salary-config'),
    path('api/salary/employees', salary_employees_view, name='salary-employees'),
    path('api/salary/employees/<int:employee_id>', employee_salary_view, name='salary-employee-detail'),
    path('api/salary/employees/<int:employee_id>/history', employee_salary_history_view, name='salary-employee-history'),
    path('api/salary/summary', salary_summary_view, name='salary-summary'),
]
