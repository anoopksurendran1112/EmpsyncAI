from django.urls import path
from .views import getPunches,todayPunch,add_virtual_punch,addPunch,punch_report_by_date,punch_report,fixPunchStatus

urlpatterns = [
    
    path('api/punch/<int:page>',getPunches),
    path('api/update',getPunches),
    path("api/punch/", getPunches, name="punch"),              # for POST/PATCH
    path('api/today-punch',todayPunch),
    path('api/add-virtual-punch',add_virtual_punch),
    path('api/add-punch',addPunch),
    path('api/user/punch',punch_report),
    path('api/punchreport',punch_report_by_date),
    path('api/punch/fix-status',fixPunchStatus),



]
