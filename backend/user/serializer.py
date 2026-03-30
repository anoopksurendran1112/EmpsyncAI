from rest_framework import serializers
from .models import CustomUser
from company.models import CompanyRole,CompanyGroup, CompanyUser
from .models import Religion, Caste, EmployeeAddress, EmployeeProfile

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
    # This read-only field is handy for the frontend dropdowns/tables
    religion_name = serializers.CharField(source='religion.name', read_only=True)

    class Meta:
        model = Caste
        fields = ['id', 'religion', 'religion_name', 'name', 'caste_reservation']


class EmployeeAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAddress
        fields = '__all__'


class EmployeeProfileSerializer(serializers.ModelSerializer):
    # Read-only text fields to aid frontend displaying
    religion_name = serializers.CharField(source='religion.name', read_only=True)
    caste_name = serializers.CharField(source='caste.name', read_only=True)
    staff_type_name = serializers.CharField(source='staff_type.name', read_only=True)
    staff_category_name = serializers.CharField(source='staff_category.name', read_only=True)
    
    # Read-only nested serializers so you get full address details on GET requests
    present_address_details = EmployeeAddressSerializer(source='present_address', read_only=True)
    permanent_address_details = EmployeeAddressSerializer(source='permanent_address', read_only=True)

    class Meta:
        model = EmployeeProfile
        # We explicitly list fields here so we can include our custom read-only fields above.
        fields = [
            'id', 'user', 'dob', 'guardian_name', 'guardian_phone',
            'religion', 'religion_name', 'caste', 'caste_name',
            'staff_type', 'staff_type_name', 'staff_category', 'staff_category_name',
            'present_address', 'present_address_details',
            'permanent_address', 'permanent_address_details',
            'ktu_id', 'aicte_id', 'pan_no', 'aadhar_no', 
            'blood_group', 'alternate_mobile', 'alternate_email',
            'created_at', 'updated_at'
        ]
        
    def validate(self, data):
        """
        Serializer-level validation to ensure caste belongs to religion before it hits the database.
        """
        # Handle cases where this might be a partial update (PATCH)
        religion = data.get('religion', getattr(self.instance, 'religion', None))
        caste = data.get('caste', getattr(self.instance, 'caste', None))

        if caste and religion and caste.religion != religion:
            raise serializers.ValidationError({
                "caste": "The selected caste does not belong to the selected religion."
            })
            
        return data

