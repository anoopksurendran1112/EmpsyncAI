from django.db import models
from company.models import CompanyRole
from django.utils import timezone



# Create your models here.

class Holiday(models.Model):
    holiday = models.CharField(max_length=255)
    date = models.DateField()
    is_global = models.BooleanField(default=False)
    role = models.ManyToManyField(CompanyRole)
    is_recurring = models.BooleanField(default=False)
    is_full_holiday = models.BooleanField(default=False)
    company = models.ManyToManyField(
        'company.Company',
        blank=True,
        related_name='holidays',
    )


# class LeaveType(models.Model):
#     company = models.ForeignKey('company.company',null=True,blank=True,on_delete=models.CASCADE)
#     leave_type = models.CharField(max_length=100)
#     short_name = models.CharField(max_length=4,null=True,blank=True)
#     is_active = models.BooleanField(default=True)
#     is_global = models.BooleanField(default=False)
#     monthly_limit = models.FloatField(max_length=3,null=True,blank=True)
#     yearly_limit = models.FloatField(max_length=3,null=True,blank=True)

#     def __str__(self):
#         return self.leave_type


class LeaveType(models.Model):
    leave_type = models.CharField(max_length=100)
    short_name = models.CharField(max_length=10,null=True,blank=True)
    monthly_limit = models.FloatField(null=True, blank=True)
    yearly_limit = models.FloatField(null=True, blank=True)
    allow_carry_forward = models.BooleanField(default=True) 
    initial_credit = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)
    is_global = models.BooleanField(default=False)
    company = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    is_global = models.BooleanField(default=False)
    use_credit = models.BooleanField(default=False)

    def __str__(self):
        return self.leave_type

   



class Leave(models.Model):
    LEAVE_CHOICES = [
        ('F', 'Full day'),
        ('H', 'Half day'),
    ]

    LEAVE_STATUS_CHOICES = [
        ('P', 'Pending'),
        ('A', 'Approved'),
        ('R', 'Rejected'),
        ('C', 'Cancelled'),
    ]
    
    user = models.ForeignKey('user.CustomUser', on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, null=True, blank=True)
    days_taken = models.FloatField(default=0)
    company = models.ForeignKey('company.company',null=True,blank=True,on_delete=models.SET_NULL)
    from_date = models.DateField()
    to_date = models.DateField()
    leave_choice = models.CharField(choices=LEAVE_CHOICES,max_length=70)
    status = models.CharField(choices=LEAVE_STATUS_CHOICES,max_length=50)
    custom_reason = models.TextField(null=True, blank=True)  # 🔥 For custom leave reason
    approval_trail = models.JSONField(default=dict,blank=True,null=True)

    def __str__(self):
        return f"{self.user} - {self.leave_type or 'Custom'} ({self.from_date})"

class LeaveFlowHierarchy(models.Model):
    company = models.OneToOneField('company.Company',on_delete=models.CASCADE,related_name='leave_hierarchy')
    flow_config = models.JSONField(default=list,blank=True,help_text='Stores ordered user IDs or steps between team lead and company head')

    def __str__(self):
        return f"Leave Flow for {self.company}"

class LeaveCredit(models.Model):
    user = models.ForeignKey('user.CustomUser', on_delete=models.CASCADE)
    leave_type = models.ForeignKey('LeaveType', on_delete=models.CASCADE)
    credits = models.FloatField(default=0)
    year = models.IntegerField(default=timezone.now().year)

class LeavePolicy(models.Model):
    company = models.ForeignKey('company.Company', on_delete=models.CASCADE, related_name='leave_policies')
    leave_type = models.ForeignKey('leave.LeaveType', on_delete=models.CASCADE, related_name='policies')
    staff_category = models.ForeignKey('company.StaffCategory', on_delete=models.CASCADE, related_name='leave_policies')
    
    monthly_limit = models.FloatField(null=True, blank=True)
    yearly_limit = models.FloatField(null=True, blank=True)
    initial_credit = models.FloatField(default=0)
    allow_carry_forward = models.BooleanField(default=True)
    use_credit = models.BooleanField(default=False)
    custom_settings = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'staff_category', 'leave_type')
        verbose_name_plural = "Leave Policies"

    def __str__(self):
        return f"{self.company.company_name} - {self.staff_category.category_name} - {self.leave_type.leave_type}"
