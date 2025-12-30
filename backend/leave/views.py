from django.shortcuts import render
from .models import Leave, LeaveType, Holiday,LeaveCredit
from company.models import CompanyRole,Company
from punch.models import PunchRecords
from user.models import CustomUser
from punch.serializer import PunchSerializer
from company.models import Device
from datetime import datetime, timedelta
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q,Sum
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from collections import defaultdict
from django.db.models.functions import TruncDate
from .serializer import LeaveSerializer
from django.core.paginator import Paginator
from notification.views import send_push_notification
from notification.models import FcmToken
from datetime import date
from django.utils import timezone





@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'date': {'type': 'string', 'format': 'date'}

            },
            'required': ['date']
        }
    },
    responses={
        200: {'type': 'object', 'properties': {'message': {'type': 'string'}}},
        404: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
    }
)
@api_view(['POST'])
def get_calendar(request,id):

    date_str = request.data.get('date')  # expected format: '2025-05'

    user = CustomUser.objects.get(id=id)
    company_id = request.data.get('company_id')

    try:
        # Parse the month input (e.g., '2025-05')
        base_date = datetime.strptime(date_str, "%Y-%m")
        start_date = base_date.replace(day=1).date()
        
        # Calculate end_date correctly handling year rollover
        if base_date.month == 12:
            next_month = base_date.replace(year=base_date.year + 1, month=1, day=1)
        else:
            next_month = base_date.replace(month=base_date.month + 1, day=1)
            
        end_date = (next_month - timedelta(days=1)).date()

    except ValueError:
        return Response({'success':False,'status': status.HTTP_400_BAD_REQUEST,"Message": "Invalid date format. Use YYYY-MM"}, status=status.HTTP_400_BAD_REQUEST)

    result = []

    devices = Device.objects.filter(company__id=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))

    punches_by_date = defaultdict(list)

    # Get all punches between start and end date
    worked_days = PunchRecords.objects.using('secondary').filter(
        user_id=user.biometric_id,
        device_id__in=device_ids,
        punch_time__date__gte=start_date,
        punch_time__date__lte=end_date
    ).annotate(punch_date=TruncDate('punch_time'))

    serializer = PunchSerializer(worked_days, many=True)

    # Group them by punch_date
    for punch in serializer.data:
        punch_time_str = punch['punch_time']
        punch_date = datetime.fromisoformat(punch_time_str).date()
        punches_by_date[punch_date].append(punch)


    for date, punches in punches_by_date.items():
        if len(punches) >= 2:
            result.append({
                'date': date,
                'type': 'punch',
                
                'reason': 'Present'
            })
        else:  
            result.append({
                'date': date,
                'type': 'partial',
                'reason': 'Partial'
            })

    company = Company.objects.get(id=company_id)

    # 1. Leaves
    leaves = Leave.objects.filter(
        user=user,
        company = company,

        from_date__lte=end_date,
        to_date__gte=start_date
    )

    for leave in leaves:
        current = leave.from_date
        while current <= leave.to_date:
            if start_date <= current <= end_date:
                result.append({
                    "date": current,
                    "id": leave.id,
                    "type": "leave",
                    "reason": leave.leave_type.leave_type,
                    "status": dict(Leave.LEAVE_STATUS_CHOICES).get(leave.status, leave.status)
                })
            current += timedelta(days=1)

    # Step 1: Fixed (non-recurring) holidays within the selected range
    non_recurring_holidays = Holiday.objects.filter(
        is_recurring=False,
        date__range=(start_date, end_date)
    ).filter(
        Q(role__isnull=False, role=user.role) |  # Role-specific holidays
        Q(role__isnull=True) & (                # Only if role is not set
            Q(is_global=True) | 
            Q(company__id=company_id)
        )
    )

    # Step 2: Recurring holidays (e.g., Independence Day, Christmas)
    recurring_holidays = Holiday.objects.filter(
        is_recurring=True
    ).filter(
        Q(role__isnull=False, role=user.role) |  # Role-specific
        Q(role__isnull=True) & (
            Q(is_global=True) | 
            Q(company__id=company_id)
        )
    )




        # Add non-recurring holidays
    for h in non_recurring_holidays:
        result.append({
            "date": h.date,
            "type": "holiday",
            "reason": h.holiday
        })

    # Add recurring holidays for the selected year
    for h in recurring_holidays:
        recurring_date = h.date.replace(year=start_date.year)
        if start_date <= recurring_date <= end_date:
            result.append({
                "date": recurring_date,
                "type": "holiday",
                "reason": h.holiday
            })




    # Optional: sort result by date
    result = sorted(result, key=lambda x: x["date"])

    return Response({
        'success':True,
        'data':result,
        'status':status.HTTP_200_OK,
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
def apply_leave(request):
    user = request.user
    from_date = request.data.get('from_date')
    to_date = request.data.get('to_date')
    leave_id = request.data.get('leave_id')
    leave_choice = request.data.get('leave_choice')
    company_id = request.data.get('company_id')
    custom_reason = request.data.get('custom_reason')

    # Validate company ID
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid company ID'}, status=status.HTTP_400_BAD_REQUEST)

    # Ensure user belongs to that company
    if not user.company.filter(id=company_id).exists():
        return Response({'success': False, 'message': 'You do not belong to this company'}, status=status.HTTP_403_FORBIDDEN)

    # Validate leave type
    try:
        leave_type = LeaveType.objects.get(id=leave_id)
    except LeaveType.DoesNotExist:
        return Response({'success': False, 'message': 'Leave type not found'}, status=status.HTTP_400_BAD_REQUEST)

    from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
    to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()

    leave_days = (to_date_obj - from_date_obj).days + 1
    if leave_choice == 'H':
        leave_days *= 0.5

    # Check monthly leave limit
    monthly_leaves = Leave.objects.filter(
        user=user,
        company = company,
        leave_type=leave_type,
        from_date__month=from_date_obj.month,
        from_date__year=from_date_obj.year,
        status__in=['P', 'A']
    ).aggregate(total=Sum('days_taken'))['total'] or 0

    if leave_type.monthly_limit and (monthly_leaves + leave_days) > leave_type.monthly_limit:
        return Response({'success': False, 'message': 'Monthly leave limit reached'}, status=status.HTTP_400_BAD_REQUEST)

    # Check credit
    if leave_type.use_credit:
        credit_obj, _ = LeaveCredit.objects.get_or_create(user=user, leave_type=leave_type)
        if leave_days > credit_obj.credits:
            return Response({'success': False, 'message': 'Insufficient leave credits'}, status=status.HTTP_400_BAD_REQUEST)
        credit_obj.credits -= leave_days
        credit_obj.save()

    # Create leave
    leave = Leave.objects.create(
        user=user,
        leave_type=leave_type,
        from_date=from_date_obj,
        company = company,
        to_date=to_date_obj,
        leave_choice=leave_choice,
        custom_reason = custom_reason,        status='P',
        days_taken=leave_days
    )

    # Notify company admins
    admins = CustomUser.objects.filter(company=company, admin=True)
    tokens = list(FcmToken.objects.filter(user__in=admins).values_list('fcm_token', flat=True))

    send_push_notification(tokens, 'Leave request', f'{user.first_name} requested a {leave.get_leave_choice_display()} leave')

    return Response({'success': True, 'message': 'Leave request submitted.'}, status=status.HTTP_201_CREATED)



def add_initial_credits_to_all_users(leave_type):
    if not leave_type.use_credit:
        return  # ⛔ No need to add credit if use_credit is False

    from user.models import CustomUser
    users = CustomUser.objects.all() if leave_type.is_global else CustomUser.objects.filter(company=leave_type.company)

    for user in users:
        LeaveCredit.objects.get_or_create(
            user=user,
            leave_type=leave_type,
            year=timezone.now().year,
            defaults={'credits': leave_type.initial_credit}
        )



def monthly_credit_top_up():
    for credit in LeaveCredit.objects.select_related('leave_type'):
        if credit.leave_type.monthly_limit:
            credit.credits += credit.leave_type.monthly_limit
            credit.save()



def carry_forward_unused_leaves():
    today = date.today()
    last_year = today.year - 1

    all_credits = LeaveCredit.objects.all()

    for credit in all_credits:
        user = credit.user
        leave_type = credit.leave_type
        yearly_limit = leave_type.yearly_limit or 0

        used_last_year = Leave.objects.filter(
            user=user,
            leave_type=leave_type,
            from_date__year=last_year,
            status='A'
        ).aggregate(total=Sum('days_taken'))['total'] or 0

        unused = max(0, yearly_limit - used_last_year)
        credit.credits += unused
        credit.save()

# @api_view(['POST'])
# def apply_leave(request):
#     user = request.user
#     from_date = request.data.get('from_date')
#     to_date = request.data.get('to_date')
#     leave_id = request.data.get('leave_id')
#     leave_choice = request.data.get('leave_choice')

#     try:
#         leave_type = LeaveType.objects.get(id=leave_id)
#     except LeaveType.DoesNotExist:
#         return Response({'success': False, 'message': 'Leave type not found'}, status=status.HTTP_400_BAD_REQUEST)

#     # Parse dates
#     from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
#     to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()


#     # Filter user's leaves by type and date
#     user_leaves = Leave.objects.filter(user=user, leave_type=leave_type).filter(Q(status='A')|Q(status='P'))

#     # Monthly leave count
#     monthly_leaves = user_leaves.filter(from_date__month=from_date_obj.month).count()
#     if leave_type.monthly_limit is not None and monthly_leaves >= leave_type.monthly_limit:
#         return Response({'success': False, 'message': 'Monthly leave limit reached'}, status=status.HTTP_400_BAD_REQUEST)

#     # Yearly leave count
#     yearly_leaves = user_leaves.filter(from_date__year=from_date_obj.year).count()
#     if leave_type.yearly_limit is not None and yearly_leaves >= leave_type.yearly_limit:
#         return Response({'success': False, 'message': 'Yearly leave limit reached'}, status=status.HTTP_400_BAD_REQUEST)

#     # Create the leave request
#     leave= Leave.objects.create(
#         user=user,
#         leave_type=leave_type,
#         from_date=from_date_obj,
#         to_date=to_date_obj,
#         leave_choice=leave_choice,
#         status='P'  # Pending
#     )
#     choice = leave.get_leave_choice_display()
#     admins = CustomUser.objects.filter(company=user.company,admin=True)
#     token_qs = FcmToken.objects.filter(user__in=admins)
#     tokens = list(token_qs.values_list('fcm_token', flat=True))
#     send_push_notification(tokens,'Leave request',f'{user.first_name} requested a {choice} leave  ')

#     return Response({'success': True, 'message': 'Leave requested'}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'POST', 'DELETE'])
def get_leave_types(request):
    user = request.user
    company_id = request.headers.get('X-Company-ID')

    if not company_id:
        return Response({'success': False, 'message': 'Missing X-Company-ID header'}, status=400)

    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({'success': False, 'message': 'Company not found'}, status=404)

    # -------------------------- GET --------------------------
    if request.method == 'GET':
        leave_types = LeaveType.objects.filter(Q(company=company) | Q(is_global=True))
        data = list(leave_types.values())
        return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)

    # -------------------------- PUT --------------------------
    elif request.method == 'PUT':
        id = request.data.get('id')
        if not id:
            return Response({'success': False, 'message': 'ID is required'}, status=400)

        try:
            leave_type = LeaveType.objects.get(id=id)
        except LeaveType.DoesNotExist:
            return Response({'success': False, 'message': 'Leave type not found'}, status=404)

        leave_type.leave_type = request.data.get('leave_type', leave_type.leave_type)
        leave_type.monthly_limit = float(request.data.get("monthly_limit") or 0)
        leave_type.yearly_limit = float(request.data.get("yearly_limit") or 0)
        leave_type.initial_credit = float(request.data.get("initial_credit") or 0)
        leave_type.use_credit = request.data.get("use_credit", False)
        leave_type.save()

        # Update credits for all users in this company
        users = CustomUser.objects.filter(company=company)
        for user in users:
            credit_obj, _ = LeaveCredit.objects.get_or_create(
                user=user,
                leave_type=leave_type,
                defaults={'credits': leave_type.initial_credit}
            )
            credit_obj.credits = leave_type.initial_credit
            credit_obj.save()

        return Response({'success': True, 'message': 'Updated successfully'}, status=200)

    # -------------------------- DELETE --------------------------
    elif request.method == 'DELETE':
        id = request.data.get('id')
        if not id:
            return Response({'success': False, 'message': 'ID is required.'}, status=400)

        try:
            leave_type = LeaveType.objects.get(id=id)
            leave_type.delete()
            return Response({'success': True, 'message': 'Deleted successfully.'}, status=200)
        except LeaveType.DoesNotExist:
            return Response({'success': False, 'message': 'Leave type not found.'}, status=404)

    # -------------------------- POST --------------------------
    elif request.method == 'POST':
        try:
            leave_type_data = {
                "leave_type": request.data.get("leave_type"),
                "short_name": request.data.get("short_name"),
                "monthly_limit": float(request.data.get("monthly_limit") or 0),
                "yearly_limit": float(request.data.get("yearly_limit") or 0),
                "initial_credit": float(request.data.get("initial_credit") or 0),
                "use_credit": request.data.get("use_credit", False),
                "company": company
            }

            new_leave_type = LeaveType.objects.create(**leave_type_data)

            # Credit all users
            users = CustomUser.objects.filter(company=company)
            for user in users:
                LeaveCredit.objects.get_or_create(
                    user=user,
                    leave_type=new_leave_type,
                    defaults={'credits': new_leave_type.initial_credit}
                )

            return Response({
                'success': True,
                'message': 'Leave type created successfully.',
                'id': new_leave_type.id
            }, status=201)

        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)



def carry_forward_unused_leaves():
    today = date.today()
    last_year = today.year - 1

    all_credits = LeaveCredit.objects.all()

    for credit in all_credits:
        user = credit.user
        leave_type = credit.leave_type
        yearly_limit = leave_type.yearly_limit or 0

        used_last_year = Leave.objects.filter(
            user=user,
            leave_type=leave_type,
            from_date__year=last_year,
            status='A'
        ).aggregate(total=Sum('days_taken'))['total'] or 0

        unused = max(0, yearly_limit - used_last_year)
        credit.credits += unused
        credit.save()



@api_view(['PUT'])
def update_leave_type(request):
    user = request.user
    id = request.data.get('id')
    monthly_limit = request.data.get('monthly_limit')
    yearly_limit = request.data.get('yearly_limit')

    

    leave_type = LeaveType.objects.get(id=id)
    leave_type.monthly_limit = monthly_limit
    leave_type.yearly_limit = yearly_limit
    leave_type.save()
   
    
    return Response({
        'success':True,
        'message': 'Leave type updated'
    },status=status.HTTP_200_OK)



@api_view(['PUT'])
def update_leave_status(request):
    id = request.data.get('id')
    new_status = request.data.get('status')
    leave = Leave.objects.get(id=id)
    old_status = leave.status  # store previous status
    leave.status = new_status
    leave.save()

    # ✅ Restore credits if leave is rejected/cancelled AND was previously Approved or Pending
    if new_status in ['R', 'C'] and old_status in ['A', 'P']:
        leave_type = leave.leave_type
        if leave_type.use_credit:
            credit_obj, _ = LeaveCredit.objects.get_or_create(
                user=leave.user,
                leave_type=leave_type,
                year=leave.from_date.year
            )
            credit_obj.credits += leave.days_taken
            credit_obj.save()

    # Send notification
    status_display = leave.get_status_display()
    tokens = list(FcmToken.objects.filter(user=leave.user).values_list('fcm_token', flat=True))
    if tokens:
        send_push_notification(tokens, 'Leave status update', f'Your leave request has been {status_display}')

    return Response({'success': True, 'message': 'Status updated successfully.'})



@api_view(['GET'])
def get_requested_leaves(request,page):
    user = request.user
    company_id = request.headers.get('X-Company-ID')

    leaves = Leave.objects.filter(company_id=company_id).select_related('user').order_by('-from_date')


    paginator = Paginator(leaves,10)

    page_data = paginator.get_page(page)
    serializer = LeaveSerializer(page_data, many=True)

    return Response({
        'success': True,
         'total': paginator.count,
        'page': page,
        'total_page': paginator.num_pages,
        'data': serializer.data
    })



@api_view(['POST'])
def add_holiday(request):
    user = request.user

    # Parse inputs
    is_recurring = request.data.get("is_recurring")
    holiday_name = request.data.get("holiday")
    date = request.data.get("date")
    role_ids = request.data.get("role_ids", [])
    is_global = request.data.get("is_global", False)
    company_id = request.data.get("company_id")
    is_full_holiday_raw = request.data.get("is_full_holiday", False)

    if isinstance(is_full_holiday_raw, str):
        is_full_holiday = is_full_holiday_raw.lower() in ["true", "1", "yes"]
    else:
        is_full_holiday = bool(is_full_holiday_raw)

    # Validate company
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({"success": False, "message": "Invalid company ID."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user belongs to the company
    if not user.company.filter(id=company.id).exists():
        return Response({"success": False, "message": "User not associated with the selected company."}, status=status.HTTP_403_FORBIDDEN)

    # Validate role IDs (if provided)
    roles = []
    if role_ids:
        roles = CompanyRole.objects.filter(id__in=role_ids, company=company)
        valid_ids = {str(r.id) for r in roles}
        invalid_ids = set(str(i) for i in role_ids) - valid_ids
        if invalid_ids:
            return Response({"success": False, "message": f"Invalid role_ids: {invalid_ids}"}, status=status.HTTP_400_BAD_REQUEST)

    # Prepare holiday data
    holiday_data = {
        "holiday": holiday_name,
        "date": date,
        "is_recurring": bool(is_recurring),
        "is_global": bool(is_global),
        "is_full_holiday": is_full_holiday,
    }

    try:
        # Create and assign company
        new_holiday = Holiday.objects.create(**holiday_data)
        new_holiday.company.set([company])

        # Set roles
        if is_full_holiday:
            roles_to_set = roles if roles else list(CompanyRole.objects.filter(company=company))
            new_holiday.role.set(roles_to_set)
        elif roles:
            new_holiday.role.set(roles)

        # Get users to notify
        if is_full_holiday or not roles:
            users = CustomUser.objects.filter(company=company).distinct()
        else:
            users = CustomUser.objects.filter(company=company, role__in=roles).distinct()

        tokens = list(FcmToken.objects.filter(user__in=users).values_list('fcm_token', flat=True))
        if tokens:
            send_push_notification(
                tokens,
                "Holiday Alert 🎉",
                f"Get ready! You have a holiday on {date} for \"{holiday_name}\". Enjoy your day off!"
            )

        return Response({"success": True, "message": "Holiday created successfully."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    

@api_view(['PUT'])
def update_holiday(request):
    try:
        holiday_id = request.data.get('id')
        is_recurring = request.data.get('is_recurring')
        holiday_title = request.data.get('holiday')
        date = request.data.get('date')
        role_ids = request.data.get('role_ids', [])
        is_full_holiday_raw = request.data.get('is_full_holiday', False)
        company_id = request.headers.get('company_id')

        if not company_id:
            return Response({"success": False, "message": "Missing X-Company-ID header."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Normalize is_full_holiday to bool
        if isinstance(is_full_holiday_raw, str):
            is_full_holiday = is_full_holiday_raw.lower() in ['true', '1', 'yes']
        else:
            is_full_holiday = bool(is_full_holiday_raw)

        user = request.user

        # Get holiday for this company
        holiday = Holiday.objects.get(id=holiday_id, company__id=company_id)

        # Validate role_ids
        roles = []
        if role_ids:
            roles = CompanyRole.objects.filter(id__in=role_ids, company__id=company_id)
            valid_ids = {str(r.id) for r in roles}
            invalid_ids = set(str(rid) for rid in role_ids) - valid_ids
            if invalid_ids:
                return Response({"success": False, "message": f"Invalid role_ids: {invalid_ids}"},
                                status=status.HTTP_400_BAD_REQUEST)

        # Update fields
        if is_recurring is not None:
            holiday.is_recurring = bool(is_recurring)
        if holiday_title:
            holiday.holiday = holiday_title
        if date:
            holiday.date = date

        # Handle full day holiday and roles
        if 'is_full_holiday' in request.data or role_ids:
            holiday.is_full_holiday = is_full_holiday

            if is_full_holiday:
                roles_to_assign = roles or list(CompanyRole.objects.filter(company__id=company_id))
                holiday.role.set(roles_to_assign)
            else:
                holiday.role.set(roles or [])

        holiday.save()

        # Notification logic
        if holiday.is_full_holiday:
            users = CustomUser.objects.filter(company__id=company_id).distinct()
        else:
            users = CustomUser.objects.filter(company__id=company_id, role__in=holiday.role.all()).distinct()

        tokens = list(FcmToken.objects.filter(user__in=users).values_list('fcm_token', flat=True))
        if tokens:
            send_push_notification(
                tokens,
                'Holiday Update 🎉',
                f"The holiday on {holiday.date} has been updated to \"{holiday.holiday}\"."
            )

        return Response({"success": True, "message": "Holiday updated successfully."}, status=status.HTTP_200_OK)

    except Holiday.DoesNotExist:
        return Response({"success": False, "message": "Holiday not found or you don't have access."},
                        status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(e)
        return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET', 'DELETE'])
def get_holiday(request):
    company_id = request.headers.get('X-Company-ID')

    if not company_id:
        return Response({'success': False, 'message': 'Missing X-Company-ID header.'},
                        status=status.HTTP_400_BAD_REQUEST)

    # 🟩 GET request
    if request.method == 'GET':
        holidays = Holiday.objects.filter(
            Q(company__id=company_id) | Q(is_global=True)
        ).prefetch_related('role')

        data = []
        for h in holidays:
            data.append({
                'id': h.id,
                'holiday': h.holiday,
                'date': str(h.date),
                'is_recurring': h.is_recurring,
                'is_full_holiday': h.is_full_holiday,
                'role_ids': list(h.role.values_list('id', flat=True)),
            })

        return Response({'success': True, 'data': data}, status=200)

    # 🟥 DELETE request
    elif request.method == 'DELETE':
        holiday_id = request.data.get('id')
        if not holiday_id:
            return Response({'success': False, 'message': 'Holiday ID is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            holiday = Holiday.objects.get(id=holiday_id, company__id=company_id)
            holiday.delete()
            return Response({'success': True, 'message': 'Deleted successfully.'},
                            status=status.HTTP_200_OK)
        except Holiday.DoesNotExist:
            return Response({'success': False, 'message': 'Holiday not found for the given company.'},
                            status=status.HTTP_404_NOT_FOUND)



@api_view(['POST', 'GET'])
def add_past_leave(request):
    if request.method == 'GET':
        company_id = request.headers.get('X-Company-ID') or request.query_params.get('company_id')
        if not company_id:
            return Response({'success': False, 'message': 'Company ID required'}, status=400)
        
        users = CustomUser.objects.filter(company__id=company_id, is_active=True).values('id', 'first_name', 'last_name', 'email')
        return Response({'success': True, 'data': list(users)})

    try:
        user_id = request.data.get('user_id')
        leave_id = request.data.get('leave_id')
        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        leave_choice = request.data.get('leave_choice')
        custom_reason = request.data.get('custom_reason')
        status_val = request.data.get('status', 'A') # Default to Approved
        company_id = request.data.get('company_id')

        # Validate inputs
        if not all([user_id, leave_id, from_date, to_date, company_id]):
             return Response({'success': False, 'message': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(id=company_id)
            user = CustomUser.objects.get(id=user_id)
            leave_type = LeaveType.objects.get(id=leave_id)
        except (Company.DoesNotExist, CustomUser.DoesNotExist, LeaveType.DoesNotExist) as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

         # Ensure user belongs to that company
        if not user.company.filter(id=company_id).exists():
             return Response({'success': False, 'message': 'User does not belong to this company'}, status=status.HTTP_400_BAD_REQUEST)

        from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()

        # Calculate days
        leave_days = (to_date_obj - from_date_obj).days + 1
        if leave_choice == 'half_day':
            leave_days *= 0.5
        
        # Deduct credits if applicable
        if leave_type.use_credit:
            credit_year = from_date_obj.year
            credit_obj, created = LeaveCredit.objects.get_or_create(
                user=user, 
                leave_type=leave_type, 
                year=credit_year,
                defaults={'credits': leave_type.initial_credit} 
            )
            
            credit_obj.credits -= leave_days
            credit_obj.save()

        # Create Leave
        leave = Leave.objects.create(
            user=user,
            leave_type=leave_type,
            from_date=from_date_obj,
            to_date=to_date_obj,
            company=company,
            # Map frontend value to model choice
            status=status_val,
            custom_reason=custom_reason,
            days_taken=leave_days
        )
        
        if leave_choice == 'half_day':
            leave.leave_choice = 'H'
        else:
            leave.leave_choice = 'F'
        leave.save()

        return Response({'success': True, 'message': 'Leave record added successfully'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
