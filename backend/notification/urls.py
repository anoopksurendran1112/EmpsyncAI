from django.urls import path
from .views import send_push_notification

urlpatterns = [
    path('api/send-notification',send_push_notification)
]