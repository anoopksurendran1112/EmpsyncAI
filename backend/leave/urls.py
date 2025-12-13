from django.urls import path
from .views import get_calendar,apply_leave,get_leave_types,get_requested_leaves,update_leave_status,update_leave_type,get_holiday,update_holiday,add_holiday

urlpatterns = [path('api/get-calendar/<int:id>',get_calendar),
                path('api/apply-leave',apply_leave),
                path('api/leave-types',get_leave_types),
                path('api/admin/leave-request/<int:page>',get_requested_leaves),
                path('api/update-leave',update_leave_status),
                path('api/update-holiday',update_holiday),           
                path('api/add-holiday',add_holiday),
                path('api/holiday',get_holiday),

               ]
