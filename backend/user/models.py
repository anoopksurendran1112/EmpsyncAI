from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from company import models as c
from dateutil.relativedelta import relativedelta


class CandidateApplications(models.Model):
    status_choices = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

    company = models.ForeignKey(c.Company,on_delete=models.CASCADE)
    group = models.ForeignKey(c.CompanyGroup,on_delete=models.SET_NULL,null=True)
    role = models.ForeignKey(c.CompanyRole,on_delete=models.SET_NULL,null=True)
    status = models.CharField(max_length=20, choices=status_choices, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


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
    shift = models.ForeignKey(c.CompanyShift,blank=True,null=True,on_delete=models.CASCADE)
    weekly_avg_working_hour = models.FloatField(default=0)
    monthly_avg_working_hour = models.FloatField(default=0)
    monthly_days_count = models.IntegerField(default=0)
    weekly_days_count = models.IntegerField(default=0)
    last_avg_calculated_date = models.DateField(null=True, blank=True)
    company = models.ManyToManyField( c.Company, blank=True, related_name='users_company')
    parent_company = models.ForeignKey(c.Company,blank=True, null=True,on_delete=models.SET_NULL)
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

    user = models.OneToOneField('CustomUser', on_delete=models.CASCADE, related_name='profile')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, null=True, blank=True)
    alternate_mobile = models.CharField(max_length=20, null=True, blank=True)
    alternate_email = models.EmailField(null=True, blank=True)
    present_address = models.ForeignKey(EmployeeAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='present_in_profiles')
    permanent_address = models.ForeignKey(EmployeeAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='permanent_in_profiles')
    religion = models.ForeignKey(Religion, on_delete=models.SET_NULL, null=True, blank=True)
    caste = models.ForeignKey(Caste, on_delete=models.SET_NULL, null=True, blank=True)
    pan_no = models.CharField(max_length=20, null=True, blank=True)
    aadhar_no = models.CharField(max_length=20, null=True, blank=True)
    staff_type = models.ForeignKey(c.StaffType, on_delete=models.SET_NULL, null=True, blank=True)
    staff_category = models.ForeignKey(c.StaffCategory, on_delete=models.SET_NULL, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    date_of_relieving = models.DateField(null=True, blank=True, help_text="Date of Relieving / Termination / Retirement")
    date_of_contract_completion = models.DateField(null=True, blank=True)
    staff_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    ktu_id = models.CharField(max_length=100, null=True, blank=True)
    aicte_id = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} Profile"

    def clean(self):
        super().clean()

        if self.caste and self.religion and self.caste.religion != self.religion:
            raise ValidationError({'caste': 'The selected caste does not belong to the selected religion.'})
            
        if self.staff_id and self.user:
            user_companies = self.user.company.all()
            duplicate_exists = EmployeeProfile.objects.filter(staff_id=self.staff_id, user__company__in=user_companies).exclude(pk=self.pk).exists()
            
            if duplicate_exists:
                raise ValidationError({'staff_id': 'This Staff ID is already assigned to an employee in this company.'})


class EmployeeGuardian(models.Model):
    TYPE_CHOICES = [
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('spouse', 'Spouse'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='guardians')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    relationship_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    is_guardian = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_relationship_type_display()}) - Employee: {self.employee.first_name}"

    def save(self, *args, **kwargs):
        if self.is_guardian:
            EmployeeGuardian.objects.filter(employee=self.employee, is_guardian=True).exclude(pk=self.pk).update(is_guardian=False)
            
        super().save(*args, **kwargs)


class EmployeeQualification(models.Model):
    QUALIFICATION_LEVEL_CHOICES = [
        ('UG', 'Undergraduate (UG)'),
        ('PG', 'Postgraduate (PG)'),
        ('MPHIL', 'M.Phil.'),
        ('PHD', 'Ph.D.'),
        ('POSTDOC', 'Post Doctoral (Post.Doc)'),
        ('RESEARCH_OTHERS', 'Research (Others)'),
        ('OTHERS', 'Others'),
    ]

    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='qualifications')
    qualification_level = models.CharField(max_length=100, choices=QUALIFICATION_LEVEL_CHOICES)
    specialization = models.CharField(max_length=150, help_text="Degree/Course name")
    institution_name = models.CharField(max_length=255)
    university = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True, help_text="Course Start Date / Enrollment Date")
    completion_date = models.DateField(null=True, blank=True, help_text="Passing Year / Certification / Completion Date")
    percentage = models.FloatField(null=True, blank=True, help_text="Percentage or CGPA (Leave blank for Research/Ph.D.)")
    certificate = models.FileField(upload_to='qualifications/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-completion_date']

    def __str__(self):
        return f"{self.user.first_name} - {self.get_qualification_level_display()} ({self.specialization})"

    @property
    def period_of_research(self):
        if self.start_date and self.completion_date:
            delta = relativedelta(self.completion_date, self.start_date)
            parts = []
            if delta.years > 0:
                parts.append(f"{delta.years} year{'s' if delta.years > 1 else ''}")
            if delta.months > 0:
                parts.append(f"{delta.months} month{'s' if delta.months > 1 else ''}")
            return ", ".join(parts) if parts else "0 months"
        return None


class EmployeeExperience(models.Model):
    TYPE_CHOICES = [
        ('Industry', 'Industry'),
        ('Institution', 'Institution'),
        ('Other', 'Other')
    ]

    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='experiences')
    company_name = models.CharField(max_length=200, null=True, blank=True, help_text="Leave blank or fill if external")
    is_internal = models.BooleanField(default=False, help_text="Designates if this career timeline experience is within the current company")
    
    category = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Other')
    is_aicte_approved = models.BooleanField(default=False)
    is_after_pg = models.BooleanField( default=False, help_text="Check if this experience was acquired AFTER acquiring your PG degree")

    location = models.CharField(max_length=100, null=True, blank=True)
    start_year = models.DateField()
    end_year = models.DateField(null=True, blank=True)
    experience_letter = models.FileField(upload_to='experience_letters/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        comp = self.company_name if not self.is_internal else "Internal Organization"
        return f"{self.user.first_name} at {comp}"


class ExperienceDesignation(models.Model):
    TYPE_CHOICES = [
        ('Joined', 'Joined'),
        ('Promotion', 'Promotion'),
        ('Demotion', 'Demotion'),
        ('Re-designation', 'Re-designation'),
    ]

    experience = models.ForeignKey(EmployeeExperience, on_delete=models.CASCADE, related_name='designations')
    designation = models.CharField(max_length=100, null=True, blank=True, help_text="Raw text entry for external history")
    company_role = models.ForeignKey('company.CompanyRole', on_delete=models.SET_NULL, null=True, blank=True, related_name='experience_designations')
    company_group = models.ForeignKey('company.CompanyGroup', on_delete=models.SET_NULL, null=True, blank=True, related_name='experience_designations')

    start_date = models.DateField(help_text="Effective date of this designation state")
    end_date = models.DateField(null=True, blank=True)
    change_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Joined')
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        title = self.company_role.role if self.company_role else self.designation
        return f"{title} ({self.change_type})"

    def clean(self):
        """
        Validates structure integrity based on internal/external scopes.
        """
        super().clean()
        if self.experience.is_internal:
            if not self.company_role or not self.company_group:
                raise ValidationError({
                    'company_role': 'Internal experiences must select a valid company Group and Role configuration.'
                })
        else:
            if not self.designation:
                raise ValidationError({
                    'designation': 'External experiences require a text-based designation name.'
                })


class BankDetail(models.Model):
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='bank_details')
    acc_holder_name = models.CharField(max_length=255)

    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=20)
    branch_name = models.CharField(max_length=255, null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.user.first_name})"

    def save(self, *args, **kwargs):
        if not self.pk and not BankDetail.objects.filter(user=self.user).exists():
            self.is_primary = True
        
        if self.is_primary:
            BankDetail.objects.filter(user=self.user, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
            
        super().save(*args, **kwargs)
