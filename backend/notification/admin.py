from django.contrib import admin
from .models import FcmToken

# Register your models here.

class CustomFcmToken(admin.ModelAdmin):
    fieldsets = ((None,{
        'fields': ('fcm_token','user')
    }),)


admin.site.register(FcmToken,CustomFcmToken)