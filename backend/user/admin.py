from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
   

    list_display = ('id', 'biometric_id', 'first_name','get_role_names', 'email', 'mobile', 'is_active')
    ordering = ['first_name']

    fieldsets = (
        (None, {
            'fields': ('biometric_id', 'first_name', 'last_name','gender', 'mobile', 'email', 'password', 'company','parent_company',"weekly_avg_working_hour","monthly_avg_working_hour","last_avg_calculated_date",'shift','role','group','team_lead', 'prof_img', 'is_wfh','is_superuser','is_staff','is_active','is_sms','is_whatsapp')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('biometric_id', 'first_name', 'last_name','parent_company','shift', 'gender','mobile', 'email', 'password1', 'password2', 'company','role', 'group','team_lead','prof_img','is_wfh','is_superuser','is_staff', 'is_active')
        }),
    )

    def get_role_names(self, obj):
        # Check if the `role` exists and if so, return its role name
        return obj.role.role if obj.role else "No Role"
    
    get_role_names.short_description = 'Roles'

    def get_group_names(self, obj):
        # Check if the `role` exists and if so, return its role name
        return obj.group.group if obj.group else "No Group"
    
    get_group_names.short_description = 'Group'

    search_fields = ('first_name', 'email', 'mobile', 'biometric_id')
    list_filter = ('is_active', 'gender', 'company')
    exclude = ('username',)

admin.site.register(CustomUser, CustomUserAdmin)
