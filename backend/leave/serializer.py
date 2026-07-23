# serializers.py
from rest_framework import serializers
from user.serializer import UserSerializer
from .models import Leave, LeaveType


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    leave_type = LeaveTypeSerializer()
    status_display = serializers.SerializerMethodField()
    leave_type_display = serializers.CharField(source='leave_type.leave_type', read_only=True)
    current_approver_detail = serializers.SerializerMethodField()
    hierarchy_total_levels = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = '__all__'

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_current_approver_detail(self, obj):
        if obj.current_approver:
            return {
                'id': obj.current_approver.id,
                'name': f"{obj.current_approver.first_name} {obj.current_approver.last_name}".strip(),
            }
        return None

    def get_hierarchy_total_levels(self, obj):
        try:
            return len(obj.company.leave_hierarchy.flow_config or [])
        except Exception:
            return 0