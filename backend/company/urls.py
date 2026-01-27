from django.urls import path
from .views import addCompany,getCompany,getCompanyRoles,addCompanyRoles,device,get_user_contact,get_virtual_devices,update_virtual_device,update_biometric_device,add_biometric_device,get_biometric_device,delete_virtual_device,getCompanyGroups,addCompanyGroup,create_all_view,staff_type_view,staff_category_view


urlpatterns = [
   path('company/', create_all_view, name='create_all'),
   path('api/admin/add-company',addCompany),
   path('api/company',getCompany),

   path('api/role/<int:id>',getCompanyRoles),
   path('api/admin/add-role',addCompanyRoles),

   path('api/group/<int:id>',getCompanyGroups),
   path('api/admin/add-group',addCompanyGroup),

   path('api/admin/device',device),
   path('api/virtual-device/<int:page>',get_virtual_devices),
   path('api/update-virtual-device',update_virtual_device),
   path('api/delete-virtual-device/<int:id>',delete_virtual_device),

   path('api/biometric-device/<int:id>',update_biometric_device),
   path('api/get-biometric-device/<int:page>',get_biometric_device),
   path('api/biometric-device/<int:id>',update_biometric_device),
   path('api/add-biometric-device',add_biometric_device),

   path('api/get-user-contact',get_user_contact),
   
   path('api/staff-type/', staff_type_view),
   path('api/staff-type/<int:type_id>', staff_type_view),

   path('api/staff-category/', staff_category_view),
   path('api/staff-category/<int:category_id>', staff_category_view),
    
]
