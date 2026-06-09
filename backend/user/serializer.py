from rest_framework import serializers
from .models import CustomUser
from company.models import CompanyRole,CompanyGroup, CompanyUser
from .models import Religion, Caste, EmployeeAddress, EmployeeProfile, BankDetail, EmployeeQualification, EmployeeExperience, ExperienceDesignation, EmployeeGuardian

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    prof_img = serializers.ImageField(required=False, allow_null=True)
    gender_display = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()

    role_id = serializers.PrimaryKeyRelatedField(
        source='role',
        queryset=CompanyRole.objects.all(),
        write_only=True
    )
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'prof_img', 'first_name', 'last_name', 'mobile', 'role', 'role_id','is_active',
            'biometric_id', 'email', 'id', 'is_superuser', 'password',
            'gender_display', 'gender', 'is_whatsapp', 'is_sms','is_wfh','group'
        ]
        read_only_fields = ['id', 'is_superuser', 'gender_display', 'role','group']


    def get_gender_display(self, obj):
        return obj.get_gender_display()
    

    def get_role(self, obj):
        company_id = self.context.get('company_id')

        # 1. Check in CompanyUser
        company_user = obj.company_links.filter(company__id=company_id).first()
        if company_user and company_user.role:
            return company_user.role.role

        # 2. Fallback to CustomUser role
        return obj.role.role if obj.role else None


    def get_group(self, obj):
        company_id = self.context.get('company_id')

        # 1. Check in CompanyUser
        company_user = obj.company_links.filter(company__id=company_id).first()
        if company_user and company_user.group:
            return company_user.group.short_name

        # 2. Fallback to CustomUser group
        return obj.group.short_name if obj.group else None


    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # secure password hashing
        user.save()
        return user

        
class OTPResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)


class GetUserSerializer(serializers.Serializer):
    company_id = serializers.IntegerField()

    class Meta:
        fields = ['company_id']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()  
    password = serializers.CharField(write_only=True)

    class Meta:
        fields = ['email','password']


class ReligionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Religion
        fields = '__all__'


class CasteSerializer(serializers.ModelSerializer):
    religion_name = serializers.CharField(source='religion.name', read_only=True)

    class Meta:
        model = Caste
        fields = ['id', 'religion', 'religion_name', 'name', 'caste_reservation']


class EmployeeAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAddress
        fields = '__all__'


class EmployeeProfileSerializer(serializers.ModelSerializer):
    religion_name = serializers.CharField(source='religion.name', read_only=True)
    caste_name = serializers.CharField(source='caste.name', read_only=True)
    staff_type_name = serializers.CharField(source='staff_type.name', read_only=True)
    staff_category_name = serializers.CharField(source='staff_category.name', read_only=True)
    
    present_address_details = EmployeeAddressSerializer(source='present_address', read_only=True)
    permanent_address_details = EmployeeAddressSerializer(source='permanent_address', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'dob',
            'religion', 'religion_name', 'caste', 'caste_name',
            'staff_type', 'staff_type_name', 'staff_category', 'staff_category_name',
            'present_address', 'present_address_details',
            'permanent_address', 'permanent_address_details',
            'ktu_id', 'aicte_id', 'pan_no', 'aadhar_no', 
            'blood_group', 'alternate_mobile', 'alternate_email',
            'date_of_joining', 'date_of_relieving', 'date_of_contract_completion', 'staff_id',
            'created_at', 'updated_at'
        ]
        
    def validate(self, data):
        religion = data.get('religion', getattr(self.instance, 'religion', None))
        caste = data.get('caste', getattr(self.instance, 'caste', None))
        staff_id = data.get('staff_id', getattr(self.instance, 'staff_id', None))
        user = data.get('user', getattr(self.instance, 'user', None))

        if caste and religion and caste.religion != religion:
            raise serializers.ValidationError({
                "caste": "The selected caste does not belong to the selected religion."
            })
            
        if staff_id and user:
            user_companies = user.company.all()
            
            duplicate_query = EmployeeProfile.objects.filter( staff_id=staff_id, user__company__in=user_companies)
            
            if self.instance:
                duplicate_query = duplicate_query.exclude(pk=self.instance.pk)
                
            if duplicate_query.exists():
                raise serializers.ValidationError({"staff_id": "This Staff ID is already assigned to an employee within this company."})
        return data

        
class EmployeeGuardianSerializer(serializers.ModelSerializer):
    relationship_type_display = serializers.CharField(source='get_relationship_type_display', read_only=True)

    class Meta:
        model = EmployeeGuardian
        fields = [
            'id', 'employee', 'name', 'phone', 
            'relationship_type', 'relationship_type_display', 
            'is_guardian', 'created_at', 'updated_at'
        ]


class BankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetail
        fields = '__all__'


class EmployeeQualificationSerializer(serializers.ModelSerializer):
    qualification_level_display = serializers.CharField(source='get_qualification_level_display', read_only=True)
    period_of_research = serializers.ReadOnlyField()

    class Meta:
        model = EmployeeQualification
        fields = ['id', 'user', 'qualification_level', 'qualification_level_display','specialization', 
                    'institution_name', 'university', 'location','start_date', 'completion_date', 
                    'period_of_research', 'percentage', 'certificate', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Serializer-level validation to handle timeline sanity checks.
        Supports both full creations and partial/PATCH updates cleanly.
        """
        start_date = data.get('start_date', getattr(self.instance, 'start_date', None))
        completion_date = data.get('completion_date', getattr(self.instance, 'completion_date', None))

        if start_date and completion_date and start_date > completion_date:
            raise serializers.ValidationError({
                "completion_date": "Completion / Certification date cannot be earlier than the Start / Enrollment date."
            })
        return data


class ExperienceDesignationSerializer(serializers.ModelSerializer):
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)
    company_role_name = serializers.CharField(source='company_role.role', read_only=True)
    company_group_name = serializers.CharField(source='company_group.short_name', read_only=True)
    
    class Meta:
        model = ExperienceDesignation
        fields = [
            'id', 'experience', 'designation', 
            'company_role', 'company_role_name', 
            'company_group', 'company_group_name',
            'start_date', 'end_date', 'change_type', 'change_type_display', 'description'
        ]

    def validate(self, data):
        experience = data.get('experience', getattr(self.instance, 'experience', None))
        
        if experience:
            if experience.is_internal:
                company_role = data.get('company_role', getattr(self.instance, 'company_role', None))
                company_group = data.get('company_group', getattr(self.instance, 'company_group', None))
                
                if not company_role or not company_group:
                    raise serializers.ValidationError({
                        "company_role": "Both structural Company Group and Company Role are required for internal designations."
                    })
            else:
                designation = data.get('designation', getattr(self.instance, 'designation', None))
                if not designation:
                    raise serializers.ValidationError({
                        "designation": "Designation text title is required for external employment history entries."
                    })
        return data


class EmployeeExperienceSerializer(serializers.ModelSerializer):
    designations = ExperienceDesignationSerializer(many=True, read_only=True)

    class Meta:
        model = EmployeeExperience
        fields = [
            'id', 'user', 'company_name', 'location', 
            'start_year', 'end_year', 'experience_letter', 
            'is_internal', 'designations', 'created_at', 'updated_at'
        ]
        
    def validate(self, data):
        is_internal = data.get('is_internal', getattr(self.instance, 'is_internal', False))
        if is_internal and not data.get('company_name'):
            data['company_name'] = "Internal Organization"
            
        return data