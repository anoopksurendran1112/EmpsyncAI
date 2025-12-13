from django.shortcuts import render
from django.db import connections
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.permissions import AllowAny
from .serializer import UserSerializer,LoginSerializer,GetUserSerializer,OTPResetSerializer
from company.serializer import CompanySerializer
from company import models as c
from drf_spectacular.utils import extend_schema,extend_schema_field
from .models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator
from datetime import date,timedelta
from company.models import CompanyGroup, CompanyUser, Device,Company
from punch.models import PunchRecords
import random
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import requests
from django.http import HttpResponse
from notification.models import FcmToken
from django.contrib.auth import logout as django_logout
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.mail import send_mail
from django.core.cache import cache  # You can also use a model if you prefer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from collections import defaultdict
from django.db.models import Q,F
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from datetime import datetime, timedelta
from django.conf import settings
import jwt

def generate_token_user(user):

    token = RefreshToken.for_user(user)

    access_token = token.access_token

    company_user = c.CompanyUser.objects.filter(user=user).first()
    access_token['admin'] = company_user.is_admin if company_user else False 

    access_token['super_user'] = user.is_superuser


    

    # Return both the refresh and access tokens
    return {
        'refresh_token': str(token),  # Return the refresh token as string
        'access_token': str(access_token),  # Return the access token as string with added claims
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def privacy_policy(request):
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>EmpsyncAI Privacy Policy</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; color: #222; }
        h2, h3 { color: #333; }
        hr { margin: 30px 0; border: none; border-top: 1px solid #ccc; }
        p, li { margin-bottom: 12px; }
        ul { padding-left: 20px; }
        .section { margin-bottom: 40px; }
      </style>
    </head>
    <body>
      <h2>EmpsyncAI Privacy Policy</h2>
      <p><strong>Effective Date:</strong> May 14, 2025</p>

      <p>At EmpsyncAI ("we," "our," or "us"), we prioritize your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, protect, and share your data when you use the EmpsyncAI mobile application (the “App”) for virtual attendance and punch-in services. By using the App, you agree to the practices described in this policy.</p>

      <hr>

      <div class="section">
        <h3>1. Information We Collect</h3>
        <p>To deliver our services effectively, we collect the following categories of information:</p>

        <h4>1.1 Personal Information</h4>
        <ul>
          <li><strong>Photographic Data:</strong> Profile images uploaded or captured by your organization’s administrator to verify identity during virtual punch-ins.</li>
          <li><strong>Contact Information:</strong> Email address and phone number, provided by you or your employer, used for account linking and communication (e.g., SMS/WhatsApp notifications).</li>
          <li><strong>Employee Identifiers:</strong> Username, employee ID, and biometric ID (a unique, organization-assigned identifier, not related to fingerprints) used for authentication and attendance tracking.</li>
        </ul>

        <h4>1.2 Location Data</h4>
        <p><strong>Geolocation:</strong> Precise location is captured only at the time of virtual punch-in or punch-out to confirm presence within authorized premises.</p>

        <h4>1.3 Device Information</h4>
        <ul>
          <li><strong>Device Identifiers:</strong> Information such as device ID, model, and OS version is collected to generate a unique virtual device ID, which helps prevent fraudulent activity.</li>
          <li><strong>Technical Data:</strong> IP address, crash logs, and app usage data are collected for diagnostics and performance enhancement.</li>
        </ul>

        <h4>1.4 Usage Data</h4>
        <ul>
          <li><strong>Punch Records:</strong> Includes timestamps (e.g., in yyyy-MM-dd HH:mm:ss format), punch duration, and associated metadata.</li>
          <li><strong>User Preferences:</strong> Includes notification settings (SMS, WhatsApp) and work-from-home (WFH) status managed through the app.</li>
        </ul>

        <p><em>Note:</em> We do not collect fingerprint data or sensitive personal data such as health or financial information, unless explicitly required by your organization and with prior notice.</p>
      </div>

      <hr>

      <div class="section">
        <h3>2. How We Use Your Information</h3>
        <p>Your information is used solely for the purposes of providing and improving EmpsyncAI services, including:</p>
        <ul>
          <li>Identity Verification: Confirming employee identity via profile images and organization-assigned identifiers.</li>
          <li>Attendance Tracking: Logging punch-in/punch-out actions and verifying location in line with your organization’s attendance policies.</li>
          <li>Fraud Prevention: Using virtual device IDs to detect unauthorized access or duplicate punches.</li>
          <li>Communication: Sending punch confirmations or updates via SMS/WhatsApp (as per your settings).</li>
          <li>App Performance: Improving stability, usability, and security by analyzing usage data and system logs.</li>
          <li>Compliance: Fulfilling legal, contractual, or organizational obligations.</li>
        </ul>
      </div>

      <hr>

      <div class="section">
        <h3>3. How We Share Your Information</h3>
        <p>We do not sell, rent, or trade your personal information. We may share data under the following limited circumstances:</p>
        <ul>
          <li><strong>With Your Organization:</strong> Authorized administrators (e.g., HR, IT staff) can access relevant data (e.g., punch records, profile photos) for managing employee attendance.</li>
          <li><strong>Service Providers:</strong> Anonymized or aggregated data may be shared with third-party vendors (e.g., cloud, analytics, SMS gateways), under strict confidentiality obligations.</li>
          <li><strong>Legal Requirements:</strong> Data may be disclosed to comply with applicable laws, court orders, or government requests (e.g., under India’s DPDP Act, GDPR, or CCPA).</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or reorganization, user data may be transferred, with continued protection under this policy.</li>
        </ul>
      </div>

      <hr>

      <div class="section">
        <h3>4. Data Security</h3>
        <p>We implement strong security measures to protect your data:</p>
        <ul>
          <li><strong>Encryption:</strong> Data is encrypted both in transit (TLS/SSL) and at rest.</li>
          <li><strong>Access Controls:</strong> Only authorized personnel and systems can access your data, with multi-factor authentication and role-based access.</li>
          <li><strong>Device Validation:</strong> Virtual device IDs prevent punch spoofing without collecting sensitive biometrics.</li>
          <li><strong>Audits:</strong> Regular security reviews and vulnerability assessments are conducted to safeguard our infrastructure.</li>
        </ul>
        <p>While we strive to protect your data, no system is completely secure. We advise users to maintain secure device access and report any suspicious activity.</p>
      </div>

      <hr>

      <div class="section">
        <h3>5. Data Retention</h3>
        <p>We retain personal data only as long as necessary to:</p>
        <ul>
          <li>Provide the services described in this policy,</li>
          <li>Comply with legal or regulatory obligations,</li>
          <li>Follow your organization’s data retention policies.</li>
        </ul>
        <p>Once data is no longer required, it is securely deleted or anonymized. For example, punch records may be retained during active employment, while profile images may be deleted upon account deactivation.</p>
      </div>

      <hr>

      <div class="section">
        <h3>6. Your Privacy Rights</h3>
        <p>Depending on your location and applicable privacy laws, you may have rights including:</p>
        <ul>
          <li>Access: Obtain a copy of your personal data.</li>
          <li>Correction: Rectify inaccuracies in your contact or account information.</li>
          <li>Deletion: Request deletion of your personal data, subject to legal/organizational constraints.</li>
          <li>Restriction: Limit certain data processing activities (e.g., notifications).</li>
          <li>Portability: Receive your data in a machine-readable format.</li>
          <li>Objection: Object to specific data processing (e.g., usage analytics).</li>
        </ul>
        <p>To exercise these rights, contact your organization’s administrator or reach out to us directly (see Section 9). EU residents may also contact their Data Protection Authority (DPA).</p>
      </div>

      <hr>

      <div class="section">
        <h3>7. International Data Transfers</h3>
        <p>Your data may be stored or processed on servers located outside your country (e.g., India, U.S., EU). Where applicable, we implement safeguards such as:</p>
        <ul>
          <li>Standard Contractual Clauses (SCCs),</li>
          <li>Adequacy decisions,</li>
          <li>Data processing agreements.</li>
        </ul>
        <p>Your organization’s administrator determines the primary storage jurisdiction in line with their compliance obligations.</p>
      </div>

      <hr>

      <div class="section">
        <h3>8. Updates to This Policy</h3>
        <p>This Privacy Policy may be updated periodically to reflect:</p>
        <ul>
          <li>Legal or regulatory changes,</li>
          <li>App feature updates,</li>
          <li>User feedback.</li>
        </ul>
        <p>If significant changes occur, we will notify you via:</p>
        <ul>
          <li>In-app alerts,</li>
          <li>SMS, WhatsApp, or email (if enabled),</li>
          <li>Updates published on our website (if applicable).</li>
        </ul>
        <p>Continued use of the App following changes constitutes your acceptance of the updated policy.</p>
      </div>

      <hr>

      <div class="section">
        <h3>9. Contact Us</h3>
        <p>If you have questions or concerns regarding your privacy or wish to exercise your rights, please contact:</p>
        <p>
          EmpsyncAI<br>
          📧 Email: info@kochi.digital<br>
          🏢 Address: Kochi Digital, Door No. 24/422,<br>
          Cochin University P.O, Kalamassery,<br>
          Ernakulam, Kerala - 682022<br>
          📞 Phone: +91 85906 86885
        </p>
        <p>For technical issues (e.g., punch-in errors, account access), please reach out to your organization’s administrator or contact us via the above email.</p>
      </div>

      <hr>

      <div class="section">
        <h3>10. Additional Information</h3>

        <h4>10.1 Third-Party Services</h4>
        <p>Some App functionalities may rely on third-party providers (e.g., SMS gateways, cloud hosting) who operate under their own privacy policies. We recommend reviewing their terms.</p>

        <h4>10.2 Children’s Privacy</h4>
        <p>This App is not intended for use by individuals under the age of 16. If you believe we have collected data from a minor, please contact us to request deletion.</p>

        <h4>10.3 Cookies and Tracking</h4>
        <p>We do not use traditional web cookies. However, device identifiers may be used for authentication and analytics. Notification settings can be managed in the App preferences.</p>

        <h4>10.4 Legal Compliance</h4>
        <p>We adhere to relevant data privacy laws, including:</p>
        <ul>
          <li>India’s Digital Personal Data Protection Act, 2023 (DPDP Act)</li>
          <li>General Data Protection Regulation (GDPR)</li>
          <li>California Consumer Privacy Act (CCPA)</li>
        </ul>
        <p>Your organization’s administrator is responsible for ensuring alignment with local employment and data laws.</p>
      </div>

      <hr>

      <p>Thank you for using EmpsyncAI. We are committed to protecting your privacy while delivering reliable virtual attendance services.</p>
    </body>
    </html>
    """
    return HttpResponse(html_content, content_type='text/html; charset=utf-8')


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email'}
            },
            'required': ['email']
        }
    },
    responses={
        200: {'type': 'object', 'properties': {'message': {'type': 'string'}}},
        404: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])

def request_otp(request):
    email = request.data.get('email')
    User = get_user_model()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'Enter registered mail id'}, status=404)

    otp = random.randint(100000, 999999)
    cache.set(f'reset_otp_{email}', str(otp), timeout=300)  # Store OTP for 5 mins

    subject = 'Your One-Time Password (OTP)'
    message = f"""
    Hi,

    Here is your OTP code: {otp}

    This code will expire in 10 minutes. If you didn’t request this, please ignore this message.

    Thanks,  
    The EmpsyncAI Team
    """

    try:
        send_mail(
            subject,
            message,
            from_email='no-reply@yourapp.com',
        recipient_list=[email],
        )
    except Exception as e:
        return Response({'message': 'Failed to send email', 'error': str(e)}, status=500)

    return Response({'message': 'OTP sent to your email'}, status=200)


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email'},
                'otp': {'type': 'string'}
            },
            'required': ['email', 'otp']
        }
    },
    responses={
        200: {'type': 'object', 'properties': {'message': {'type': 'string'}}},
        400: {'type': 'object', 'properties': {'error': {'type': 'string'}}},
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    entered_otp = request.data.get('otp')

    actual_otp = cache.get(f'reset_otp_{email}')
    if actual_otp is None:
        return Response({'message': 'OTP expired or not found.'}, status=400)

    if entered_otp != actual_otp:
        return Response({'message': 'Invalid OTP.'}, status=400)

    # Mark as verified (optional)
    cache.set(f'reset_verified_{email}', True, timeout=600)

    return Response({'message': 'OTP verified. You may now reset your password.'}, status=200)


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email'},
                'new_password': {'type': 'string'}
            },
            'required': ['email', 'new_password']
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
def reset_password(request):
    email = request.data.get('email')
    new_password = request.data.get('new_password')

    verified = cache.get(f'reset_verified_{email}')
    if not verified:
        return Response({'message': 'OTP not verified or expired.'}, status=400)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'User not found.'}, status=404)

    user.set_password(new_password)
    user.save()

    # Clean up
    cache.delete(f'reset_otp_{email}')
    cache.delete(f'reset_verified_{email}')

    return Response({'message': 'Password reset successful.'}, status=200)



@extend_schema(request=UserSerializer,responses=UserSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def signUp(request):
   
    data = request.data.copy()

   
    try:
        validate_email(data['email'])
       
    except ValidationError:
        return Response({'message': 'Enter a valid email', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
   

    if CustomUser.objects.filter(email=data.get('email')).exists():
      
        return Response({'message': 'Email already exists.', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
    
    if CustomUser.objects.filter(mobile=data.get('mobile')).exists():
        
        return Response({'message': 'Mobile number already exists.', 'success': False}, status=status.HTTP_400_BAD_REQUEST)

    biometric_id = data.get('biometric_id')
    company_id = data.get('company_id')
    role_id = data.get('role_id')
    if biometric_id and CustomUser.objects.filter(biometric_id=biometric_id, company__id=company_id).exists():
        return Response({'message': 'Oops! This Biometric ID is already linked to this company', 'success': False}, status=status.HTTP_400_BAD_REQUEST)

    
    if role_id and c.CompanyRole.objects.filter(id=role_id).exists():
        role = c.CompanyRole.objects.get(id=role_id)

    if 'prof_img' in request.FILES:
        data['prof_img'] = request.FILES['prof_img']

    try:
        company = c.Company.objects.get(id=company_id)
        
    except c.Company.DoesNotExist:
        return Response({'message': 'Invalid company ID.', 'success': False,'status': status.HTTP_400_BAD_REQUEST})

  
    data.pop('fcm_token', None)

    serializer = UserSerializer(data=data)

    if serializer.is_valid():
        user = serializer.save()
        user.set_password(data['password'])
        user.company.set([company])
        user.role = role

       
        user.save()

        user.company.set([company])  # ✅ This fixes your error
        

        if not user.parent_company:
            user.parent_company = company
        user.role = role
        user.save()

        if 'fcm_token' in data:
          FcmToken.objects.update_or_create(user=user, fcm_token=data['fcm_token'])


        token = generate_token_user(user)

        companySerializer = CompanySerializer(company)

       

        return Response({

            'message': 'Signup success',
            'status': status.HTTP_201_CREATED,
            'success': True,
            'access_token': token['access_token'],
            'refresh_token': token['refresh_token'],
            'data': {
                'user':serializer.data,
                'company': companySerializer.data
            }
        },status=status.HTTP_201_CREATED)

    else:
    

        return Response({
            'message': serializer.errors,
            'success': False,
            'status':status.HTTP_400_BAD_REQUEST
        })



@extend_schema(request=LoginSerializer,responses=LoginSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
      # Allow anyone to access this view (no authentication required)

    if request.method == 'POST':

        email = request.data.get('email')
        password = request.data.get('password')
        fcm_token = request.data.get('fcm_token')

        try:

            user = CustomUser.objects.get(email=email)
            is_active = user.is_active
           
            if is_active:

                if user.check_password(password): 

                    token = generate_token_user(user)
                    serializer = UserSerializer(user)
                    company = user.company.first()
                    companySerializer = CompanySerializer(company)
                    company_user = c.CompanyUser.objects.filter(user=user, company=company).first()
                    is_admin = company_user.is_admin if company_user else False

                    if fcm_token:
                        FcmToken.objects.update_or_create(user=user,fcm_token=fcm_token)
                    response = Response({
                        'status': status.HTTP_200_OK,
                        'success': True,
                        'access_token':token['access_token'],
                        'refresh_token':token['refresh_token'],
                        'data': {
                        'is_admin': is_admin,
                        'user':  serializer.data,
                        'company': companySerializer.data
                        },
                    })
                    # set cookies here
                    response.set_cookie(
                        key="access_token",
                        value=token["access_token"],
                        httponly=True,
                        samesite="Lax",  # Use "Lax" or "Strict" unless cross-origin is required
                        secure= False,  # Secure in production
                        max_age=60 * 60,
                        path="/",
                        domain=None
                    )
                    response.set_cookie(
                        key="refresh_token",
                        value=token["refresh_token"],
                        httponly=True,
                        samesite="Lax",  # Use "Lax" or "Strict" unless cross-origin is required
                        secure= False,  # Secure in production
                        max_age=60 * 60 * 24 * 7,
                        path="/",
                        domain=None
                    )

                    return response

                else:
                    return Response({
                        'status': status.HTTP_401_UNAUTHORIZED,
                        'message': 'Invalid credentials: Incorrect password',
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
            else:
                 return Response({
                        'status': status.HTTP_401_UNAUTHORIZED,
                        'message': 'Your account is inactive at the moment',
                    }, status=status.HTTP_401_UNAUTHORIZED)

        except CustomUser.DoesNotExist:
            # If the user does not exist, return error for invalid email
            return Response({
                'status': status.HTTP_404_NOT_FOUND,
                'message': 'User with this email does not exist'
            },status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'mobile': {'type': 'integer'},
            },
            'required': ['mobile']
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
def request_login_otp(request):
    mobile = request.data.get('mobile')
    app_hash = request.data.get('app_hash')

    try:
        user = CustomUser.objects.get(mobile=mobile)
        is_active = user.is_active
        if  is_active:
            otp = random.randint(100000, 999999)
            cache.set(f'reset_otp_{mobile}', str(otp), timeout=300)  # 5 mins

            sms_url = f'https://www.fast2sms.com/dev/bulkV2?authorization=EApz1UNdI2KToYWBS5O0Fl4QDM8G6jxvi97PgaRhLqHrfwyeZuMsG2LUHqg6ZQoCKhbwXBz71pi9vANV&route=dlt&sender_id=MROACP&message=165842&variables_values={otp}\n{app_hash}| Empysync AI&flash=0&numbers={mobile}&schedule_time='
            whatsapp_url = f'http://bhashsms.com/api/sendmsg.php?user=kochidigital_bw&pass=123456&sender=Sender ID&phone={mobile}&text=kochi_otp&priority=wa&stype=auth&Params={otp}'
            
            sms_response = requests.get(sms_url)
            whatsapp_response = requests.get(whatsapp_url)

            if sms_response.status_code == 200 or whatsapp_response.status_code==200:
                
                return Response({
                    'status': status.HTTP_200_OK,
                    'message': 'OTP sent successfully.',
                    'success':True
                    # Don’t include OTP in response in production!
                },status=status.HTTP_200_OK)
            else:
                # Log error or handle failure
                return Response({
                    'status': status.HTTP_401_UNAUTHORIZED,
                    'message': 'Failed to send otp',
                    'success':False
                    # Don’t include OTP in response in production!
                },status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                            'status': status.HTTP_401_UNAUTHORIZED,
                            'message': 'Your account is inactive at the moment',
                        }, status=status.HTTP_401_UNAUTHORIZED)

        # Call your SMS/OTP sending API
        # send_sms(phone, f"Your OTP is {otp}")


    except CustomUser.DoesNotExist:
        return Response({
            'status': 404,
            'message': 'User with this mobile does not exist.'
        }, status=404)
    
    
    

@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'mobile': {'type': 'integer'},
                'otp': {'type': 'integer'},
            },
            'required': ['mobile', 'otp']
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
def verify_login_otp(request):
    mobile = request.data.get('mobile')
    otp = request.data.get('otp')
    fcm_token = request.data.get('fcm_token')

    cached_otp = cache.get(f'reset_otp_{mobile}')

    if cached_otp is None:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'OTP expired or not found.',
                        'success': False,

        }, status=status.HTTP_400_BAD_REQUEST,)

    if str(otp) != str(cached_otp):
        return Response({
            'status': status.HTTP_401_UNAUTHORIZED,
            'success': False,
            'message': 'Invalid OTP.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = CustomUser.objects.get(mobile=mobile)

        if user.is_active:

            # Invalidate the OTP after successful use
            cache.delete(f'reset_otp_{mobile}')
            serializer = UserSerializer(user)
            companySerializer = CompanySerializer(user.company.first())
            token = generate_token_user(user)
            FcmToken.objects.update_or_create(user=user,fcm_token=fcm_token)
            company = user.company.first()
            companySerializer = CompanySerializer(company)
            company_user = c.CompanyUser.objects.filter(user=user, company=company).first()
            is_admin = company_user.is_admin if company_user else False


        
            response = Response({
                        'status': status.HTTP_200_OK,
                        'success': True,
                        'access_token':token['access_token'],
                        'refresh_token':token['refresh_token'],
                        'data': {
                        'is_admin': is_admin,
                        'user':  serializer.data,
                        'company': companySerializer.data
                        },
                    })

                    # set cookies here
            response.set_cookie(
                key="access_token",
                value=token["access_token"],
                httponly=True,
                samesite="Lax",  # Use "Lax" or "Strict" unless cross-origin is required
                secure= False,  # Secure in production
                max_age=60 * 60,
                path="/",
                domain=None
            )
            response.set_cookie(
                key="refresh_token",
                value=token["refresh_token"],
                httponly=True,
                samesite="Lax",  # Use "Lax" or "Strict" unless cross-origin is required
                secure= False,  # Secure in production
                max_age=60 * 60 * 24 * 7,
                path="/",
                domain=None
            )

            return response
        else: 
            return Response({
                        'status': status.HTTP_401_UNAUTHORIZED,
                        'message': 'Your account is inactive at the moment',
                    }, status=status.HTTP_401_UNAUTHORIZED)

        

    except CustomUser.DoesNotExist:
        return Response({
            'status': status.HTTP_404_NOT_FOUND,
            'message': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def changePassword(request):
    user = request.user

    # Ensure the user is authenticated
    if not user.is_authenticated:
        return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    # Verify the current password
    if not user.check_password(current_password):
        return Response(
            {"message": "Current password is incorrect"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set and save the new password
    user.set_password(new_password)
    user.save()

    return Response(
        {"message": "Password changed successfully",'status':status.HTTP_200_OK},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])  # Correct method type
def logout_view(request):
    try:
        # Log out the user session
        django_logout(request)

        # Remove FCM token if provided
        fcm_token = request.data.get('fcm_token')
        if fcm_token:
            FcmToken.objects.filter(fcm_token=fcm_token).delete()

        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': 'Logout failed',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def delete_user(request):
    user_id = request.data.get('user_id')

    try:
        user = CustomUser.objects.get(id=user_id)
        user.delete()
        return Response({'success': True, 'message': 'User deleted successfully.'}, status=status.HTTP_200_OK)
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)



@extend_schema(request=GetUserSerializer, responses=UserSerializer(many=True))
@api_view(['POST'])
def getAllUsers(request, page):
    
    company_id = request.data.get('company_id')
    # ----------------------------------------------------------------------
    # 1. AUTHENTICATION & INITIAL SETUP
    # ----------------------------------------------------------------------
    try:
        if not c.CompanyUser.objects.get(user=request.user, company=company_id).is_admin:
            return Response({
                'status': status.HTTP_403_FORBIDDEN,
                'success': False,
                'message': 'Unauthorized access.'
            })
    except c.CompanyUser.DoesNotExist:
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'success': False,
            'message': 'Unauthorized access or Company not found.'
        })

    gender = request.data.get('gender')
    is_active = request.data.get('is_active')
    roles = request.data.get('roles', [])
    groups = request.data.get('groups', [])
    search = request.data.get('search', '').strip()

    # Get company settings for later use
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
         return Response({'status': status.HTTP_404_NOT_FOUND, 'message': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)
        
    avg_interval = company.work_summary_interval
    # punch_mode = company.punch_mode # Not used in filtering/querying, but good to keep
    
    # ----------------------------------------------------------------------
    # 2. QUERY BUILDING AND DB SORTING
    # ----------------------------------------------------------------------
    filters = Q(company__id=company_id) & Q(is_active=True) & ~Q(id=request.user.id)

    if gender:
        filters &= Q(gender__in=gender)
    if is_active is not None:
        filters &= Q(is_active=is_active)
    if roles:
        filters &= Q(role_id__in=roles) # Assumes 'role' is a ForeignKey to CompanyRole
    if groups:
        filters &= Q(group_id__in=groups) # Assumes 'group' is a ForeignKey to CompanyGroup
    if search:
        filters &= (
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )

    # --- PERFORMANCE FIX 1: Sort and Filter in the Database ---
    users = CustomUser.objects.filter(filters).distinct().order_by(
        F('group__short_name').asc(nulls_last=True),  # Groups A-Z, NULLs last
        'first_name',                                 # Then by Name
        'last_name',
        'id'                                          # Tie-breaker
    )

    # ----------------------------------------------------------------------
    # 3. GLOBAL COUNTS (Must run on the full filtered QuerySet)
    # ----------------------------------------------------------------------
    male_count = users.filter(gender='M').count()
    female_count = users.filter(gender='F').count()
    others_count = users.filter(gender='O').count()

    if not users.exists():
         return Response({
             'status': status.HTTP_200_OK, 'total': 0, 'page': page, 'total_page': 0,
             'success': True, 'message': 'No users found.', 'male_count': 0,
             'female_count': 0, 'others_count': 0, 'data': []
         })

    # ----------------------------------------------------------------------
    # 4. PAGINATION (Apply Paginator to the QuerySet)
    # ----------------------------------------------------------------------
    # NOTE: The QuerySet is lazily evaluated, so no data is fetched yet.
    paginator = Paginator(users, 10)
    
    # Handle invalid page number (optional, Paginator is robust)
    try:
        page_data = paginator.page(page)
    except Exception:
        page_data = paginator.page(paginator.num_pages)

    # The actual users to process (only 10 of them!)
    users_on_current_page = page_data.object_list
    
    # ----------------------------------------------------------------------
    # 5. CONTEXT & TIME SETUP (for the loop)
    # ----------------------------------------------------------------------
    today = date.today()
    devices = Device.objects.filter(company=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))

    # Determine average working hour field based on company interval
    if avg_interval == 'W':
         avg_hour_field = 'weekly_avg_working_hour'
    else: # 'M' or fallback
         avg_hour_field = 'monthly_avg_working_hour'

    user_data = []

    # ----------------------------------------------------------------------
    # 6. TARGETED PROCESSING (N+1 queries now run only 10 times)
    # ----------------------------------------------------------------------
    for user in users_on_current_page:
        
        # Pass company_id to the serializer for correct role/group lookup
        serializer = UserSerializer(user, context={'company_id': company_id})
        serialized_user = serializer.data
        
        biometric_id = user.biometric_id
        
        # --- Heavy Operation: Runs only for users on this page ---
        today_punches = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=device_ids,
            punch_time__date=today
        ).order_by('punch_time')

        # --- Work Hour Calculation ---
        avg_hour = getattr(user, avg_hour_field)
        serialized_user['avg_working_hour'] = round(avg_hour, 2)
        
        role_working_hour = user.role.working_hour if user.role and user.role.working_hour is not None else None
        threshold_hour = role_working_hour if role_working_hour is not None else company.daily_working_hours
        serialized_user['is_below_avg_hours'] = avg_hour < threshold_hour
        
        # --- Today's Punch Calculation ---
        punch_ins = [punch.punch_time for punch in today_punches if punch.status == 'Check-In']
        punch_outs = [punch.punch_time for punch in today_punches if punch.status == 'Check-Out']

        check_in = min(punch_ins) if punch_ins else None
        check_out = max(punch_outs) if punch_outs else None

        serialized_user['check_in'] = check_in.isoformat() if check_in else None
        serialized_user['check_out'] = check_out.isoformat() if check_out else None
        
        # --- Punch Pairing (Multi-Mode) ---
        punch_pairs = []
        if company.punch_mode == 'M':
            remaining_check_ins = punch_ins.copy()
            remaining_check_outs = punch_outs.copy()

            # Note: This pairing logic is preserved from your original code
            while remaining_check_ins and remaining_check_outs:
                earliest_in = min(remaining_check_ins)
                next_out = min((p for p in remaining_check_outs if p > earliest_in), default=None)
                if next_out:
                    punch_pairs.append({
                        "check_in": earliest_in.isoformat(),
                        "check_out": next_out.isoformat()
                    })
                    remaining_check_ins.remove(earliest_in)
                    remaining_check_outs.remove(next_out)
                else:
                    remaining_check_ins.remove(earliest_in)

        serialized_user['punch_pairs'] = punch_pairs

        user_data.append(serialized_user)

    # ----------------------------------------------------------------------
    # 7. FINAL RESPONSE
    # ----------------------------------------------------------------------
    return Response({
        'status': status.HTTP_200_OK,
        'total': paginator.count,
        'page': page_data.number,
        'total_page': paginator.num_pages,
        'male_count': male_count,
        'female_count': female_count,
        'others_count': others_count,
        'success': True,
        'message': 'No users found.' if paginator.count == 0 else 'Success',
        'data': user_data # Now 'user_data' is the serialized, processed list for the current page
    })



# @extend_schema(request=GetUserSerializer, responses=GetUserSerializer(many=True))
# @api_view(['POST'])
# def getAllUsers(request, page):
#     company_id = request.data.get('company_id')

#     if not c.CompanyUser.objects.get(user=request.user, company=company_id).is_admin:
#         return Response({
#             'status': status.HTTP_403_FORBIDDEN,
#             'success': False,
#             'message': 'Unauthorized access.'
#         })

#     gender = request.data.get('gender')  # string
#     is_active = request.data.get('is_active')  # boolean
#     roles = request.data.get('roles', [])  # List of role IDs
#     groups = request.data.get('groups', [])  # List of role IDs

#     avg_hour_filter = request.data.get('avg_hour_filter')
#     company = Company.objects.get(id=company_id)
#     avg_interval = company.work_summary_interval
#     punch_mode = company.punch_mode  # Get the punch mode: 'M' or 'S'
#     search = request.data.get('search', '').strip()

#     filters = Q(company__id=company_id)

#     if gender:
#         filters &= Q(gender__in=gender)
#     if is_active is not None:
#         filters &= Q(is_active=is_active)
#     if roles:
#         filters &= Q(role_id__in=roles)
#     if groups:
#         filters &= Q(group_id__in=groups)
#     if search:
#         filters &= (
#             Q(first_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(email__icontains=search)
#         )


#     # users = CustomUser.objects.filter(filters).order_by('group__group', 'role__role').exclude(id=request.user.id).exclude(is_active=False).distinct()
#     users = CustomUser.objects.filter(filters).exclude(id=request.user.id).exclude(is_active=False).distinct()

    
#     # Calculate gender counts
#     male_count = users.filter(gender='M').count()
#     female_count = users.filter(gender='F').count()
#     others_count = users.filter(gender='O').count()

#     devices = Device.objects.filter(company=company_id)
#     device_ids = list(devices.values_list('device_id', flat=True))
#     today = date.today()

#     if avg_interval == 'W':
#         # Weekly: from Monday to Sunday of current week
#         start_date = today - timedelta(days=today.weekday())
#         end_date = start_date + timedelta(days=6)
#     elif avg_interval == 'M':
#         # Monthly: from the 1st of the month to today
#         start_date = today.replace(day=1)
#         end_date = today
#     else:
#         # Fallback to weekly if undefined
#         start_date = today - timedelta(days=today.weekday())
#         end_date = start_date + timedelta(days=6)

#     if not users.exists():
#         return Response({
#             'status': status.HTTP_200_OK,
#             'total': 0,
#             'page': page,
#             'total_page': 0,
#             'success': True,
#             'message': 'No users found.',
#             'male_count': 0,
#             'female_count': 0,
#             'others_count': 0,
#             'data': []
#         })

#     user_data = []

#     for user in users:
#         biometric_id = user.biometric_id
#         serialized_user = UserSerializer(user).data
        
#         # Calculate today's Check-In and Check-Out
#         today_punches = PunchRecords.objects.using('secondary').filter(
#             user_id=biometric_id,
#             device_id__in=device_ids,
#             punch_time__date=today
#         ).order_by('punch_time')


#         if company.work_summary_interval == 'W':
#             avg_hour = user.weekly_avg_working_hour
#         else:  # Monthly
#             avg_hour = user.monthly_avg_working_hour

#         serialized_user['avg_working_hour'] = round(avg_hour, 2)
#         role_working_hour = user.role.working_hour if user.role and user.role.working_hour is not None else None
#         threshold_hour = role_working_hour if role_working_hour is not None else company.daily_working_hours
#         serialized_user['is_below_avg_hours'] = avg_hour < threshold_hour

#         punch_ins = [punch.punch_time for punch in today_punches if punch.status == 'Check-In']
#         punch_outs = [punch.punch_time for punch in today_punches if punch.status == 'Check-Out']

#         check_in = min(punch_ins) if punch_ins else None
#         check_out = max(punch_outs) if punch_outs else None

#         serialized_user['check_in'] = check_in
#         serialized_user['check_out'] = check_out

#         # Calculate punch pairs
#         punch_pairs = []
#         remaining_check_ins = punch_ins.copy()
#         remaining_check_outs = punch_outs.copy()


#         if company.punch_mode == 'M':

#             while remaining_check_ins and remaining_check_outs:
#                 earliest_in = min(remaining_check_ins)
#                 next_out = min((p for p in remaining_check_outs if p > earliest_in), default=None)
#                 if next_out:
#                     punch_pairs.append({
#                         "check_in": earliest_in.isoformat(),
#                         "check_out": next_out.isoformat()
#                     })
#                     remaining_check_ins.remove(earliest_in)
#                     remaining_check_outs.remove(next_out)
#                 else:
#                     remaining_check_ins.remove(earliest_in)

#         serialized_user['punch_pairs'] = punch_pairs

#         user_data.append(serialized_user)  # Add user with punch_pairs to the list
#     user_data = sorted(
#     user_data,
#     key=lambda x: (
#         x.get('group') is None,   # False < True → non-nulls first
#         x.get('group') or "",
#         x.get('role') or ""
#     )
# )



#     # Pagination
#     paginator = Paginator(user_data, 10)
#     page_data = paginator.get_page(page)

#     return Response({
#         'status': status.HTTP_200_OK,
#         'total': paginator.count,
#         'page': page,
#         'total_page': paginator.num_pages,
#         'male_count': male_count,
#         'female_count': female_count,
#         'others_count': others_count,
#         'success': True,
#         'message': 'No users found.' if paginator.count == 0 else 'Success',
#         'data': page_data.object_list
#     })


@extend_schema(request=GetUserSerializer, responses=GetUserSerializer(many=True))
@api_view(['POST'])
def getAllEmployees(request, page):
    company_id = request.data.get('company_id')

    if not c.CompanyUser.objects.get(user= request.user,company = company_id).is_admin:
        return Response({
            'status': status.HTTP_403_FORBIDDEN,
            'success': False,
            'message': 'Unauthorized access.'
        })

    gender = request.data.get('gender')  # string
    is_active = request.data.get('is_active')  # boolean
    roles = request.data.get('roles', [])  # List of role IDs
    avg_hour_filter = request.data.get('avg_hour_filter')
    company = Company.objects.get(id=company_id)
    avg_interval = company.work_summary_interval
    punch_mode = company.punch_mode  # Get the punch mode: 'M' or 'S'
    search = request.data.get('search', '').strip()

    filters = Q(company__id=company_id)

    if gender:
        filters &= Q(gender__in=gender)
    if is_active is not None:
        filters &= Q(is_active=is_active)
    if roles:
        filters &= Q(role_id__in=roles)
    if search:
        filters &= (
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )

    

    users = CustomUser.objects.filter(filters).exclude(id=request.user.id)
    devices = Device.objects.filter(company=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))
    today = date.today()

    if avg_interval == 'W':
        # Weekly: from Monday to Friday of current week
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif avg_interval == 'M':
        # Monthly: from the 1st of the month to today
        start_date = today.replace(day=1)
        end_date = today
    else:
        # Fallback to weekly if undefined
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

    if not users.exists():
        return Response({
            'status': status.HTTP_200_OK,
            'total': 0,
            'page': page,
            'total_page': 0,
            'success': True,
            'message': 'No users found.',
            'data': []
        })

    user_data = []

    for user in users:
        biometric_id = user.biometric_id
        serialized_user = UserSerializer(user).data

        # Calculate average working hours from Monday to Friday
        week_punches = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=device_ids,
            punch_time__date__gte=start_date,
            punch_time__date__lte=end_date
        ).order_by('punch_time')

        daily_hours = []
        worked_days = 0
        current_date = start_date
        while current_date <= end_date:
            day_punches = week_punches.filter(punch_time__date=current_date)
            check_ins = [p for p in day_punches if p.status == 'Check-In']
            check_outs = [p for p in day_punches if p.status == 'Check-Out']
            if check_ins and check_outs:  # User worked this day
                worked_days += 1
                if punch_mode == 'M':
                    # Multi-punch mode: Sum durations of all Check-In to Check-Out pairs
                    total_daily_duration = 0
                    check_in_index = 0
                    while check_in_index < len(check_ins):
                        in_time = check_ins[check_in_index].punch_time
                        # Find the next Check-Out after this Check-In
                        next_out_index = next((i for i, out in enumerate(check_outs) if out.punch_time > in_time), None)
                        if next_out_index is not None:
                            out_time = check_outs[next_out_index].punch_time
                            duration = (out_time - in_time).total_seconds() / 3600  # In hours
                            total_daily_duration += duration
                            # Remove the used Check-Out to avoid reuse
                            check_outs.pop(next_out_index)
                        check_in_index += 1
                    daily_hours.append(total_daily_duration)
                else:
                    # Single-punch mode: Use max Check-Out minus min Check-In
                    daily_duration = (max(check_outs, key=lambda x: x.punch_time).punch_time - 
                                     min(check_ins, key=lambda x: x.punch_time).punch_time).total_seconds() / 3600
                    daily_hours.append(daily_duration)

            current_date += timedelta(days=1)

        # Avoid division by zero if the user didn't work any days
        avg_working_hours = sum(daily_hours) / worked_days if worked_days else 0
        company = Company.objects.get(id=company_id)

        if company.work_summary_interval == 'W':
            avg_hour = user.weekly_avg_working_hour
        else:  # Monthly
            avg_hour = user.monthly_avg_working_hour

        serialized_user['avg_working_hour'] = round(avg_hour, 2)
        if user.role and user.role.working_hour is not None:
            serialized_user['is_below_avg_hours'] = avg_hour < user.role.working_hour
        else:
            serialized_user['is_below_avg_hours'] = avg_hour < company.daily_working_hours

        # Calculate today's Check-In and Check-Out
        today_punches = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=device_ids,
            punch_time__date=today
        ).order_by('punch_time')

        punch_ins = [punch.punch_time for punch in today_punches if punch.status == 'Check-In']
        punch_outs = [punch.punch_time for punch in today_punches if punch.status == 'Check-Out']

        check_in = min(punch_ins) if punch_ins else None
        check_out = max(punch_outs) if punch_outs else None

        serialized_user['check_in'] = check_in
        serialized_user['check_out'] = check_out

        user_data.append(serialized_user)  # Add user to the list

    # Apply the avg_hour_filter after collecting all users
    if avg_hour_filter is not None:
        company = Company.objects.get(id=company_id)
        filtered_user_data = []

        for user in user_data:
            # Get user role working hour if available, else fallback to company working hour
            role_working_hour = getattr(user.get('role'), 'working_hour', None)
            working_hour = role_working_hour if role_working_hour is not None else company.daily_working_hours

            if avg_hour_filter and user['avg_working_hour'] > working_hour:
                filtered_user_data.append(user)
            elif not avg_hour_filter and user['avg_working_hour'] <= working_hour:
                filtered_user_data.append(user)

        user_data = filtered_user_data

    user_data = sorted(
    user_data,
    key=lambda x: (
        x.get('group') is None,   # False < True → non-nulls first
        x.get('group') or "",
        x.get('role') or ""
    )
)

    # Pagination
    paginator = Paginator(user_data, 10)
    page_data = paginator.get_page(page)

    return Response({
        'status': status.HTTP_200_OK,
        'total': paginator.count,
        'page': page,
        'total_page': paginator.num_pages,
        'success': True,
        'message': 'No users found.' if paginator.count == 0 else 'Success',
        'data': page_data.object_list
    })







@extend_schema(request=GetUserSerializer, responses=GetUserSerializer(many=True))
@api_view(['POST'])
def todaysActiveUsers(request, page):

    company_id = request.data.get('company_id')

    if not c.CompanyUser.objects.get(user= request.user,company = company_id).is_admin:

        return Response({
            'status': status.HTTP_401_UNAUTHORIZED,
            'success': False,
            'message': 'Unauthorized access.'
        })
    
    if  company_id == 6:
        with connections['secondary'].cursor() as cursor:
            cursor.execute("""
                UPDATE punch_records
                SET status = 'Check-In'
                WHERE device_id = 'QJT3251900593' AND status = 'Check-Out'
            """)
            cursor.execute("""
                UPDATE punch_records
                SET status = 'Check-Out'
                WHERE device_id = 'QJT3251900620' AND status = 'Check-In'
            """)

    today = date.today()

    company_id = request.data.get('company_id')
    avg_hour_filter = request.data.get('avg_hour_filter')
    company = Company.objects.get(id=company_id)
    avg_interval = company.work_summary_interval
    punch_mode = company.punch_mode  # Get the punch mode: 'M' or 'S'

    # Define date range
    if avg_interval == 'W':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif avg_interval == 'M':
        start_date = today.replace(day=1)
        end_date = today
    else:
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

    users = CustomUser.objects.filter(company=company_id).exclude(id=request.user.id)
    devices = Device.objects.filter(company=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))
    biometric_ids = list(users.values_list('biometric_id', flat=True))

    if not device_ids or not biometric_ids:
        return Response({
            'status': status.HTTP_200_OK,
            'total': 0,
            'page': page,
            'total_page': 0,
            'success': True,
            'message': 'No devices or users found.',
            'data': []
        })

    punches = PunchRecords.objects.using('secondary').filter(
        user_id__in=biometric_ids,
        device_id__in=device_ids,
        punch_time__date=today
    ).order_by('punch_time')

    active_biometric_ids = list(punches.values_list('user_id', flat=True).distinct())
    active_users = users.filter(biometric_id__in=active_biometric_ids).order_by('group__group', 'role__role')
    male_count = active_users.filter(gender='M').count()
    female_count = active_users.filter(gender='F').count()
    others_count = active_users.filter(gender='O').count()

    user_data = []

    for user in active_users:




        biometric_id = user.biometric_id
        user_punches = punches.filter(user_id=biometric_id)

        punch_ins = [p.punch_time for p in user_punches if p.status == 'Check-In']
        punch_outs = [p.punch_time for p in user_punches if p.status == 'Check-Out']
        check_in = min(punch_ins) if punch_ins else None
        check_out = max(punch_outs) if punch_outs else None

        serialized_user = UserSerializer(user).data
        serialized_user['check_in'] = check_in
        serialized_user['check_out'] = check_out

        punch_pairs = []
        remaining_check_ins = punch_ins.copy()
        remaining_check_outs = punch_outs.copy()
        
        if company.punch_mode == 'M':
            while remaining_check_ins and remaining_check_outs:
                # Find the earliest Check-In
                earliest_in = min(remaining_check_ins)
                # Find the earliest Check-Out after this Check-In
                next_out = min((p for p in remaining_check_outs if p > earliest_in), default=None)
                
                if next_out:
                    punch_pairs.append({
                        "check_in": earliest_in,
                        "check_out": next_out
                    })
                    remaining_check_ins.remove(earliest_in)
                    remaining_check_outs.remove(next_out)
                else:
                    # No matching Check-Out, move to next Check-In
                    remaining_check_ins.remove(earliest_in)

        serialized_user['punch_pairs'] = punch_pairs


        # Determine threshold to compare
        role_working_hour = user.role.working_hour if user.role and user.role.working_hour is not None else None
        threshold_hour = role_working_hour if role_working_hour is not None else company.daily_working_hours

        if company.work_summary_interval == 'W':
            avg_hour = user.weekly_avg_working_hour
        else:  # Monthly
            avg_hour = user.monthly_avg_working_hour

        serialized_user['avg_working_hour'] = round(avg_hour, 2)
        # serialized_user['is_below_avg_hours'] = avg_working_hour < threshold_hour
        serialized_user['is_below_avg_hours'] = avg_hour < threshold_hour


        user_data.append(serialized_user)

    # Apply avg_hour_filter
    if avg_hour_filter is not None:
        filtered_user_data = []
        for user in user_data:
            role_hour = user.get('role', {}).get('working_hour') if user.get('role') else None
            threshold_hour = role_hour if role_hour is not None else company.daily_working_hours

            if avg_hour_filter and user['avg_working_hour'] > threshold_hour:
                filtered_user_data.append(user)
            elif not avg_hour_filter and user['avg_working_hour'] <= threshold_hour:
                filtered_user_data.append(user)
        user_data = filtered_user_data
   
    user_data = sorted(
    user_data,
    key=lambda x: (
        x.get('group') is None,   # False < True → non-nulls first
        x.get('group') or "",
        x.get('role') or ""
    )
)
    paginator = Paginator(user_data, 10)
    page_data = paginator.get_page(page)



    return Response({
        'status': status.HTTP_200_OK,
        'total': paginator.count,
        'page': page,
        'male_count': male_count,
        'others_count': others_count,
        'female_count': female_count,
        'total_page': paginator.num_pages,
        'success': True,
        'message': "No active users found today." if paginator.count == 0 else "Success",
        'data': page_data.object_list,
    })


@api_view(['GET'])
def get_user_companies(request):
    user = request.user
    companies = set()

    # 1. Add the normal user's companies (from CustomUser.company ManyToManyField)
    if hasattr(user, 'company') and user.company.exists():
        companies.update(user.company.all())

    # 2. Add companies where the user is marked as admin in CompanyUser
    admin_company_users = CompanyUser.objects.filter(user=user, is_admin=True).select_related('company')
    for company_user in admin_company_users:
        if company_user.company:
            companies.add(company_user.company)

    # Serialize all unique companies
    serialized = CompanySerializer(list(companies), many=True, context={'user': user})
    return Response({
        'status': status.HTTP_200_OK,
        'success': True,
        'message': 'Companies fetched successfully.',
        'data': serialized.data
    })


@api_view(['POST'])
def get_team_members(request, page):
    company_id = request.data.get("company_id")
    user = request.user

    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({"message": "Company not found"}, status=404)


    # Get user's group in this company
    try:
        current_company_user = CompanyUser.objects.get(company=company, user=user)
        user_group = current_company_user.group
    except CompanyUser.DoesNotExist:
        user_group = user.group



    if not user_group:
        return Response({"message": "User has no group assigned"}, status=403)
    else:
        show_only_to_lead = user_group.only_visible_to_lead
        # is_team_lead = getattr(current_company_user, 'is_team_lead', False)
        is_team_lead = getattr(user, 'team_lead', False)

        if show_only_to_lead and not is_team_lead:
            return Response({"message": "Only visible to team leads"}, status=403)



    # Filter users belonging to the same group
    company_user_qs = CompanyUser.objects.filter(
        company=company,
        group=user_group
    ).exclude(id=user.id).select_related("user", "group", "role")

    custom_users_qs = CustomUser.objects.filter(
        company=company,
        group=user_group
    ).exclude(id=user.id).select_related("group", "role")

    # Collect all users, avoiding duplicates
    seen_user_ids = set()
    all_users = []

    for cu in company_user_qs:
        u = cu.user
        seen_user_ids.add(u.id)
        all_users.append(u)

    for cu in custom_users_qs:
        if cu.id not in seen_user_ids:
            all_users.append(cu)

    # Fetch device IDs
    devices = Device.objects.filter(company=company_id)
    device_ids = list(devices.values_list('device_id', flat=True))
    today = date.today()
    avg_interval = company.work_summary_interval
    punch_mode = company.punch_mode

    # Define date range for average calculation
    if avg_interval == 'W':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif avg_interval == 'M':
        start_date = today.replace(day=1)
        end_date = today
    else:
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

    user_data = []
    for user in all_users:
        biometric_id = user.biometric_id
        serialized_user = {
            "id": user.id,
            "first_name": user.first_name,
            "biometric_id": biometric_id,
            "last_name": user.last_name,
            "email": user.email,
            "mobile": user.mobile,
            "prof_img": user.prof_img.url if user.prof_img and hasattr(user.prof_img, 'url') else None,
            "gender": user.gender,
            "is_wfh": user.is_wfh,
            "role": getattr(user.role, 'role', None) if user.role else None,
            "group": getattr(user.group, 'group', None) if user.group else None,
        }

        # Calculate average working hours
        week_punches = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=device_ids,
            punch_time__date__gte=start_date,
            punch_time__date__lte=end_date
        ).order_by('punch_time')

        daily_hours = []
        worked_days = 0
        current_date = start_date
        while current_date <= end_date:
            day_punches = week_punches.filter(punch_time__date=current_date)
            check_ins = [p for p in day_punches if p.status == 'Check-In']
            check_outs = [p for p in day_punches if p.status == 'Check-Out']
            if check_ins and check_outs:
                worked_days += 1
                if punch_mode == 'M':
                    total_daily_duration = 0
                    check_in_index = 0
                    while check_in_index < len(check_ins):
                        in_time = check_ins[check_in_index].punch_time
                        next_out_index = next((i for i, out in enumerate(check_outs) if out.punch_time > in_time), None)
                        if next_out_index is not None:
                            out_time = check_outs[next_out_index].punch_time
                            duration = (out_time - in_time).total_seconds() / 3600
                            total_daily_duration += duration
                            check_outs.pop(next_out_index)
                        check_in_index += 1
                    daily_hours.append(total_daily_duration)
                else:
                    daily_duration = (max(check_outs, key=lambda x: x.punch_time).punch_time -
                                     min(check_ins, key=lambda x: x.punch_time).punch_time).total_seconds() / 3600
                    daily_hours.append(daily_duration)
            current_date += timedelta(days=1)

        avg_working_hours = sum(daily_hours) / worked_days if worked_days else 0
        threshold_hour = user.role.working_hour if user.role and user.role.working_hour else company.daily_working_hours
        serialized_user['avg_working_hour'] = round(avg_working_hours, 2)
        serialized_user['is_below_avg_hours'] = avg_working_hours < threshold_hour

        # Calculate today's check-in and check-out
        today_punches = PunchRecords.objects.using('secondary').filter(
            user_id=biometric_id,
            device_id__in=device_ids,
            punch_time__date=today
        ).order_by('punch_time')

        punch_ins = [punch.punch_time for punch in today_punches if punch.status == 'Check-In']
        punch_outs = [punch.punch_time for punch in today_punches if punch.status == 'Check-Out']

        check_in = min(punch_ins) if punch_ins else None
        check_out = max(punch_outs) if punch_outs else None

        serialized_user['check_in'] = check_in.isoformat() if check_in else None
        serialized_user['check_out'] = check_out.isoformat() if check_out else None

        # Calculate punch pairs
        punch_pairs = []
        if punch_ins and punch_outs:
            punch_ins.sort()
            punch_outs.sort()
            i, j = 0, 0
            while i < len(punch_ins) and j < len(punch_outs):
                if punch_ins[i] < punch_outs[j]:
                    punch_pairs.append({
                        "check_in": punch_ins[i].isoformat(),
                        "check_out": punch_outs[j].isoformat()
                    })
                    i += 1
                    j += 1
                else:
                    j += 1

        serialized_user['punch_pairs'] = punch_pairs
        user_data.append(serialized_user)

    # Pagination
    paginator = Paginator(user_data, 10)
    current_page = paginator.page(page)
    serialized_users = current_page.object_list

    return Response({
        "users": serialized_users,
        "total_pages": paginator.num_pages,
        "current_page": page
    })







@extend_schema(request=UserSerializer, responses=UserSerializer)
@api_view(['GET', 'PUT'])
def profile(request, id):
    try:
        # Try to get the user from the database
        company_id = request.headers.get('X-Company-ID')
        company = Company.objects.get(id=company_id)

        user = CustomUser.objects.filter(id=id).first()



    except ObjectDoesNotExist:
        # If the user doesn't exist, return a 404 response
        return Response({
            'success': False,
            'message': 'User does not exist',
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Fetch devices associated with the user's company
        devices = Device.objects.filter(company_id=company_id)
        device_ids = list(devices.values_list('device_id', flat=True))

        # Calculate Monday to Friday of the current week
        today = timezone.now().date()
        avg_interval = company.work_summary_interval
        punch_mode = company.punch_mode  # Get the punch mode: 'M' or 'S'

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

        if avg_interval == 'W':
            # Weekly: from Monday to Friday of current week
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif avg_interval == 'M':
            # Monthly: from the 1st of the month to today
            start_date = today.replace(day=1)
            end_date = today
        else:
            # Fallback to weekly if undefined
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)

        # Calculate average working hours from Monday to Friday
        week_punches = PunchRecords.objects.using('secondary').filter(
            user_id=user.biometric_id,
            device_id__in=device_ids,
            punch_time__date__gte=start_date,
            punch_time__date__lte=end_date
        ).order_by('punch_time')

        daily_hours = []
        worked_days = 0
        current_date = start_date
        while current_date <= end_date:
            day_punches = week_punches.filter(punch_time__date=current_date)
            check_ins = [p for p in day_punches if p.status == 'Check-In']
            check_outs = [p for p in day_punches if p.status == 'Check-Out']

            if check_ins and check_outs:  # User worked this day
                worked_days += 1
                if punch_mode == 'M':
                    # Multi-punch mode: Sum durations of all Check-In to Check-Out pairs
                    total_daily_duration = 0
                    check_in_index = 0
                    while check_in_index < len(check_ins):
                        in_time = check_ins[check_in_index].punch_time
                        # Find the next Check-Out after this Check-In
                        next_out_index = next((i for i, out in enumerate(check_outs) if out.punch_time > in_time), None)
                        if next_out_index is not None:
                            out_time = check_outs[next_out_index].punch_time
                            duration = (out_time - in_time).total_seconds() / 3600  # In hours
                            total_daily_duration += duration
                            # Remove the used Check-Out to avoid reuse
                            check_outs.pop(next_out_index)
                        check_in_index += 1
                    daily_hours.append(total_daily_duration)
                else:
                    # Single-punch mode: Use max Check-Out minus min Check-In
                    daily_duration = (max(check_outs, key=lambda x: x.punch_time).punch_time - 
                                     min(check_ins, key=lambda x: x.punch_time).punch_time).total_seconds() / 3600
                    daily_hours.append(daily_duration)

            current_date += timedelta(days=1)

        # Serialize user data and add average working hours
        serializer = UserSerializer(user,context={
    'request': request,
    'company_id': company_id
})
        response_data = serializer.data
        company_user = c.CompanyUser.objects.filter(user=request.user).first()
        response_data['admin'] = company_user.is_admin if company_user else False
        response_data['is_sms'] = is_sms
        response_data['is_whatsapp'] = is_whatsapp
        
        avg_working_hours = sum(daily_hours) / len(daily_hours) if daily_hours else 0
        if company_user and company_user.is_admin:
            company_serializer = CompanySerializer(instance=company)
            response_data['company'] = company_serializer.data
        if avg_working_hours <= company.daily_working_hours:
            response_data['is_below_avg_hours'] = True
        else:
            response_data['is_below_avg_hours'] = False

        response_data['avg_working_hour'] = round(avg_working_hours, 2)

        return Response({
            'status': status.HTTP_200_OK,
            'success': True,
            'data': response_data,
        })

    # elif request.method == 'PUT':

      

    #     data = request.data.copy()  # To handle possible file uploads
        
    #     if 'prof_img' in request.FILES:
    #         data['prof_img'] = request.FILES['prof_img']

    #     role_id = request.data.get('role_id')
    #     is_admin = request.data.get('is_admin')

    #     group_id = request.data.get('group_id')



       

    #     if role_id:
    #         try:
    #             role = c.CompanyRole.objects.get(id=role_id)
    #             user.role = role
    #             user.save()  # Save the user to persist the role
    #         except c.CompanyRole.DoesNotExist:
    #             return Response({
    #                 'success': False,
    #                 'errors': {'role_id': 'Invalid role ID'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
    #         except ValueError:
    #             return Response({
    #                 'success': False,
    #                 'errors': {'role_id': 'Role ID must be a valid integer'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
        
    #     if group_id:
    #         try:
    #             group = c.CompanyGroup.objects.get(id=group_id)
    #             if user.parent_company and user.parent_company == company:
    #                 user.group = group
    #                 user.save()
    #             else:
    #         # Update group in CompanyUser relation
    #                 try:
    #                     company_user = CompanyUser.objects.get(user=user, company=company)
    #                     company_user.group = group
    #                     company_user.save()
    #                 except CompanyUser.DoesNotExist:
    #                     return Response({
    #                         'success': False,
    #                         'message': {'group_id': 'User not assigned to this company'},
    #                     }, status=status.HTTP_400_BAD_REQUEST)
    #         except c.CompanyGroup.DoesNotExist:
    #             return Response({
    #                 'success': False,
    #                 'message': {'group_id': 'Invalid group ID'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
    #         except ValueError:
    #             return Response({
    #                 'success': False,
    #                 'errors': {'group_id': 'Group ID must be a valid integer'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
        
    #     if 'is_admin' in request.data:
    #         company_user, created = CompanyUser.objects.update_or_create(
    #             user=user,
    #             company=company,
    #             defaults={
    #                 "is_admin": is_admin
    #             }
    #         )




            
    #     if role_id:
    #         try:
    #             role = c.CompanyRole.objects.get(id=role_id)

    #             if user.parent_company and user.parent_company == company:
    #                 user.role = role
    #                 user.save()
    #             else:
    #                 company_user = CompanyUser.objects.filter(user=user, company=company).first()

    #                 if not company_user:
    #                     return Response({
    #                         'success': False,
    #                         'errors': {'role_id': 'User not assigned to this company'},
    #                     }, status=status.HTTP_400_BAD_REQUEST)

    #                 company_user.role = role
    #                 company_user.save()

    #         except c.CompanyRole.DoesNotExist:
    #             return Response({
    #                 'success': False,
    #                 'errors': {'role_id': 'Invalid role ID'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
    #         except ValueError:
    #             return Response({
    #                 'success': False,
    #                 'errors': {'role_id': 'Role ID must be a valid integer'},
    #             }, status=status.HTTP_400_BAD_REQUEST)
            
    #     is_sms = request.data.get('is_sms')
    #     is_whatsapp = request.data.get('is_whatsapp')

    #     if company.soft_disable:
    #         return Response({
    #             'success': False,
    #             'message': 'Messaging services are temporarily disabled by your company.'
    #         })

    #     # --- SMS control ---
    #     if 'is_sms' in request.data:
    #         if company.strict_sms:
    #             return Response({
    #                 'success': False,
    #                 'message': 'SMS service is strictly enabled for all users. You cannot modify it.'
    #             })
    #         elif not company.enable_sms:
    #             return Response({
    #                 'success': False,
    #                 'message': 'SMS service is disabled for your company.'
    #             })
    #         elif not company.allow_individual_sms:
    #             return Response({
    #                 'success': False,
    #                 'message': 'You are not allowed to change your SMS preference individually.'
    #             })
    #         else:
    #             user.is_sms = is_sms
    #             user.save()

    #     # --- WhatsApp control ---
    #     if 'is_whatsapp' in request.data:
    #         if company.strict_whatsapp:
    #             return Response({
    #                 'success': False,
    #                 'message': 'WhatsApp service is strictly enabled for all users. You cannot modify it.'
    #             }, status=status.HTTP_403_FORBIDDEN)
    #         elif not company.enable_whatsapp:
    #             return Response({
    #                 'success': False,
    #                 'message': 'WhatsApp service is disabled for your company.'
    #             }, status=status.HTTP_403_FORBIDDEN)
    #         elif not company.allow_individual_whatsapp:
    #             return Response({
    #                 'status':status.HTTP_403_FORBIDDEN,
    #                 'success': False,
    #                 'message': 'You are not allowed to change your WhatsApp preference individually.'
    #             }, status=status.HTTP_403_FORBIDDEN)
    #         else:
    #             user.is_whatsapp = is_whatsapp
    #             user.save()

            
    #     # Use the serializer to validate and update the user
    #     serializer = UserSerializer(user, data=data, partial=True)

        
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response({
    #             'status': status.HTTP_200_OK,
    #             'success': True,
    #             'message': 'Profile updated successfully',
    #             'data': serializer.data,
    #         })
    #     else:
           

    #         # Return validation errors if the data is invalid
    #         return Response({
    #             'success': False,
    #             'errors': serializer.errors,
    #         }, status=status.HTTP_400_BAD_REQUEST)

    # # If the method is not GET or PUT, return a 405 Method Not Allowed response
    # return Response({
    #     'success': False,
    #     'message': 'Method not allowed'
    # }, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    elif request.method == 'PUT':

        data = request.data.copy()  # To handle possible file uploads
        
        if 'prof_img' in request.FILES:
            data['prof_img'] = request.FILES['prof_img']

        role_id = request.data.get('role_id')
        is_admin = request.data.get('is_admin')
        group_id = request.data.get('group_id')
        is_sms = request.data.get('is_sms')
        is_whatsapp = request.data.get('is_whatsapp')

        # --- Company-level controls first ---
        if company.soft_disable:
            return Response({
                'success': False,
                'message': 'Messaging services are temporarily disabled by your company.'
            }, status=status.HTTP_403_FORBIDDEN)

        # --- SMS control ---
        if 'is_sms' in request.data:
            if company.strict_sms:
                return Response({
                    'success': False,
                    'message': 'SMS service is strictly enabled for all users. You cannot modify it.'
                }, status=status.HTTP_403_FORBIDDEN)
            elif not company.enable_sms:
                return Response({
                    'success': False,
                    'message': 'SMS service is disabled for your company.'
                }, status=status.HTTP_403_FORBIDDEN)
            elif not company.allow_individual_sms:
                return Response({
                    'success': False,
                    'message': 'You are not allowed to change your SMS preference individually.'
                }, status=status.HTTP_403_FORBIDDEN)
            else:
                user.is_sms = is_sms
                user.save()

        # --- WhatsApp control ---
        if 'is_whatsapp' in request.data:
            if company.strict_whatsapp:
                return Response({
                    'success': False,
                    'message': 'WhatsApp service is strictly enabled for all users. You cannot modify it.'
                },)
            elif not company.enable_whatsapp:
                return Response({
                    'success': False,
                    'message': 'WhatsApp service is disabled for your company.'
                }, status=status.HTTP_403_FORBIDDEN)
            elif not company.allow_individual_whatsapp:
                return Response({
                    'success': False,
                    'message': 'You are not allowed to change your WhatsApp preference individually.'
                }, status=status.HTTP_403_FORBIDDEN)
            else:
                user.is_whatsapp = is_whatsapp
                user.save()

        # --- Admin, Role, and Group updates ---
        if 'is_admin' in request.data:
            CompanyUser.objects.update_or_create(
                user=user,
                company=company,
                defaults={"is_admin": is_admin}
            )

        if role_id:
            try:
                role = c.CompanyRole.objects.get(id=role_id)
                if user.parent_company and user.parent_company == company:
                    user.role = role
                    user.save()
                else:
                    company_user = CompanyUser.objects.filter(user=user, company=company).first()
                    if not company_user:
                        return Response({
                            'success': False,
                            'errors': {'role_id': 'User not assigned to this company'},
                        }, status=status.HTTP_400_BAD_REQUEST)
                    company_user.role = role
                    company_user.save()

            except c.CompanyRole.DoesNotExist:
                return Response({
                    'success': False,
                    'errors': {'role_id': 'Invalid role ID'},
                }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'success': False,
                    'errors': {'role_id': 'Role ID must be a valid integer'},
                }, status=status.HTTP_400_BAD_REQUEST)

        if group_id:
            try:
                group = c.CompanyGroup.objects.get(id=group_id)
                if user.parent_company and user.parent_company == company:
                    user.group = group
                    user.save()
                else:
                    company_user = CompanyUser.objects.filter(user=user, company=company).first()
                    if not company_user:
                        return Response({
                            'success': False,
                            'message': {'group_id': 'User not assigned to this company'},
                        }, status=status.HTTP_400_BAD_REQUEST)
                    company_user.group = group
                    company_user.save()
            except c.CompanyGroup.DoesNotExist:
                return Response({
                    'success': False,
                    'message': {'group_id': 'Invalid group ID'},
                }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'success': False,
                    'errors': {'group_id': 'Group ID must be a valid integer'},
                }, status=status.HTTP_400_BAD_REQUEST)

        # --- Final serializer save ---
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'status': status.HTTP_200_OK,
                'success': True,
                'message': 'Profile updated successfully',
                'data': serializer.data,
            })
        else:
            return Response({
                'success': False,
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

    else:
        return Response({
            'success': False,
            'message': 'Method not allowed'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)




from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    # Try cookie first (web)
    refresh_token = request.COOKIES.get('refresh_token')
    
    # If not in cookie, check JSON body (mobile)
    if not refresh_token:
        refresh_token = request.data.get('refresh_token')

    if not refresh_token:
        return Response({
            'status': status.HTTP_400_BAD_REQUEST,
            'message': 'Refresh token not provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)

        # Generate new access token
        new_access_token = str(refresh.access_token)

        # Rotate refresh token if enabled
        new_refresh_token = None
        if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
            new_refresh_token = str(refresh)

        response_data = {
            'status': status.HTTP_200_OK,
            'access_token': new_access_token,
        }

        if new_refresh_token:
            response_data['refresh_token'] = new_refresh_token

        response = Response(response_data)

        # If it came from cookie (web), set cookies
        if request.COOKIES.get('refresh_token'):
            response.set_cookie(
                key='access_token',
                value=new_access_token,
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG,
                max_age=60*60,
                path='/'
            )
            if new_refresh_token:
                response.set_cookie(
                    key='refresh_token',
                    value=new_refresh_token,
                    httponly=True,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                    max_age=60*60*3,  # 3 hours for example
                    path='/'
                )

        logger.info("Successfully refreshed tokens")
        return response

    except Exception as e:
        logger.error(f"Refresh token error: {str(e)}")
        return Response({
            'status': status.HTTP_401_UNAUTHORIZED,
            'message': f'Invalid or expired refresh token: {str(e)}'
        }, status=status.HTTP_401_UNAUTHORIZED)
