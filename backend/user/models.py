from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from company import models as c


class Religion(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Caste(models.Model):
    religion = models.ForeignKey(Religion, on_delete=models.CASCADE, related_name='castes')
    name = models.CharField(max_length=255)
    caste_reservation = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.religion.name})"


class EmployeeAddress(models.Model):
    address_line_1 = models.CharField(max_length=255, help_text="House No, Building Name")
    address_line_2 = models.CharField(max_length=255, null=True, blank=True, help_text="Street, Area, Landmark")
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.address_line_1}, {self.city}"


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


class EmployeeProfile(models.Model):
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A Positive'),
        ('A-', 'A Negative'),
        ('B+', 'B Positive'),
        ('B-', 'B Negative'),
        ('AB+', 'AB Positive'),
        ('AB-', 'AB Negative'),
        ('O+', 'O Positive'),
        ('O-', 'O Negative'),
    ]

    # One-to-One link back to your CustomUser model
    user = models.OneToOneField('CustomUser', on_delete=models.CASCADE, related_name='profile')
    
    dob = models.DateField()
    guardian_name = models.CharField(max_length=255, null=True, blank=True)
    guardian_phone = models.CharField(max_length=20, null=True, blank=True)
    
    religion = models.ForeignKey(Religion, on_delete=models.SET_NULL, null=True, blank=True)
    caste = models.ForeignKey(Caste, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Connecting to StaffType and StaffCategory in your company app
    staff_type = models.ForeignKey(c.StaffType, on_delete=models.SET_NULL, null=True, blank=True)
    staff_category = models.ForeignKey(c.StaffCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Using specific related_names because they both point to the same model
    present_address = models.ForeignKey(EmployeeAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='present_in_profiles')
    permanent_address = models.ForeignKey(EmployeeAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='permanent_in_profiles')
    
    ktu_id = models.CharField(max_length=100, null=True, blank=True)
    aicte_id = models.CharField(max_length=100, null=True, blank=True)
    pan_no = models.CharField(max_length=20, null=True, blank=True)
    aadhar_no = models.CharField(max_length=20, null=True, blank=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, null=True, blank=True)
    alternate_mobile = models.CharField(max_length=20, null=True, blank=True)
    alternate_email = models.EmailField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} Profile"

    def clean(self):
        """
        Model validation to ensure the assigned caste belongs to the assigned religion.
        """
        super().clean()
        if self.caste and self.religion and self.caste.religion != self.religion:
            raise ValidationError({
                'caste': 'The selected caste does not belong to the selected religion.'
            })
