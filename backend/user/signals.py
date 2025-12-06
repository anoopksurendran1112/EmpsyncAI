# signals.py (in user app)
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from user.models import CustomUser
from leave.models import LeaveType, LeaveCredit

@receiver(post_save, sender=CustomUser)
def create_leave_credits(sender, instance, created, **kwargs):
    if created:
        current_year = timezone.now().year
        leave_types = LeaveType.objects.filter(use_credit=True)

        for leave_type in leave_types:
            if leave_type.is_global or leave_type.company == instance.company:
                LeaveCredit.objects.get_or_create(
                    user=instance,
                    leave_type=leave_type,
                    year=current_year,
                    defaults={"credits": leave_type.initial_credit}
                )

# apps.py (in user app)
from django.apps import AppConfig

class UserConfig(AppConfig):
    name = 'user'

    def ready(self):
        import user.signals  # noqa

# settings.py
# Ensure 'user.apps.UserConfig' is listed in INSTALLED_APPS instead of just 'user'
