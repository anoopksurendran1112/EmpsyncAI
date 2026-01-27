from rest_framework import serializers
from .models import Company,Device,StaffType,StaffCategory



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
            'id', 'company_name', 'company_img', 'latitude', 'longitude',
            'perimeter', 'travel_speed_threshold', 'daily_working_hours',
            'work_summary_interval', 'punch_mode', 'is_admin'
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

