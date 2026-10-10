from django.urls import path
from .views import add_holiday, add_past_leave, apply_leave, approve_leave, download_leave_template, get_calendar, get_eligible_replacements, get_holiday, get_leave_flow_hierarchy, get_leave_types, get_my_leaves, get_pending_approvals, get_requested_leaves, reject_leave, update_holiday, update_leave_status, update_leave_type, get_leave_balance, get_leave_roster, upload_leave_balances, upload_past_leaves

urlpatterns = [path('api/get-calendar/<int:id>',get_calendar),
                path('api/apply-leave',apply_leave),
                path('api/add-leave', add_past_leave),
                path('api/eligible-replacements', get_eligible_replacements),
                path('api/leave-types',get_leave_types),
                path('api/leave-flow-hierarchy', get_leave_flow_hierarchy),
                path('api/admin/leave-request/<int:page>',get_requested_leaves),
                path('api/my-leaves',get_my_leaves),
                path('api/update-leave',update_leave_status),
                path('api/update-holiday',update_holiday),           
                path('api/add-holiday',add_holiday),
                path('api/holiday',get_holiday),
                path('api/leave-balance', get_leave_balance),
                path('api/leave-roster', get_leave_roster),
                path('leaves/<int:id>/approve/', approve_leave),
                path('leaves/<int:id>/reject/', reject_leave),
                path('leaves/pending-approvals/', get_pending_approvals),
                path('api/upload-leave-balances', upload_leave_balances),
                path('api/upload-past-leaves', upload_past_leaves),
                path('api/leave-template/<str:style>', download_leave_template),

               ]

