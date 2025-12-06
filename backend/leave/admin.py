from django.contrib import admin
from .models import LeaveType,Holiday,Leave,LeaveCredit


# Register your models here.

class CustomLeaveType(admin.ModelAdmin):
    list_display = ('leave_type','company','monthly_limit','yearly_limit','is_active','is_global',)
    
   
    ordering = ['company','leave_type']
    search_fields=['company','leave_type']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('leave_type','short_name','company','allow_carry_forward','monthly_limit','yearly_limit','is_active','is_global',)
        }),
    )

class CustomLeaveCredits(admin.ModelAdmin):
    list_display = ('user','leave_type','credits')

class CustomLeave(admin.ModelAdmin):
    list_display = ('leave_type','user','company','custom_reason','status',)
    
   
    ordering = ['user','leave_type']
    search_fields=['user','leave_type']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('leave_type','user','custom_reason','from_date','to_date','status',)
        }),
    )

class CustomHoliday(admin.ModelAdmin):
    list_display = ('holiday', 'get_companies', 'get_roles', 'date', 'is_recurring', 'is_global','is_full_holiday')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('holiday', 'company', 'role', 'date', 'is_recurring', 'is_global','is_full_holiday')
        }),
    )

    def get_companies(self, obj):
        return ", ".join([company.company_name for company in obj.company.all()])
    get_companies.short_description = 'Companies'

    def get_roles(self, obj):
        return ", ".join([role.role for role in obj.role.all()])
    get_roles.short_description = 'Roles'


admin.site.register(LeaveType,CustomLeaveType)
admin.site.register(Holiday,CustomHoliday)
admin.site.register(LeaveCredit,CustomLeaveCredits)
admin.site.register(Leave,CustomLeave)


