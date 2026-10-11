from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from company.models import Company, CompanyUser
from user.models import CustomUser

from .models import EmployeeSalary
from .serializer import SalaryConfigSerializer, EmployeeSalarySerializer
from .services import (
    build_company_summary,
    config_component_map,
    get_or_create_config,
    serialize_components,
)

STATUS_LABELS = {
    'active': 'Active',
    'on_hold': 'On hold',
    'new_joiner': 'New joiner',
    'on_lwa': 'On LWA',
    'per_diem': 'Per diem',
    'exited': 'Exited',
}


def _resolve_company(request):
    """Resolve the company from the request and ensure the caller is an admin."""
    company_id = request.query_params.get('company_id') or request.data.get('company_id')
    if not company_id:
        return None, Response(
            {'success': False, 'message': 'company_id is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        company = Company.objects.get(id=company_id)
    except (Company.DoesNotExist, ValueError, TypeError):
        return None, Response(
            {'success': False, 'message': 'Company not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_admin = CompanyUser.objects.filter(
        user=request.user, company=company, is_admin=True
    ).exists()
    if not (is_admin or getattr(request.user, 'is_superuser', False)):
        return None, Response(
            {'success': False, 'message': 'Admin privileges required'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return company, None


def _employee_identity(employee):
    profile = getattr(employee, 'profile', None)
    joined = getattr(profile, 'date_of_joining', None)
    return {
        'employee_id': employee.id,
        'name': f'{employee.first_name} {employee.last_name}'.strip(),
        'role': employee.role.role if employee.role else '',
        'dept': employee.group.group if employee.group else '',
        'joined': joined.isoformat() if joined else '',
    }


@api_view(['GET', 'PUT'])
def salary_config_view(request):
    company, error = _resolve_company(request)
    if error:
        return error

    config = get_or_create_config(company)

    if request.method == 'GET':
        return Response({
            'success': True,
            'data': {
                'earnings': config.earnings,
                'deductions': config.deductions,
                'settings': config.settings,
            },
        })

    serializer = SalaryConfigSerializer(config, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(
            {'success': False, 'message': 'Validation failed', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer.save()
    return Response({
        'success': True,
        'message': 'Salary components updated',
        'data': {
            'earnings': config.earnings,
            'deductions': config.deductions,
            'settings': config.settings,
        },
    })


@api_view(['GET'])
def salary_employees_view(request):
    company, error = _resolve_company(request)
    if error:
        return error

    config = get_or_create_config(company)
    employees = (
        CustomUser.objects
        .filter(company=company, is_active=True)
        .select_related('role', 'group', 'profile')
        .order_by('first_name', 'last_name')
    )
    existing = {es.employee_id: es for es in EmployeeSalary.objects.filter(company=company)}

    data = []
    for employee in employees:
        item = _employee_identity(employee)
        record = existing.get(employee.id)
        if record:
            _, totals = serialize_components(config, record.components)
            item.update({
                'salary_type': record.salary_type,
                'employment_type': record.employment_type,
                'status': record.status,
                'status_label': STATUS_LABELS.get(record.status, record.status),
                'basic': totals['basic'],
                'gross': totals['gross'],
                'deductions': totals['deductions'],
                'net': totals['net'],
                'configured': True,
            })
        else:
            item.update({
                'salary_type': 'regular',
                'employment_type': 'permanent',
                'status': 'new_joiner',
                'status_label': STATUS_LABELS['new_joiner'],
                'basic': 0,
                'gross': 0,
                'deductions': 0,
                'net': 0,
                'configured': False,
            })
        data.append(item)

    return Response({'success': True, 'data': data})


@api_view(['GET', 'PUT'])
def employee_salary_view(request, employee_id):
    company, error = _resolve_company(request)
    if error:
        return error

    try:
        employee = (
            CustomUser.objects
            .select_related('role', 'group', 'profile')
            .get(id=employee_id, company=company)
        )
    except CustomUser.DoesNotExist:
        return Response(
            {'success': False, 'message': 'Employee not found in this company'},
            status=status.HTTP_404_NOT_FOUND,
        )

    config = get_or_create_config(company)
    record = EmployeeSalary.objects.filter(company=company, employee=employee).first()

    if request.method == 'GET':
        components, totals = serialize_components(config, record.components if record else {})
        payload = _employee_identity(employee)
        payload.update({
            'salary_type': record.salary_type if record else 'regular',
            'employment_type': record.employment_type if record else 'permanent',
            'status': record.status if record else 'new_joiner',
            'status_label': STATUS_LABELS.get(
                record.status if record else 'new_joiner', 'New joiner'
            ),
            'notes': record.notes if record else '',
            'configured': bool(record),
            'components': components,
            'totals': totals,
        })
        return Response({'success': True, 'data': payload})

    is_new = record is None
    serializer = (
        EmployeeSalarySerializer(data=request.data)
        if is_new
        else EmployeeSalarySerializer(record, data=request.data, partial=True)
    )
    if not serializer.is_valid():
        return Response(
            {'success': False, 'message': 'Validation failed', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated = serializer.validated_data
    if 'components' in validated:
        allowed = set(config_component_map(config).keys())
        unknown = [key for key in validated['components'] if key not in allowed]
        if unknown:
            return Response({
                'success': False,
                'message': f"Unknown salary component(s): {', '.join(unknown)}",
            }, status=status.HTTP_400_BAD_REQUEST)

    if is_new:
        record = serializer.save(company=company, employee=employee, created_by=request.user)
    else:
        record = serializer.save()

    components, totals = serialize_components(config, record.components)
    return Response({
        'success': True,
        'message': 'Salary structure saved',
        'data': {
            'employee_id': employee.id,
            'salary_type': record.salary_type,
            'employment_type': record.employment_type,
            'status': record.status,
            'status_label': STATUS_LABELS.get(record.status, record.status),
            'configured': True,
            'components': components,
            'totals': totals,
        },
    })


@api_view(['GET'])
def salary_summary_view(request):
    """Company-wide payroll summary, computed on the fly (nothing persisted)."""
    company, error = _resolve_company(request)
    if error:
        return error

    return Response({'success': True, 'data': build_company_summary(company)})
