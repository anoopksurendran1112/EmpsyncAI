from datetime import timedelta
from django.db import models


# Create your models here.

class Company(models.Model):

    INTERVAL_CHOICES = [
        ('W', 'Weekly'),
        ('M', 'Monthly'),
    
    ]
    enable_sms = models.BooleanField(default=False)
    enable_whatsapp = models.BooleanField(default=False)
    soft_disable = models.BooleanField(default=False, help_text="Disable all SMS & WhatsApp services when True")
    allow_individual_sms = models.BooleanField(default=True)
    allow_individual_whatsapp = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True,default=None)

    # Strict enable mode
    strict_sms = models.BooleanField(default=False, help_text="Force enable SMS for all employees")
    strict_whatsapp = models.BooleanField(default=False, help_text="Force enable WhatsApp for all employees")

    perimeter = models.FloatField(default= 3.5)
    travel_speed_threshold = models.FloatField(default=10)
    company_name = models.CharField(max_length=100)
    latitude = models.FloatField(null=True,default=None)
    longitude = models.FloatField(null=True,default=None)
    daily_working_hours = models.IntegerField(default=8)
    work_summary_interval = models.CharField(max_length=10,choices=INTERVAL_CHOICES,default='W')
    REQUIRED_FIELDS = ['company_name','company_img']
    company_img = models.ImageField(upload_to="company_images")
    punch_mode = models.CharField(
    max_length=20,
    choices=[('S', 'Single Punch'), ('M', 'Multiple Punch')],
    default='S'
)


    def __str__(self):
        return self.company_name
    



class College(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'colleges'


class Machine(models.Model):
    id = models.AutoField(primary_key=True)
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    machine_id = models.CharField(max_length=50)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'machines'


class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    password = models.CharField(max_length=255)
    remember_token = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    college_code = models.CharField(max_length=20)
    jwt_token = models.TextField()

    class Meta:
        managed = False
        db_table = 'users'

    




class CompanyShift(models.Model):

    shift = models.CharField(max_length=100)
    check_in = models.TimeField()
    check_out = models.TimeField()
    late_allowance = models.DurationField(default=timedelta(minutes=15))
    company = models.ForeignKey('company.Company',on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.shift} ({self.check_in} - {self.check_out})"
    

class CompanyRole(models.Model):
    role = models.CharField(null=True,blank=True,max_length=100)
    company = models.ManyToManyField(Company, related_name='roles')
    working_hour = models.FloatField(null=True,blank=True)
    def __str__(self):
        return self.role if self.role else "Unnamed Role"


class CompanyGroup(models.Model):
    group = models.CharField(max_length=80,null=True,blank=True)
    short_name = models.CharField(max_length=20,null=True,blank=True)
    company = models.ForeignKey(Company,on_delete=models.CASCADE)
    only_visible_to_lead	 = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.group}"



class CompanyUser(models.Model):
    user = models.ForeignKey('user.CustomUser', on_delete=models.CASCADE, related_name="company_links")
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name="user_links",null=True, blank=True)
    role = models.ForeignKey(CompanyRole, null=True, blank=True,on_delete=models.CASCADE)
    group = models.ForeignKey(CompanyGroup, null=True, blank=True,on_delete=models.CASCADE)
    team_lead = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'company')

    
class Device(models.Model):

    ENTRY_TYPE_CHOICES = [('Check-In', 'Check-In'),('Check-Out', 'Check-Out'),]
    device_id = models.CharField(max_length = 50)
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='devices')
    is_active = models.BooleanField(default=True)
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)

    entry_type = models.CharField(choices=ENTRY_TYPE_CHOICES,max_length=15,null=True,blank=True)



class VirtualDevice(models.Model):
    virtual_device = models.CharField(max_length=200,unique=True)
    physical_device = models.CharField(null=True,blank=True,max_length=200)
   
    company = models.ForeignKey(Company,on_delete=models.CASCADE,null=True,blank=True)
    user = models.ForeignKey('user.CustomUser',related_name='virtual_devices',on_delete=models.SET_NULL,null=True)
    is_active = models.BooleanField(default=True)


# Staff type and Staff Category tables    
class StaffType(models.Model):
    type_name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return self.type_name

class StaffCategory(models.Model):
    category_name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return self.category_name
