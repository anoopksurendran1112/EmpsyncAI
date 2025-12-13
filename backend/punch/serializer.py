from rest_framework import serializers
from .models import PunchRecords

class PunchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PunchRecords
        fields = '__all__'


class PunchPostSerializer(serializers.ModelSerializer):

    biometric_id = serializers.IntegerField()
    company_id = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    class Meta:
        model = PunchRecords
        fields = ['biometric_id','company_id','start_date','end_date','user_id']



class TodayPunchPostSerializer(serializers.Serializer):

    biometric_id = serializers.IntegerField()
    company_id = serializers.IntegerField()
 

    class Meta:
        model = PunchRecords
        fields = ['biometric_id','company_id','user_id']