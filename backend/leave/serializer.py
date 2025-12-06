# serializers.py
from rest_framework import serializers
from user.serializer import UserSerializer
from .models import Leave,LeaveType  # Replace with the actual path


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    leave_type = LeaveTypeSerializer()
    status_display = serializers.SerializerMethodField()
    leave_type_display = serializers.CharField(source='leave_type.leave_type', read_only=True)
    class Meta:
        model = Leave

        fields = '__all__'  # or list only the required fields like ['id', 'start_date', 'end_date', ...]
    def get_status_display(self, obj):
        return obj.get_status_display()


        
