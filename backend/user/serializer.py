from rest_framework import serializers
from .models import CustomUser
from company.models import CompanyRole,CompanyGroup, CompanyUser

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