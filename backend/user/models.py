from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from company import models as c


class CustomUserManager(BaseUserManager):
   
    def create_user(self, email, password=None, **extra_fields):
       
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    

    def create_superuser(self, email, password=None, **extra_fields):
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
    

class CustomUser(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('N', 'Prefer not to say'),
    ]
    
    mobile = models.CharField(max_length=12, unique=True)
    username = None  # Keep this as None
    first_name = models.CharField(max_length=50)
    group = models.ForeignKey('company.CompanyGroup',on_delete=models.SET_NULL,null=True,blank=True)
    team_lead = models.BooleanField(default=False)
    is_sms = models.BooleanField(default=True)
    is_wfh = models.BooleanField(default=False)
    is_whatsapp = models.BooleanField(default=True)
    role = models.ForeignKey(c.CompanyRole,null=True,blank=True,on_delete=models.SET_NULL)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    prof_img = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    biometric_id = models.CharField(max_length=20,null=True,blank=True)
    gender = models.CharField(max_length=2, choices=GENDER_CHOICES, default='N')
    company = models.ManyToManyField(c.Company,blank=True)
    shift = models.ForeignKey(c.CompanyShift,blank=True,null=True,on_delete=models.CASCADE)
    weekly_avg_working_hour = models.FloatField(default=0)
    monthly_avg_working_hour = models.FloatField(default=0)
    monthly_days_count = models.IntegerField(default=0)
    weekly_days_count = models.IntegerField(default=0)
    last_avg_calculated_date = models.DateField(null=True, blank=True)
    company = models.ManyToManyField(
    c.Company,
    blank=True,
    related_name='users_company'
)
    parent_company = models.ForeignKey(
        c.Company,
        blank=True,
         null=True,
        on_delete=models.SET_NULL
    )
    is_active = models.BooleanField(default=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name','last_name','mobile'] 

    objects = CustomUserManager()  # Assign your custom manager

    def __str__(self):
        return self.email



  
