from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from django.conf import settings
from rest_framework import status
from user.models import CustomUser
from rest_framework.response import Response
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from rest_framework import status
from user.models import CustomUser


class Unauthorized401(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided.'
    default_code = 'not_authenticated'


class CookieJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')

        # ✅ Then try Authorization header (for mobile/Flutter)
        if not access_token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split('Bearer ')[1].strip()


        if not access_token:

            return None  # Let DRF fall back to other authentication methods

        try:
            token = AccessToken(access_token)
            print(access_token)
            user_id = token.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Invalid token payload')

            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:

                raise AuthenticationFailed('User not found')

            return (user, token)

        except TokenError as e :

            raise Unauthorized401({
                'success': False,
                'message': 'Token is invalid or expired',
                'code': 'token_expired'
            })

            # SimpleJWT-specific invalid/expired token
            from rest_framework.exceptions import NotAuthenticated
            raise AuthenticationFailed('Token is invalid or expired',code=status.HTTP_401_UNAUTHORIZED)

        except AuthenticationFailed as e:
           

            # Re-raise any intentional authentication failure
            raise

        except Exception as e:

            # Any other unexpected error — don’t swallow it silently
            raise AuthenticationFailed('Authentication failed unexpectedly', code='auth_failed')
