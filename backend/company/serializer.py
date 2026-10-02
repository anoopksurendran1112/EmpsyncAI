from rest_framework import serializers
from datetime import timedelta

from .models import (Company, Device, StaffType, StaffCategory, CompanyProfile, StaffIdConfig, CompanyFieldSetting, CompanyShift,)

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = '__all__'




class DeviceSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',  # Maps company_id to the company ForeignKey
        write_only=True  # Optional: Only use for input, not output
    )

    class Meta:
        model = Device
        fields = ['device_id','company_id', 'is_active', 'from_date', 'to_date']



class CompanySerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'id_uuid', 'company_name', 'company_img', 'latitude', 'longitude',
            'perimeter', 'travel_speed_threshold', 'daily_working_hours',
            'work_summary_interval', 'punch_mode', 'is_admin',
            'enable_sms', 'enable_whatsapp', 'soft_disable', 
            'allow_individual_sms', 'allow_individual_whatsapp',
            'strict_sms', 'strict_whatsapp'
        ]

    def get_is_admin(self, company):
        user = self.context.get('user')
        if not user:
            return False
        from .models import CompanyUser
        cu = CompanyUser.objects.filter(company=company, user=user).first()
        return cu.is_admin if cu else False


class StaffTypeSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True
    )

    class Meta:
        model = StaffType
        fields = ['id', 'type_name', 'company_id']


class StaffCategorySerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True
    )

    class Meta:
        model = StaffCategory
        fields = ['id', 'category_name', 'company_id']


class StaffIdConfigSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True
    )
    company_name = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model = StaffIdConfig
        fields = ['id', 'company_id', 'company_name', 'staff_id_prefix', 'staff_id_suffix', 'start_id']


class CompanyFieldSettingSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(),source="company",write_only=True)
    company_name = serializers.CharField(source="company.company_name",read_only=True)

    class Meta:
        model = CompanyFieldSetting
        fields = ["id", "company_id", "company_name", "config"]


class CompanyShiftSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True,
    )
    late_allowance_minutes = serializers.IntegerField(write_only=True, required=False, min_value=0)
    staff_type_id = serializers.PrimaryKeyRelatedField(
        source='staff_type',
        queryset=StaffType.objects.all(),
        allow_null=True,
        required=False,
    )
    staff_type_name = serializers.CharField(source='staff_type.type_name', read_only=True)

    class Meta:
        model = CompanyShift
        fields = [
            'id', 'shift', 'check_in', 'check_out', 'late_allowance_minutes',
            'days_applicable', 'applicable_to', 'staff_count', 'staff_type_id',
            'staff_type_name', 'company_id',
        ]

        read_only_fields = ['staff_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['late_allowance_minutes'] = int(instance.late_allowance.total_seconds() // 60)
        data['company_id'] = instance.company_id
        return data

    def create(self, validated_data):
        minutes = validated_data.pop('late_allowance_minutes', 15)
        validated_data['late_allowance'] = timedelta(minutes=minutes)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        minutes = validated_data.pop('late_allowance_minutes', None)
        if minutes is not None:
            validated_data['late_allowance'] = timedelta(minutes=minutes)
        return super().update(instance, validated_data)