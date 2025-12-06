from django.shortcuts import render
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import HttpResponse

import firebase_admin
from firebase_admin import messaging

from firebase_admin import credentials, messaging





# E:\Kochi digital\empsync_ai_backend\firebase_key.json

import firebase_admin
from firebase_admin import credentials, messaging
from firebase_admin._messaging_utils import UnregisteredError
from rest_framework.response import Response
from notification.models import FcmToken  # Adjust path to your project

def send_push_notification(tokens, title, body):
    if not firebase_admin._apps:
        cred = credentials.Certificate('firebase_key.json')
        firebase_admin.initialize_app(cred)

    success = 0
    failed_tokens = []

    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                token=token,
            )
            messaging.send(message)
            success += 1

        except UnregisteredError:
            print(f"Unregistered token: {token}")
            FcmToken.objects.filter(fcm_token=token).delete()  # Clean from DB

        except Exception as e:
            print(f"Error sending to token {token}: {e}")
            failed_tokens.append(token)

    return Response({
        "success": True,
        "sent_count": success,
        "failed_tokens": failed_tokens
    })

    
   



