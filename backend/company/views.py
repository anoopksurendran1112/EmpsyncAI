from datetime import date, datetime

from .models import Company,CompanyRole,Device,VirtualDevice,CompanyGroup,StaffType,StaffCategory,CompanyUser
from punch.models import PunchRecords
from rest_framework import status
from .serializer import CompanySerializer,DeviceSerializer,StaffTypeSerializer,StaffCategorySerializer
from drf_spectacular.utils import extend_schema,OpenApiParameter, OpenApiTypes
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from user.models import CustomUser
from django.db.models import ProtectedError
from django.core.paginator import Paginator
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.shortcuts import render
from django.views.generic import TemplateView
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.contrib import messages
from .forms import CombinedForm
from .models import College, Machine, User
from dotenv import load_dotenv
import os


load_dotenv()  # loads variables from .env
DEFAULT_JWT_TOKEN = os.getenv("DEFAULT_JWT_TOKEN")


# Create your views here.

def create_all_view(request):
    if request.method == 'POST':
        form = CombinedForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            now = timezone.now()

            # --- Save College ---
            college, created = College.objects.using('secondary').get_or_create(
                code=cd['college_code'],
                defaults={
                    'name': cd['college_name'],
                    'created_at': now,
                    'updated_at': now
                }
            )

            # --- Save Machines ---
            machine_ids = [m.strip() for m in cd['machine_ids'].split(',') if m.strip()]
            for m_id in machine_ids:
                Machine.objects.using('secondary').create(
                    college=college,
                    machine_id=m_id,
                    created_at=now,
                    updated_at=now
                )

            # --- Save User ---
            User.objects.using('secondary').create(
                name=cd['user_name'],
                email=cd['user_email'],
                password=make_password(cd['user_password']),
                created_at=now,
                updated_at=now,
                college_code=cd['college_code'],
                jwt_token=cd.get('jwt_token') or DEFAULT_JWT_TOKEN 
            )
            messages.success(request, "✅ Data inserted successfully into secondary DB.")
            return redirect('create_all')
    else:
        form = CombinedForm()
    return render(request, 'create_college.html', {'form': form})


@extend_schema(request=CompanySerializer,responses=CompanySerializer(many=True))
@api_view(['GET','PUT'])
@permission_classes([AllowAny])
def getCompany(request=CompanySerializer):
    data = request.data.copy()
    if request.method == 'PUT':
        admin_status = request.user.admin
        companId = request.data.get('companyId')
        company = Company.objects.get(id=companId)
        data = request.data.copy()
        serializer = CompanySerializer(company,data=data,partial=True)
        if 'prof_img' in request.FILES:
            data['company_img'] = request.FILES['company_img']

        if admin_status:
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success':True,
                    'message':'Updated successfully',
                    'status':status.HTTP_200_OK,
                    'data':serializer.data
                })

    elif request.method == 'GET':
        companies = Company.objects.all()
        serializer = CompanySerializer(companies,many=True)
        return Response({
            'status': status.HTTP_200_OK,
            'success': True,
            'data': serializer.data
        })

    else:
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'message': 'User is not an admin'
        })


@extend_schema(request=DeviceSerializer, responses=DeviceSerializer)
@api_view(['POST', 'PUT'])  # Handle both POST for creating and PUT for updating
def device(request):
    company_id = request.data.get('company_id')
    admin_status = getattr(request.user, 'admin', False)
    super_admin_status = getattr(request.user, 'super_admin', False)

    if not (admin_status or super_admin_status):
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'message': 'User is not an admin or super admin'
        })

    # Get the company object based on company_id
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'Company not found'
        })

    # Ensure the user belongs to the company (if they are an admin or super admin)
    if request.user.company != company:
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'message': 'You do not belong to this company.'
        })

    # Handling POST - Creating a new device
    if request.method == 'POST':
        # Create a new device with the provided data
        serializer = DeviceSerializer(data=request.data)
        if serializer.is_valid():
            device = serializer.save(company=company)  # Save the new device
            return Response({
                'status': status.HTTP_201_CREATED,
                'message': 'Device created successfully',
                'data': serializer.data
            })
        else:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Invalid data',
                'data': serializer.errors  # Show validation errors if any
            })

    # Handling PUT - Updating an existing device
    elif request.method == 'PUT':
        device_id = request.data.get('device_id')

        if not device_id:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Device ID is required for update'
            })

        try:
            if request.user.company != company:
                return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'message': 'You do not belong to this company.'
                })
            # Try to fetch the existing device by its device_id
            device = Device.objects.get(device_id=device_id, company=company)
        except Device.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'Device not found',
                'data': []
            })

        # We found an existing device; now we update it using the serializer
        serializer = DeviceSerializer(device, data=request.data, partial=True)  # partial=True allows partial updates
        if serializer.is_valid():
            device = serializer.save(company=company)  # Save the updated device
            return Response({
                'status': status.HTTP_200_OK,
                'message': 'Device updated successfully',
                'data': serializer.data
            })
        else:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Invalid data',
                'data': serializer.errors  # Show validation errors if any
            })


@extend_schema(request=CompanySerializer,responses=CompanySerializer(many=True))
@api_view(['POST'])
def addCompany(request=CompanySerializer):
    data = request.data.copy()
   
    serializer = CompanySerializer(data = request.data)
    if request.method == 'POST':
        admin_status = request.user.super_user
        if 'prof_img' in request.FILES:
            data['company_img'] = request.FILES['company_img']

        if admin_status:
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success':True,
                    'message':'company added successfully',
                    'status':status.HTTP_200_OK,
                    'data':serializer.data
                })
    if request.method == 'GET':

        companies = Company.objects.all()
        serializer = CompanySerializer(companies,many=True)

      


        return Response({
            'status': status.HTTP_200_OK,
            'success': True,
            'data': serializer.data
            
        })

        
    else:
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'message': 'Your are not a super user'
        },)
    

@api_view(['GET','DELETE','PUT'])
@permission_classes([AllowAny])
def getCompanyRoles(request, id):
    if request.method == 'GET':    
        if id:
            roles = CompanyRole.objects.filter(company__id=id).values('id', 'role', 'working_hour')
        else:
            roles = CompanyRole.objects.values('id', 'role', 'working_hour')

        return Response({
            'status': status.HTTP_200_OK,
            'success': True,
            'data': list(roles)
        })
    
    elif request.method == 'PUT':
        new_role = request.data.get('new_role')
        working_hour = request.data.get('working_hour')
        id = request.data.get('id')

        if not new_role:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'success': False,
                'message': 'new role is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            role_obj = CompanyRole.objects.get(id=id)
            
            # Check if user is admin of any company associated with this role
            if not CompanyUser.objects.filter(user=request.user, company__in=role_obj.company.all(), is_admin=True).exists():
                 return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'success': False,
                    'message': 'Unauthorized access. Admin privileges required.',
                }, status=status.HTTP_403_FORBIDDEN)

            role_obj.role = new_role
            role_obj.working_hour = working_hour
            role_obj.save()

            return Response({
                'status': status.HTTP_200_OK,
                'success': True,
                'data': {
                    'id': role_obj.id,
                    'role': role_obj.role,
                    'working_hour':working_hour,
                }
            })
        except CompanyRole.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'success': False,
                'message': 'Role not found',
            }, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'DELETE':
        id = request.data.get('id')
        company_id = request.data.get('company_id')
        users = CustomUser.objects.filter(company__in=company_id, role=id)
        users.update( role=None)  # Assuming you are nullifying the role field
        
        if not id:
                return Response({
                    'status': status.HTTP_404_NOT_FOUND,
                    'message': 'ID not provided',
                    'success': False,
                }, status=status.HTTP_404_NOT_FOUND)

        try:
            # Check for admin privileges
            if not CompanyUser.objects.filter(user=request.user, company_id=company_id, is_admin=True).exists():
                 return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'success': False,
                    'message': 'Unauthorized access. Admin privileges required.',
                }, status=status.HTTP_403_FORBIDDEN)

            company = Company.objects.get(id=company_id)
            role = CompanyRole.objects.get(id=id)
            company.roles.remove(role) 
            return Response({
                'status': status.HTTP_200_OK,
                'message': 'Role deleted',
                'success': True,
            }, status=status.HTTP_200_OK)

        except CompanyRole.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'Role not found',
                'success': False,
            }, status=status.HTTP_404_NOT_FOUND)

        except ProtectedError:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Cannot delete role. It is assigned to users.',
                'success': False,
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def addCompanyGroup(request):
    if request.method == 'POST':
        # admin_status = getattr(request.user, 'admin', False)
        # super_admin_status = getattr(request.user, 'super_admin', False)

        # if not (admin_status or super_admin_status):
        #     return Response({
        #         'status': status.HTTP_403_FORBIDDEN,
        #         'message': 'User is not an admin or super admin'
        #     })

        group_name = request.data.get('group')
        short_name = request.data.get('short_name')
        company_id = request.data.get('company_id')
        member_ids = request.data.get('members', [])


        if not group_name or not short_name:
            return Response({
                'success': False,
                'message': 'group name and its short name are required',
            },status=status.HTTP_400_BAD_REQUEST)
        id = company_id[0]
        company = Company.objects.get(id=id)

        # Check for admin privileges
        if not CompanyUser.objects.filter(user=request.user, company=company, is_admin=True).exists():
             return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Unauthorized access. Admin privileges required.',
                'success': False,
            }, status=status.HTTP_403_FORBIDDEN)

     

        new_group = CompanyGroup.objects.create(group=group_name,short_name=short_name,company=company)

        if member_ids:
            # Optimized: Bulk update users who are not already in a group
            updated_count = CustomUser.objects.filter(id__in=member_ids, group__isnull=True).update(group=new_group)
            print(f"Assigned group {new_group.id} to {updated_count} members.")

       

        return Response({
            'success': True,
            'message': 'Group added successfully',
           
        }, status=status.HTTP_201_CREATED)


@api_view(['GET','DELETE','PUT'])
@permission_classes([AllowAny])
def getCompanyGroups(request, id):
    if request.method == 'GET':    
        if id:
            groups = CompanyGroup.objects.filter(company__id=id).values('id', 'group', 'short_name')
        else:
             groups = CompanyGroup.objects.values('id', 'group', 'short_name')

        return Response({
            'status': status.HTTP_200_OK,
            'success': True,
            'data': list(groups)
        })
    
    elif request.method == 'PUT':
        new_group = request.data.get('new_group')
        short_name = request.data.get('short_name')


        id = request.data.get('id')

        if not new_group:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'success': False,
                'message': 'new group is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_obj = CompanyGroup.objects.get(id=id)
            
            # Check for admin privileges
            if not CompanyUser.objects.filter(user=request.user, company=group_obj.company, is_admin=True).exists():
                 return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'success': False,
                    'message': 'Unauthorized access. Admin privileges required.',
                }, status=status.HTTP_403_FORBIDDEN)

            group_obj.group = new_group
            group_obj.short_name = short_name

            group_obj.save()

            return Response({
                'status': status.HTTP_200_OK,
                'success': True,
              
            })
        except CompanyGroup.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'success': False,
                'message': 'group not found',
            }, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'DELETE':

        id = request.data.get('id')
        company_id = request.data.get('company_id')
        users = CustomUser.objects.filter(company__in=company_id, group=id)
        users.update(group=None)  # Assuming you are nullifying the role field
        

        if not id:
                return Response({
                    'status': status.HTTP_404_NOT_FOUND,
                    'message': 'ID not provided',
                    'success': False,
                }, status=status.HTTP_404_NOT_FOUND)

        try:
            # Check for admin privileges
            if not CompanyUser.objects.filter(user=request.user, company_id=company_id, is_admin=True).exists():
                 return Response({
                    'status': status.HTTP_403_FORBIDDEN,
                    'message': 'Unauthorized access. Admin privileges required.',
                    'success': False,
                }, status=status.HTTP_403_FORBIDDEN)

            group = CompanyGroup.objects.get(id=id)
            group.delete()
            return Response({
                'status': status.HTTP_200_OK,
                'message': 'Group deleted',
                'success': True,
            }, status=status.HTTP_200_OK)

        except CompanyGroup.DoesNotExist:
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'Group not found',
                'success': False,
            }, status=status.HTTP_404_NOT_FOUND)

        except ProtectedError:
            return Response({
                'status': status.HTTP_400_BAD_REQUEST,
                'message': 'Cannot delete group. It is assigned to users.',
                'success': False,
            }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'role': {'type': 'string'},
                'company_id': {'type': 'array', 'items': {'type': 'integer'}}
            },
            'required': ['role', 'company_id']
        }
    },
    responses={
        200: {'type': 'object', 'properties': {'message': {'type': 'string'}}},
        400: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
        404: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def addCompanyRoles(request):
    if request.method == 'POST':
        # admin_status = getattr(request.user, 'admin', False)
        # super_admin_status = getattr(request.user, 'super_admin', False)

        # if not (admin_status or super_admin_status):
        #     return Response({
        #         'status': status.HTTP_403_FORBIDDEN,
        #         'message': 'User is not an admin or super admin'
        #     })

        role_name = request.data.get('role')
        working_hour = request.data.get('working_hour')
        raw_company_ids = request.data.get('company_id')

        if not role_name or not raw_company_ids:
            return Response({
                'success': False,
                'message': 'Role name and company IDs are required',
                'status': status.HTTP_400_BAD_REQUEST
            },status=status.HTTP_400_BAD_REQUEST)

        try:
            if isinstance(raw_company_ids, str):
                company_ids = [int(cid.strip()) for cid in raw_company_ids.split(',')]
            else:
                company_ids = [int(cid) for cid in raw_company_ids]

            companies = Company.objects.filter(id__in=company_ids)
            if not companies.exists():
                return Response({
                    'success': False,
                    'message': 'No valid companies found for provided IDs',
                    'status': status.HTTP_400_BAD_REQUEST
                })

            # Check for admin privileges for ALL provided companies
            admin_companies_count = CompanyUser.objects.filter(
                user=request.user, 
                company__in=companies, 
                is_admin=True
            ).values('company').distinct().count()

            if admin_companies_count != companies.count():
                 return Response({
                    'success': False,
                    'message': 'Unauthorized access. Admin privileges required for all selected companies.',
                    'status': status.HTTP_403_FORBIDDEN
                }, status=status.HTTP_403_FORBIDDEN)

            company_role = CompanyRole.objects.create(role=role_name,working_hour=working_hour)
            company_role.company.set(companies)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error: {str(e)}',
                'status': status.HTTP_400_BAD_REQUEST
            })

        return Response({
            'success': True,
            'message': 'Role added successfully',
            'status': status.HTTP_201_CREATED,
            'data': {
                'id': company_role.id,
                'role': company_role.role,
                'companies': [c.company_name for c in company_role.company.all()]
            }
        }, status=status.HTTP_201_CREATED)


@extend_schema(
 parameters=[
        OpenApiParameter(
            name='user_id',
            description='Biometric ID of the user',
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY
        ),
        OpenApiParameter(
            name='device_id',
            description='Device ID associated with the company',
            required=True,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY
        ),
       
    ],
    responses={
        200: {'type': 'object', 'properties': {'message': {'type': 'string'}}},
        400: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
        404: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_contact(request):
    
    user_id = request.GET.get('user_id')
    device_id = request.GET.get('device_id')
    punch_date =  timezone.now().date()
   

    # Check if both user_id and device_id are provided
    if not user_id or not device_id:
         return JsonResponse({
                'status': status.HTTP_406_NOT_ACCEPTABLE,
                'message': 'Please provide both user id and device id'
            }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Attempt to fetch the device using device_id
        device = Device.objects.get(device_id=device_id)
        company_name = device.company.company_name
        device_entry_type = device.entry_type,
    except Device.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Device not found'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        # Attempt to fetch the user using user_id and the associated company
        user = CustomUser.objects.get(biometric_id=user_id, company=device.company)
    except CustomUser.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    

    company = device.company
    company_device_ids = list(
            Device.objects.using('default')
            .filter(company=company)
            .values_list('device_id', flat=True)
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
                is_sms = user.is_sms
            else:
                is_sms = True

        # 3️⃣ WhatsApp Logic
        if company.strict_whatsapp:
            is_whatsapp = True
        elif company.enable_whatsapp:
            if company.allow_individual_whatsapp:
                is_whatsapp = user.is_whatsapp
            else:
                is_whatsapp = True
    

    if company.id == 5:


        # Optional resync reorder
        all_punches = PunchRecords.objects.using('secondary').filter(
            user_id=user_id,
            device_id__in=company_device_ids,
            punch_time__date=punch_date
        ).order_by('punch_time')

        for i, punch in enumerate(all_punches):
            if device.entry_type not in ['Check-In', 'Check-Out']:
                punch.status = "Check-In" if i % 2 == 0 else "Check-Out"
                punch.save(using='secondary')


    return JsonResponse({
        "success": True,
        "name": user.first_name,
        "company": company_name,
        "mobile": user.mobile,
        "device_entry_type": device_entry_type,
        "is_sms": is_sms,
        "is_whatsapp": is_whatsapp
    }, status=status.HTTP_200_OK)
  
    



@api_view(['POST'])
def add_biometric_device(request):
    device_id = request.data.get('device_id')
    company_id = request.data.get('company_id')

    if not device_id:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'device_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    biometric_device = Device.objects.filter(device_id=device_id).first()

    if biometric_device:
        return Response({
            'status': status.HTTP_409_CONFLICT,
            'message': 'Device already exists.'
        }, status=status.HTTP_409_CONFLICT)

    # Create and save the device
    new_device = Device(device_id=device_id,company_id=company_id)
    new_device.save()

    return Response({
        'status': status.HTTP_201_CREATED,
        'message': 'Biometric device added successfully.',
        'device_id': new_device.device_id
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_biometric_device(request, page):
    company_id = request.headers.get('X-Company-ID')

    if not company_id:
        return Response({'success': False, 'message': 'X-Company-ID header is missing.'}, status=400)

    try:
        company_id = int(company_id)
    except ValueError:
        return Response({'success': False, 'message': 'Invalid company ID.'}, status=400)

    devices = Device.objects.filter(company_id=company_id)

    device_list = [
        {
            'id': device.id,
            'device_id': device.device_id,
            'is_active': device.is_active,
            'from_date': device.from_date,
            'to_date': device.to_date,
        }
        for device in devices
    ]

    paginator = Paginator(device_list, 10)
    page_data = paginator.get_page(page or 1)

    return Response({
        'success': True,
        'status': status.HTTP_200_OK,
        'total': paginator.count,
        'page': int(page or 1),
        'total_page': paginator.num_pages,
        'devices': page_data.object_list
    }, status=status.HTTP_200_OK)



@api_view(['PUT', 'DELETE'])
def update_biometric_device(request, id):
    company_id = request.headers.get('X-Company-ID')

    if not company_id:
        return Response({'success': False, 'message': 'X-Company-ID header is missing.'}, status=400)

    try:
        company_id = int(company_id)
    except ValueError:
        return Response({'success': False, 'message': 'Invalid company ID.'}, status=400)

    try:
        device = Device.objects.get(id=id, company_id=company_id)
    except Device.DoesNotExist:
        return Response({'success': False, 'message': 'Device not found or does not belong to the specified company.'}, status=404)

    if request.method == 'PUT':
        request.data['company'] = company_id  # Match serializer field name

        serializer = DeviceSerializer(instance=device, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Biometric device updated'}, status=200)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        # Delete any associated virtual device first
        VirtualDevice.objects.filter(virtual_device=device.device_id).delete()
        device.delete()
        return Response({'success': True, 'message': 'Biometric device deleted successfully'}, status=200)


@api_view(['GET'])
def get_virtual_devices(request,page=None):
        company_id = request.headers.get('X-Company-ID')
        

        devices = VirtualDevice.objects.filter(company_id=company_id).order_by('is_active')
        device_list = [
            {
                'id': device.id,
                'username':device.user.first_name,
                                'biometric_id':device.user.biometric_id,
                                                                'email':device.user.email,


                'prof_img': device.user.prof_img.url if device.user.prof_img and hasattr(device.user.prof_img, 'url') else None,
                'virtual_device': device.virtual_device,
                'is_active': device.is_active
            } for device in devices
        ]
        paginator = Paginator(device_list,5)
        page_data = paginator.get_page(page)
        return Response({
            'status': status.HTTP_200_OK,
            'total': paginator.count,
            'page': page,
            'total_page': paginator.num_pages,
            'devices': page_data.object_list
        }, status=status.HTTP_200_OK)








@api_view(['PUT'])
def update_virtual_device(request):
    device_id = request.data.get('device_id')

    if device_id is None:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'device_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        device = VirtualDevice.objects.get(id=device_id)
    except VirtualDevice.DoesNotExist:
        return Response({
            'status': status.HTTP_404_NOT_FOUND,
            'message': 'Device not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Toggle the value
    device.is_active = not device.is_active
    device.save()

    return Response({
        'status': status.HTTP_200_OK,
        'message': f'Device status updated to {"active" if device.is_active else "inactive"}',
        'is_active': device.is_active
    })


@api_view(['DELETE'])
def delete_virtual_device(request,id):

    if id is None:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'device_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        device = VirtualDevice.objects.get(id=id)

    except VirtualDevice.DoesNotExist:
        return Response({
            'status': status.HTTP_404_NOT_FOUND,
            'message': 'Device not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    Device.objects.filter(device_id=device.virtual_device).delete()
    
    device.delete()

  

    return Response({
        'status': status.HTTP_200_OK,
        'message': 'Virtual device deleted',
       
    })


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def staff_category_view(request, category_id=None):
    # 1. Extract Company ID (GET uses query_params, others use data body)
    if request.method == 'GET':
        company_id = request.query_params.get('company_id')
    else:
        company_id = request.data.get('company_id')

    if not company_id:
        return Response({'error': 'company_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for admin privileges for non-GET methods
    if request.method != 'GET':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not CompanyUser.objects.filter(user=request.user, company_id=company_id, is_admin=True).exists():
             return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Unauthorized access. Admin privileges required.',
            }, status=status.HTTP_403_FORBIDDEN)

    # 2. Handle LIST (GET without ID) and CREATE (POST)
    if category_id is None:
        if request.method == 'GET':
            categories = StaffCategory.objects.filter(company_id=company_id)
            serializer = StaffCategorySerializer(categories, many=True)
            return Response({'categories': serializer.data}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            serializer = StaffCategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({'status':status.HTTP_201_CREATED,'message':'Staff category created successfully', 'data':serializer.data}, status=status.HTTP_201_CREATED)
            return Response({'status':status.HTTP_400_BAD_REQUEST,'message':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Handle DETAIL (GET with ID), UPDATE (PUT), and DELETE
    else:
        # get_object_or_404 ensures the ID exists AND belongs to the company
        category = get_object_or_404(StaffCategory, id=category_id, company_id=company_id)

        if request.method == 'GET':
            serializer = StaffCategorySerializer(category)
            return Response({'status':status.HTTP_200_OK,'data':serializer.data}, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            serializer = StaffCategorySerializer(category, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'status':status.HTTP_200_OK,'message':'Staff category updated successfully', 'data':serializer.data}, status=status.HTTP_200_OK)
            return Response({'status':status.HTTP_400_BAD_REQUEST,'message':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            category.delete()
            return Response({'status':status.HTTP_200_OK,'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def staff_type_view(request, type_id=None):
    # 1. Extract Company ID (GET uses query_params, others use data body)
    if request.method == 'GET':
        company_id = request.query_params.get('company_id')
    else:
        company_id = request.data.get('company_id')

    if not company_id:
        return Response({'error': 'company_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for admin privileges for non-GET methods
    if request.method != 'GET':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not CompanyUser.objects.filter(user=request.user, company_id=company_id, is_admin=True).exists():
             return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'message': 'Unauthorized access. Admin privileges required.',
            }, status=status.HTTP_403_FORBIDDEN)

    # 2. Handle LIST (GET without ID) and CREATE (POST)
    if type_id is None:
        if request.method == 'GET':
            types = StaffType.objects.filter(company_id=company_id)
            serializer = StaffTypeSerializer(types, many=True)
            return Response({'types': serializer.data}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            serializer = StaffTypeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({'status':status.HTTP_201_CREATED,'message':'Staff type created successfully', 'data':serializer.data}, status=status.HTTP_201_CREATED)
            return Response({'status':status.HTTP_400_BAD_REQUEST,'message':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Handle DETAIL (GET with ID), UPDATE (PUT), and DELETE
    else:
        # get_object_or_404 ensures the ID exists AND belongs to the company
        staff_type = get_object_or_404(StaffType, id=type_id, company_id=company_id)

        if request.method == 'GET':
            serializer = StaffTypeSerializer(staff_type)
            return Response({'status':status.HTTP_200_OK,'data':serializer.data}, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            serializer = StaffTypeSerializer(staff_type, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'status':status.HTTP_200_OK,'message':'Staff type updated successfully', 'data':serializer.data}, status=status.HTTP_200_OK)
            return Response({'status':status.HTTP_400_BAD_REQUEST,'message':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            staff_type.delete()
            return Response({'status':status.HTTP_200_OK,'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
