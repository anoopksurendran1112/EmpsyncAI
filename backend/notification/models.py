from django.db import models

# Create your models here.
class FcmToken(models.Model):
    fcm_token = models.TextField()
    user = models.ForeignKey('user.CustomUser',on_delete=models.SET_NULL,null=True)