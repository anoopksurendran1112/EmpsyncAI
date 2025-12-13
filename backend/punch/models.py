from django.db import models
from user.models import CustomUser


# Create your models here.


class PunchRecords(models.Model):

    user_id = models.IntegerField()
    punch_time = models.DateTimeField()
    device_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=10, choices=[('Check-In', 'Check-In'), ('Check-Out', 'Check-Out')],blank=True,null=True)
    received_at = models.DateTimeField(auto_now_add=True)
    client_ip = models.CharField(max_length=45, null=True, blank=True)
    class Meta:
        db_table = 'punch_records'


class ShiftSwap(models.Model):
    user1 = models.ForeignKey('user.CustomUser', related_name='swap_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey('user.CustomUser', related_name='swap_user2', on_delete=models.CASCADE)
    shift1 = models.ForeignKey('company.CompanyShift', related_name='swap_shift1', on_delete=models.CASCADE)
    shift2 = models.ForeignKey('company.CompanyShift', related_name='swap_shift2', on_delete=models.CASCADE)
    swap_date = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)




class VirtualPunchRecords(models.Model):

    user = models.ForeignKey('user.CustomUser',on_delete=models.SET_NULL,null=True)
    admin = models.CharField(max_length=100,null=True)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    punch_time = models.DateTimeField()
    device_id = models.CharField(max_length=255, null=True, blank=True)
    physical_device = models.CharField(null=True,blank=True,max_length=150)
    status = models.CharField(max_length=10, choices=[('Check-In', 'Check-In'), ('Check-Out', 'Check-Out')],blank=True,null=True)
    

    
