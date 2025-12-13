from django.contrib import admin
from .models import ShiftSwap, VirtualPunchRecords

# Register your models here.

class CustomVirtualPunchAdmin(admin.ModelAdmin):
    list_display = ('user','punch_time','device_id','status','latitude','longitude','admin',)


    search_fields = ['user_id','user',]


class CustomAdminShiftSwap(admin.ModelAdmin):


    list_display = ['swap_date','user1','user2']

    fieldsets = (
        (None, {
            'fields': ('user1','shift1','user2','shift2')
        }),
       
    )

    search_fields = ('shift','user1','user2',)



admin.site.register(VirtualPunchRecords,CustomVirtualPunchAdmin)
admin.site.register(ShiftSwap,CustomAdminShiftSwap)



