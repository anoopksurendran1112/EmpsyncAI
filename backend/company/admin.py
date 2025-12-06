from django.contrib import admin
from .models import Company,Device,CompanyRole,VirtualDevice,CompanyGroup,CompanyUser,CompanyShift
from django.contrib.auth.models import Group
from .forms import CustomCompanyRoleForm


# Register your models here.

class CustomAdminDevice(admin.ModelAdmin):


    list_display = ['device_id','company','is_active','from_date','to_date']

    fieldsets = (
        (None, {
            'fields': ('device_id', 'company','entry_type','to_date','from_date','is_active')
        }),
       
    )

    list_filter = ('is_active','company__company_name')
    search_fields = ('device_id',)


class CustomAdminShift(admin.ModelAdmin):


    list_display = ['shift','company','check_in','check_out','late_allowance']

    fieldsets = (
        (None, {
            'fields': ('shift','company','check_in','check_out','late_allowance')
        }),
       
    )

    search_fields = ('shift',)



class CustomCompanyRoleAdmin(admin.ModelAdmin):
    form = CustomCompanyRoleForm
    list_display = ('id', 'role','working_hour', 'get_company_names')
    fieldsets = (
        (None, {
            'fields': ('role','working_hour', 'company', )
        }),
    )


    def get_company_names(self, obj):
        return ", ".join([company.company_name for company in obj.company.all()])
    get_company_names.short_description = 'Company'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

       

    def get_company_names(self, obj):
        return ", ".join([company.company_name for company in obj.company.all()])
    get_company_names.short_description = 'Company'


class CustomCompanyGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'group','company','short_name')
    fieldsets = (
        (None, {
            'fields': ('group','short_name', 'company','only_visible_to_lead', )
        }),
    )
  
class CustomCompanyUser(admin.ModelAdmin):
    list_display = ('id', 'user','company',)
    fieldsets = (
        (None, {
            'fields': ('user', 'company','group','team_lead','role','is_admin',)
        }),
    )




class CustomVirtualDevice(admin.ModelAdmin):
    list_display = ('id','user','virtual_device','is_active',)

    fieldsets = (
        (None, {
            'fields': ('user','company','virtual_device','is_active',)
        }),
       
    )

    search_fields = ['user']




class CustomCompanyAdmin(admin.ModelAdmin):
    list_display = ('id','company_name', 'enable_sms', 
   'latitude','longitude','perimeter','travel_speed_threshold','company_img','daily_working_hours','work_summary_interval',)

    fieldsets = (
        (None, {
            'fields': ('company_name','company_img','punch_mode','enable_whatsapp',
                                              'last_sync',

    'soft_disable',
    'allow_individual_sms',
    'allow_individual_whatsapp',
    'strict_sms',
   'strict_whatsapp','perimeter','travel_speed_threshold','daily_working_hours','work_summary_interval',)
        }),
       
    )

    search_fields = ['company_name']



admin.site.register(Device,CustomAdminDevice)
admin.site.register(Company,CustomCompanyAdmin)
admin.site.register(CompanyRole,CustomCompanyRoleAdmin)
admin.site.register(CompanyUser,CustomCompanyUser)
admin.site.register(CompanyGroup,CustomCompanyGroupAdmin)
admin.site.register(CompanyShift,CustomAdminShift)
admin.site.register(VirtualDevice,CustomVirtualDevice)
admin.site.unregister(Group)





