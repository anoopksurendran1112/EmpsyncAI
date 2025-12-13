from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework import status
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .utils import fix_punch as punch
from .models import PunchRecords,VirtualPunchRecords
from user import models as u
from user import serializer as s
from django.core.paginator import Paginator
from .serializer import PunchPostSerializer,PunchSerializer,TodayPunchPostSerializer
from collections import defaultdict
from datetime import date,datetime,timedelta, timezone
from company.models import Device,VirtualDevice,Company,CompanyUser
from datetime import date as dt_date, datetime, timedelta
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
import math
from django.utils.dateparse import parse_date

from haversine import haversine, Unit
from user.models import CustomUser
import requests
from .utils.deduplication import deduplicate_punches
from .utils.process_day import process_single_day


@api_view(['POST'])
def fixPunchStatus(request):
    company_id = request.data.get("company_id")
    user_id = request.data.get("user_id")
    date = request.data.get("date")
    try:

        result = punch.fix_punch(company_id=company_id, user_id=user_id, date=date)

        return Response(result)


    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # if result.get("success") and result.get("fixed", 0) > 0 and not user_id:




@api_view(['PATCH'])
def updatePunch(request):
    try:
        record_id = request.data.get('id')
        biometric_id = request.data.get('biometric_id')
        punch_time_str = request.data.get('punch_time')

        if not record_id or not biometric_id:
            return Response({"error": "id and biometric_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Parse punch_time only if provided
        punch_time = None
        if punch_time_str:
            punch_time = make_aware(parse_datetime(punch_time_str))

        update_data = {}
        if punch_time:
            update_data['punch_time'] = punch_time

        if not update_data:
            return Response({"error": "No valid fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        # Perform partial update
        updated = PunchRecords.objects.using('secondary').filter(
            id=record_id,
            user_id=biometric_id
        ).update(**update_data)

        if updated:
            return Response({"success": True}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Record not found"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@extend_schema(
    request=PunchPostSerializer,
    responses=PunchSerializer(many=True)
)
@api_view(['POST','PATCH'])
def getPunches(request, page=None):

    if request.method == 'PATCH':
        try:
            updates = request.data if isinstance(request.data, list) else [request.data]

            results = []
            for item in updates:
                record_id = item.get('id')
                biometric_id = item.get('biometric_id')
                punch_time_str = item.get('punch_time')

                if not record_id or not biometric_id:
                    continue  # skip invalid

                punch_time = None
                if punch_time_str:
                    punch_time = make_aware(parse_datetime(punch_time_str))

                update_data = {}
                if punch_time:
                    update_data['punch_time'] = punch_time

                if update_data:
                    updated = PunchRecords.objects.using('secondary').filter(
                        id=record_id,
                        user_id=biometric_id
                    ).update(**update_data)
                    results.append({"id": record_id, "updated": bool(updated)})

            return Response({"success":True,'message':'Updated'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"success":False,"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
    if request.method == 'POST':
        try:
            biometric_id = request.data.get('biometric_id')
            company_id = request.data.get('company_id')
            start_date = datetime.strptime(request.data.get('start_date'), '%Y-%m-%d').date()
            end_date = datetime.strptime(request.data.get('end_date'), '%Y-%m-%d').date()

            # Determine punch mode
            company = Company.objects.get(id=company_id)
            multi_mode = company.punch_mode == 'M'

            devices = Device.objects.filter(company_id=company_id)
            device_ids = list(devices.values_list('device_id', flat=True))

            punchDataRaw = PunchRecords.objects.using('secondary').filter(
                user_id=biometric_id,
                device_id__in=device_ids,
                punch_time__date__gte=start_date,
                punch_time__date__lte=end_date,
            ).order_by('punch_time').distinct() # Ensure ascending order for deduplication logic

            # Apply Deduplication
            punchDataRaw = deduplicate_punches(punchDataRaw)

            

            grouped_by_day = defaultdict(list)
            for punch in punchDataRaw:
                punch_date = punch.punch_time.date()
                grouped_by_day[punch_date].append(punch)
            

            date_list = []
            current_date = end_date
            while current_date >= start_date:
                date_list.append(current_date)
                current_date -= timedelta(days=1)

            today = datetime.now().date()
            filtered_punches = []

            for current_day in date_list:
                punches = grouped_by_day.get(current_day, [])
                
                day_results = process_single_day(current_day, punches, multi_mode, today)
                filtered_punches.extend(day_results)

            paginator = Paginator(filtered_punches, 20)
            pageData = paginator.get_page(page)

            serialized_data = []
            for item in pageData:
                if isinstance(item, dict):
                    serialized_data.append({
                        'date': item['date'].strftime('%Y-%m-%d') if isinstance(item['date'], dt_date) else item['date'],
                        'punch_time': item.get('punch_time'),
                        'message': item.get('message'),
                        'status': item.get('status')
                    })
                else:
                    serializer = PunchSerializer(item)
                    data = serializer.data
                    if item.punch_time.date() == today and not multi_mode:
                        punches = grouped_by_day[item.punch_time.date()]
                        check_ins = [p for p in punches if p.status == 'Check-In']
                        check_outs = [p for p in punches if p.status == 'Check-Out']
                        if (check_ins and not check_outs) or (check_outs and not check_ins):
                            data['day_status'] = 'pending'
                            data['message'] = 'Partial punch recorded, day ongoing'
                    serialized_data.append(data)

            return Response({
                'status': status.HTTP_200_OK,
                'total': paginator.count,
                'page': page,
                'total_page': paginator.num_pages,
                'data': serialized_data,
                'multi_mode': multi_mode
            })

        except AuthenticationFailed as e:
            error_msg = 'Token is expired' if 'Token is expired' in str(e) else 'Invalid token.'
            return Response({
                'status': status.HTTP_401_UNAUTHORIZED,
                'message': error_msg + ' Please log in again.'
            }, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(request=TodayPunchPostSerializer, responses=TodayPunchPostSerializer(many=True))
@api_view(['POST'])
def todayPunch(request):
    today = datetime.now().date()
    biometric_id = request.data.get('biometric_id')
    company_id = request.data.get('company_id')

    company = Company.objects.get(id=company_id)
    multi_mode = company.punch_mode == 'M'
  


    devices = Device.objects.filter(company_id=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))

  

    punch = PunchRecords.objects.using('secondary').filter(
        user_id=biometric_id,
        device_id__in=device_ids,
        punch_time__date=today
    ).order_by('punch_time') 

    # Apply Deduplication
    punch = deduplicate_punches(punch)

    if not punch:
        return Response({
            'status': status.HTTP_404_NOT_FOUND,
            'data': None,
            'message': 'No punch record found for today.'
        })

    check_ins = [p for p in punch if p.status == 'Check-In']
    check_outs = [p for p in punch if p.status == 'Check-Out']

    first_check_in = min(check_ins, key=lambda x: x.punch_time).punch_time if check_ins else None
    last_check_out = max(check_outs, key=lambda x: x.punch_time).punch_time if check_outs else None

    serializer = PunchSerializer(punch, many=True)

    return Response({
        'status': status.HTTP_200_OK,
        'first_check_in': first_check_in,
        'last_check_out': last_check_out,
        'data': serializer.data,
        'multi_mode':multi_mode,
    }, status=status.HTTP_200_OK)


# @extend_schema(
#     request=PunchPostSerializer,
#     responses=PunchSerializer(many=True)
# )
# @api_view(['POST'])
# def getPunches(request, page):
#     try:
#         biometric_id = request.data.get('biometric_id')
#         company_id = request.data.get('company_id')
#         start_date = datetime.strptime(request.data.get('start_date'), '%Y-%m-%d').date()
#         end_date = datetime.strptime(request.data.get('end_date'), '%Y-%m-%d').date()

#         devices = Device.objects.filter(company_id=company_id)
#         device_ids = list(devices.values_list('device_id', flat=True))

#         punchDataRaw = PunchRecords.objects.using('secondary').filter(
#             user_id=biometric_id,
#             device_id__in=device_ids,
#             punch_time__date__gte=start_date,
#             punch_time__date__lte=end_date,
#         ).order_by('-punch_time')

#         grouped_by_day = defaultdict(list)
#         for punch in punchDataRaw:
#             punch_date = punch.punch_time.date()
#             grouped_by_day[punch_date].append(punch)

#         # Generate all dates in range
#         date_list = []
#         current_date = end_date
#         while current_date >= start_date:
#             date_list.append(current_date)
#             current_date -= timedelta(days=1)

#         today = datetime.now().date()
#         filtered_punches = []

#         for current_day in date_list:
#             punches = grouped_by_day.get(current_day, [])
#             check_ins = [p for p in punches if p.status == 'Check-In']
#             check_outs = [p for p in punches if p.status == 'Check-Out']
#             first_check_in = check_ins[-1] if check_ins else None
#             latest_check_out = check_outs[0] if check_outs else None

#             if not punches:
#                 filtered_punches.append({
#                     'date': current_day,
#                     'message': 'No punches recorded',
#                     'status': 'pending' if current_day == today else 'leave'
#                 })
#             elif not first_check_in and not latest_check_out:
#                 filtered_punches.append({
#                     'date': current_day,
#                     'message': 'Day ongoing, no punches yet' if current_day == today else 'No punches recorded',
#                     'status': 'pending' if current_day == today else 'leave'
#                 })
#             elif (first_check_in and not latest_check_out) or (latest_check_out and not first_check_in):
#                 partial = first_check_in or latest_check_out
#                 filtered_punches.append({
#                     'date': current_day,
#                     'punch_time': partial.punch_time.strftime('%H:%M:%S'),
#                     'message': 'Partial punch recorded',
#                     'status': 'pending' if current_day == today else 'absent'
#                 })
#             else:
#                 filtered_punches.append(first_check_in)
#                 if latest_check_out != first_check_in:
#                     filtered_punches.append(latest_check_out)

#         # Paginate
#         paginator = Paginator(filtered_punches, 20)
#         pageData = paginator.get_page(page)

#         # Serialize
#         serialized_data = []
#         for item in pageData:
#             if isinstance(item, dict):
#                 serialized_data.append({
#                     'date': item['date'].strftime('%Y-%m-%d') if isinstance(item['date'], dt_date) else item['date'],
#                     'punch_time': item.get('punch_time'),
#                     'message': item.get('message'),
#                     'status': item.get('status')
#                 })
#             else:
#                 serializer = PunchSerializer(item)
#                 data = serializer.data
#                 if item.punch_time.date() == today:
#                     punches = grouped_by_day[item.punch_time.date()]
#                     check_ins = [p for p in punches if p.status == 'Check-In']
#                     check_outs = [p for p in punches if p.status == 'Check-Out']
#                     if (check_ins and not check_outs) or (check_outs and not check_ins):
#                         data['day_status'] = 'pending'
#                         data['message'] = 'Partial punch recorded, day ongoing'
#                 serialized_data.append(data)

#         return Response({
#             'status': status.HTTP_200_OK,
#             'total': paginator.count,
#             'page': page,
#             'total_page': paginator.num_pages,
#             'data': serialized_data,
#         })

#     except AuthenticationFailed as e:
#         if 'Token is expired' in str(e):
#             return Response({
#                 'status': status.HTTP_401_UNAUTHORIZED,
#                 'message': "Your session has expired. Please refresh your token or log in again."
#             }, status=status.HTTP_401_UNAUTHORIZED)

#         return Response({
#             'status': status.HTTP_401_UNAUTHORIZED,
#             'message': "Invalid token. Please log in again to get a new token."
#         }, status=status.HTTP_401_UNAUTHORIZED)

    
# @extend_schema(request=TodayPunchPostSerializer,responses=TodayPunchPostSerializer(many=True))
# @api_view(['POST'])
# def todayPunch(request):
#     today = datetime.now().date()




#     biometric_id = request.data.get('biometric_id')
#     company_id = request.data.get('company_id')

#     devices = Device.objects.filter(company_id=company_id)
#     device_ids = list(devices.values_list('device_id', flat=True))

#     punch = PunchRecords.objects.using('secondary').filter(
#         user_id=biometric_id,
#         device_id__in=device_ids,
#         punch_time__date=(today)
#     ).using('secondary').order_by('-punch_time')

    



#     if punch is None:
#         return Response({
#             'status': status.HTTP_404_NOT_FOUND,
#             'data': None,
#                         'message': 'No punch record found for today.'

#         })
    
#     check_ins = [p for p in punch if p.status == 'Check-In']
#     check_outs = [p for p in punch if p.status == 'Check-Out']

#     first_check_in = min(check_ins, key=lambda x: x.punch_time).punch_time if check_ins else None
#     last_check_out = max(check_outs, key=lambda x: x.punch_time).punch_time if check_outs else None

#     serializer = PunchSerializer(punch, many=True)

#     return Response({
#         'status': status.HTTP_200_OK,
#         'first_check_in': first_check_in,
#         'last_check_out': last_check_out,
#         'data': serializer.data
#     },status=status.HTTP_200_OK)






@api_view(['POST'])
def add_virtual_punch(request):
    virtual_device_id = request.data.get('virtual_device_id')
    biometric_id = request.data.get('biometric_id')
    punch_time_str = request.data.get('punch_time')
    company_id = request.data.get('company_id')

    if request.user.is_authenticated and not request.user.is_active:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'Your account is deactivated. Contact admin.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    lat = request.data.get('latitude')
    lon = request.data.get('longitude')
    speed = request.data.get('speed')
    company = Company.objects.get(id=company_id)
    punch_time = datetime.strptime(punch_time_str, '%Y-%m-%d %H:%M:%S')

    punch_date = punch_time.strftime('%d %B %Y')  # Day Month Year (e.g., 15 May 2025)

# Convert the time to 12-hour format (with AM/PM)
    punch_time_only = punch_time.strftime('%I:%M:%S %p') 

    company_user = CompanyUser.objects.filter(user=request.user).first()
    is_admin = company_user.is_admin if company_user else False
    MAX_ALLOWED_DISTANCE_KM = company.perimeter
    MAX_TRAVEL_SPEED_THRESHOLD = company.travel_speed_threshold

    if not request.user.is_active:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'You are not allowed to punch.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not (virtual_device_id and biometric_id and punch_time_str):

        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'Missing required fields.'
        }, status=status.HTTP_400_BAD_REQUEST)

    punch_time = make_aware(parse_datetime(punch_time_str))

    device = VirtualDevice.objects.filter(virtual_device=virtual_device_id).first()

    if device:
        if not is_admin and device.user != request.user:

            return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'This device is already registered to another user.'
            }, status=status.HTTP_403_FORBIDDEN)

        if not is_admin and not device.is_active:

            return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Device is not active. Please contact admin.'
            }, status=status.HTTP_403_FORBIDDEN)

        if not is_admin and speed is not None and float(speed) > MAX_TRAVEL_SPEED_THRESHOLD:


            return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Speed threshold exceeded. Please check again.'
            }, status=status.HTTP_403_FORBIDDEN)

        if not is_admin and not request.user.is_wfh:

            coord1 = (lat, lon)
            coord2 = (company.latitude,company.longitude)
            distance_km = haversine(coord1, coord2, unit=Unit.KILOMETERS)

            if distance_km > MAX_ALLOWED_DISTANCE_KM:

                return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'message': 'You are too far from the company location.'
                }, status=status.HTTP_403_FORBIDDEN)
    else:
        if not is_admin and not request.user.is_wfh:

            return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Remote punch not allowed. Contact admin.'
            }, status=status.HTTP_403_FORBIDDEN)

        VirtualDevice.objects.create(
            virtual_device=virtual_device_id,
            user=request.user,
            company=company,
        )

        # return Response({
        #     'status': status.HTTP_201_CREATED,
        #     'message': 'Device registered. Please contact admin to activate it.'
        # }, status=status.HTTP_201_CREATED)

    # Determine punch user (for admin this might be someone else)
    punch_user = request.user
    if is_admin:
        try:
            punch_user = CustomUser.objects.get(biometric_id=biometric_id)
        except CustomUser.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'User with given biometric ID not found.'
            }, status=status.HTTP_404_NOT_FOUND)

   # Determine punch status
    last_punch = PunchRecords.objects.using('secondary') \
        .filter(user_id=biometric_id) \
        .order_by('-punch_time') \
        .first()

    new_status = 'Check-In'

    if last_punch:
        # Check if the last punch was today
        if last_punch.punch_time.date() == punch_time.date():
            if last_punch.status == 'Check-In':
                new_status = 'Check-Out'
            elif last_punch.status == 'Check-Out':
                new_status = 'Check-In'

        # Determine punch status

    # if last_punch:
    #     # Check if the last punch was today
    #     if last_punch.punch_time.date() == punch_time.date():
    #         # If there is already a check-in today, all next punches should be check-out
    #         if PunchRecords.objects.using('secondary') \
    #             .filter(user_id=biometric_id, punch_time__date=punch_time.date(), status='Check-In') \
    #             .exists():
    #             new_status = 'Check-Out'

    
    active_device = Device.objects.filter(is_active=True,company=company).first()


    # Save punch record
    PunchRecords.objects.using('secondary').create(
        user_id=biometric_id,
        punch_time=punch_time,
        device_id=active_device.device_id,
        status=new_status
    )

    # Log virtual punch
    record = VirtualPunchRecords.objects.create(
        user=punch_user,
        punch_time=punch_time,
        latitude=lat,
        longitude=lon,
        admin=request.user if is_admin else None,
        device_id=virtual_device_id,
        physical_device = active_device.device_id,
        status=new_status
    )

    is_sms = False
    is_whatsapp = False

    # 1️⃣ If company soft disabled all communications
    if not company.soft_disable:
        # 2️⃣ SMS Logic
        if company.strict_sms:
            is_sms = True
        elif company.enable_sms:
            if company.allow_individual_sms:
                is_sms = punch_user.is_sms
            else:
                is_sms = True

        # 3️⃣ WhatsApp Logic
        if company.strict_whatsapp:
            is_whatsapp = True
        elif company.enable_whatsapp:
            if company.allow_individual_whatsapp:
                is_whatsapp = punch_user.is_whatsapp
            else:
                is_whatsapp = True


    sms_url = 'https://www.fast2sms.com/dev/bulkV2'

    sms_payload = {
    "authorization": "EApz1UNdI2KToYWBS5O0Fl4QDM8G6jxvi97PgaRhLqHrfwyeZuMsG2LUHqg6ZQoCKhbwXBz71pi9vANV",
    "route": "dlt",
    "sender_id": "KOCDIG",
    "message": "188103",  # Template ID from Fast2SMS
    "variables_values": f"{punch_user.first_name}|{company.company_name}{punch_time_only}|{punch_date}",
    "flash": "0",
    "numbers": punch_user.mobile,
    "schedule_time": ""  # Optional: leave empty for instant


}
    if record.id:
        
        try:
            if is_whatsapp and is_sms:
                requests.get(sms_url, params=sms_payload)
                requests.get(
                    f'http://bhashsms.com/api/sendmsg.php?user=kochidigital_bw&pass=123456&sender=BUZWAP&phone={punch_user.mobile}&text=biopunch_v2&priority=wa&stype=normal&Params={punch_user.first_name}, {punch_time_only}, {punch_date}'
                )

            elif is_sms:
                requests.get(sms_url, params=sms_payload)

            elif is_whatsapp:
                requests.get(
                    f'http://bhashsms.com/api/sendmsg.php?user=kochidigital_bw&pass=123456&sender=BUZWAP&phone={punch_user.mobile}&text=alert_v1&priority=wa&stype=normal&Params={punch_user.first_name}, {punch_time_only}, {punch_date}'
                )

        except Exception as e:
            print(f"Failed to send SMS/WhatsApp: {e}")



    return Response({
        'status': status.HTTP_201_CREATED,
'message': f'{new_status} ✅ Your virtual punch has been recorded. Thank you! 🙌'
    }, status=status.HTTP_201_CREATED)



@api_view(["POST"])
@permission_classes([AllowAny])
def punch_report(request):
    try:
        company_id = request.data.get("company_id")
        from_date_str = request.data.get("from_date")
        to_date_str = request.data.get("to_date")

        if not all([company_id, from_date_str, to_date_str]):
            return Response({"error": "Missing required fields."}, status=400)

        from_date = make_aware(datetime.strptime(from_date_str, "%Y-%m-%d"))
        to_date = make_aware(datetime.strptime(to_date_str, "%Y-%m-%d") + timedelta(days=1))

        # Get company and punch mode
        company = Company.objects.get(id=company_id)
        punch_mode = company.punch_mode  # 'M' or 'S'

        # ✅ Fetch users with valid biometric IDs
        users = CustomUser.objects.filter(company__id=company_id)\
            .exclude(biometric_id__isnull=True)\
            .exclude(biometric_id='')

        user_map = {str(u.biometric_id).strip(): u for u in users}

        # ✅ Fetch punches
        punches = PunchRecords.objects.using('secondary').filter(
            user_id__in=user_map.keys(),
            punch_time__range=(from_date, to_date)
        ).order_by("user_id", "punch_time")

        # ✅ Organize punches by user and date
        user_daily_data = defaultdict(lambda: defaultdict(list))

        for punch in punches:
            biometric_id = str(punch.user_id).strip()
            punch_date = punch.punch_time.date()
            user_daily_data[biometric_id][punch_date].append(punch)

        final_result = []

        for biometric_id, daily_records in user_daily_data.items():
            user = user_map.get(biometric_id)
            if not user:
                continue

            user_result = {
                "user_id": biometric_id,
                "name": user.get_full_name(),
                # "role": user.role.role if user.role else "",
                # "group": user.group.group if user.group else "",
                # "gender": user.get_gender_display() if user.gender else "",
                # "working_mode": "WFH" if user.is_wfh else "On-site",
                "daily_logs": []
            }

            for punch_date, records in daily_records.items():
                check_ins = [p for p in records if p.status == "Check-In"]
                check_outs = [p for p in records if p.status == "Check-Out"]

                work_duration = 0
                if punch_mode == 'M':
                    check_ins.sort(key=lambda x: x.punch_time)
                    check_outs.sort(key=lambda x: x.punch_time)

                    in_index = 0
                    while in_index < len(check_ins):
                        in_time = check_ins[in_index].punch_time
                        out = next((o for o in check_outs if o.punch_time > in_time), None)
                        if out:
                            work_duration += (out.punch_time - in_time).total_seconds() / 3600
                            check_outs.remove(out)
                        in_index += 1
                else:
                    # Single punch mode
                    if check_ins and check_outs:
                        work_duration = (
                            max(check_outs, key=lambda x: x.punch_time).punch_time -
                            min(check_ins, key=lambda x: x.punch_time).punch_time
                        ).total_seconds() / 3600

                user_result["daily_logs"].append({
                    # "date": punch_date.strftime("%Y-%m-%d"),
                    "check_ins": [p.punch_time.isoformat() for p in check_ins],
                    "check_outs": [p.punch_time.isoformat() for p in check_outs],
                    # "working_hours": round(work_duration, 2)
                })

            final_result.append(user_result)

        # ✅ Return final formatted JSON response
        return Response(final_result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)




@api_view(["POST"])
def punch_report_by_date(request):
    try:
        company_id = request.data.get("company_id")
        from_date_str = request.data.get("from_date")
        to_date_str = request.data.get("to_date")

        if not all([company_id, from_date_str, to_date_str]):
            return Response({"error": "Missing required fields."}, status=400)

        from_date = make_aware(datetime.strptime(from_date_str, "%Y-%m-%d"))
        to_date = make_aware(datetime.strptime(to_date_str, "%Y-%m-%d") + timedelta(days=1))

        # Get company and punch mode
        company = Company.objects.get(id=company_id)
        company_devices = list(Device.objects.filter(company_id=company_id).values_list("device_id", flat=True)
)


        punch_mode = company.punch_mode  # 'M' or 'S'

        # ✅ Fetch users with valid biometric_id only
        users = CustomUser.objects.filter(company__id=company_id)\
            .exclude(biometric_id__isnull=True).exclude(biometric_id='')

        user_map = {str(u.biometric_id).strip(): u for u in users}


        # ✅ Fetch punches
        punches = PunchRecords.objects.using('secondary').filter(
            user_id__in=user_map.keys(),
            device_id__in=company_devices,
            punch_time__range=(from_date, to_date)
        ).order_by("user_id", "punch_time")


        # ✅ Organize punches by biometric ID and date
        user_daily_data = defaultdict(lambda: defaultdict(list))  # {biometric_id: {date: [punches]}}

        for punch in punches:
            biometric_id = str(punch.user_id).strip()
            punch_date = punch.punch_time.date()
            user_daily_data[biometric_id][punch_date].append(punch)

        final_result = []

        for biometric_id, daily_records in user_daily_data.items():
            biometric_id = biometric_id.strip()
            user = user_map.get(biometric_id)

            if not user:
                continue

            user_result = {
                "user_id": biometric_id,
                "name": user.get_full_name(),
                "role": user.role.role if user.role else "",
                "group": user.group.group if user.group else "",
                "gender": user.get_gender_display() if user.gender else "",
                "working_mode": "WFH" if user.is_wfh else "On-site",
                "daily_logs": []
            }

            total_hours = 0

            for punch_date, records in daily_records.items():
                check_ins = [p for p in records if p.status == "Check-In"]
                check_outs = [p for p in records if p.status == "Check-Out"]
                work_duration = 0

                if punch_mode == 'M':
                    check_ins.sort(key=lambda x: x.punch_time)
                    check_outs.sort(key=lambda x: x.punch_time)

                    in_index = 0
                    while in_index < len(check_ins):
                        in_time = check_ins[in_index].punch_time
                        out = next((o for o in check_outs if o.punch_time > in_time), None)
                        if out:
                            duration = (out.punch_time - in_time).total_seconds() / 3600
                            work_duration += duration
                            check_outs.remove(out)
                        in_index += 1
                else:
                    # Single punch mode
                    if check_ins and check_outs:
                        duration = (
                            max(check_outs, key=lambda x: x.punch_time).punch_time -
                            min(check_ins, key=lambda x: x.punch_time).punch_time
                        ).total_seconds() / 3600
                        work_duration = duration

                user_result["daily_logs"].append({
                    "date": punch_date.strftime("%Y-%m-%d"),
                   "check_ins": [p.punch_time.isoformat() for p in check_ins],
"check_outs": [p.punch_time.isoformat() for p in check_outs],
                    "working_hours": round(work_duration, 2)
                })

                total_hours += work_duration

            user_result["total_working_hours"] = round(total_hours, 2)
            final_result.append(user_result)

        return Response({
            "company_id": company_id,
            "from_date": from_date_str,
            "to_date": to_date_str,
            "user_count": len(final_result),
            "records": final_result
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)



@api_view(['POST'])
@permission_classes([AllowAny])
def addPunch(request):
    if isinstance(request.data, list):
        punches = request.data
   
    else:
        return Response({"message": "Invalid data format. Expected list or 'punches' key."},
                        status=status.HTTP_400_BAD_REQUEST)

    results = []

    for punch_data in punches:
        biometric_id = punch_data.get('user_id')
        punch_time_str = punch_data.get('punch_time')
        device_id = punch_data.get('device_id')

        if not (biometric_id and punch_time_str and device_id):
            results.append({"punch_time": punch_time_str, "status": "Missing required fields"})
            continue

        # Convert punch_time to aware datetime
        try:
            punch_time = make_aware(datetime.fromisoformat(punch_time_str))
        except Exception:
            results.append({"punch_time": punch_time_str, "status": "Invalid punch_time format"})
            continue

        punch_date = punch_time.date()

        if earliest_date is None or punch_date < earliest_date:
            earliest_date = punch_date

        # Get device
        try:
            device = Device.objects.using('default').get(device_id=device_id)
        except Device.DoesNotExist:
            results.append({"punch_time": punch_time_str, "status": "Invalid device ID"})
            continue

        # Get all company devices
        company = device.company
        company_to_update = company
        
        company_device_ids = list(
            Device.objects.using('default')
            .filter(company=company)
            .values_list('device_id', flat=True)
        )

        punches_today = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=company_device_ids,
            punch_time__date=punch_date
        ).order_by('punch_time')


        # Skip duplicate
        if punches_today.filter(punch_time=punch_time).exists():
            results.append({"punch_time": punch_time_str, "status": "Skipped duplicate"})
            continue

        # Determine status before saving
        if device.entry_type in ['Check-In', 'Check-Out']:
            punch_status = device.entry_type
        else:
            punches_before = punches_today.filter(punch_time__lt=punch_time).count()
            punch_status = "Check-In" if punches_before % 2 == 0 else "Check-Out"

        # Save the punch
        PunchRecords.objects.using('secondary').create(
            user_id=biometric_id,
            punch_time=punch_time,
            device_id=device_id,
            status=punch_status
        )



        # Optional resync reorder
        if punches_today and punch_time < punches_today.last().punch_time:
            all_punches = PunchRecords.objects.using('secondary').filter(
                user_id=biometric_id,
                device_id__in=company_device_ids,
                punch_time__date=punch_date
            ).order_by('punch_time')

            for i, punch in enumerate(all_punches):
                if device.entry_type not in ['Check-In', 'Check-Out']:
                    punch.status = "Check-In" if i % 2 == 0 else "Check-Out"
                    punch.save(using='secondary')


        results.append({"punch_time": punch_time_str, "status": f"{punch_status} recorded"})

    if earliest_date and company_to_update:
        Company.objects.filter(id=company_to_update.id).update(last_sync=earliest_date)

    return Response(results, status=status.HTTP_201_CREATED)