# signals.py (in user app)
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from user.models import CustomUser, EmployeeProfile, EmployeeHistoryEvent
from leave.models import LeaveType, LeaveCredit


# ─────────────────────────────────────────────────────────────
# Existing: auto-create leave credits + blank profile on signup
# ─────────────────────────────────────────────────────────────
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

        EmployeeProfile.objects.get_or_create(
            user=instance,
            defaults={
                'date_of_joining': timezone.now().date()
            }
        )


# ─────────────────────────────────────────────────────────────
# History: capture date_of_joining before it changes
# ─────────────────────────────────────────────────────────────
@receiver(pre_save, sender=EmployeeProfile)
def capture_joining_date_change(sender, instance, **kwargs):
    """
    Stash the old date_of_joining on the instance before saving
    so the post_save signal can compare and create a Correction event.
    """
    if not instance.pk:
        # Brand new profile — nothing to compare yet
        instance._old_joining_date = None
        return
    try:
        old = EmployeeProfile.objects.get(pk=instance.pk)
        instance._old_joining_date = old.date_of_joining
    except EmployeeProfile.DoesNotExist:
        instance._old_joining_date = None


# ─────────────────────────────────────────────────────────────
# History: auto-create Joined event + Correction events
# ─────────────────────────────────────────────────────────────
@receiver(post_save, sender=EmployeeProfile)
def record_employee_history_event(sender, instance, created, **kwargs):
    company = instance.user.parent_company
    if not company:
        return  # Can't record without a company

    if created:
        # ── Auto-record the initial Joined event ──────────────────
        if instance.date_of_joining:
            EmployeeHistoryEvent.objects.get_or_create(
                employee=instance.user,
                company=company,
                event_type='joined',
                effective_date=instance.date_of_joining,
                defaults={
                    'to_group': instance.user.group,
                    'to_role':  instance.user.role,
                    'reason':   'Initial joining',
                }
            )
    else:
        # ── Auto-record a Correction event if date_of_joining changed ─
        old_date = getattr(instance, '_old_joining_date', None)
        new_date = instance.date_of_joining

        if old_date is not None and old_date != new_date:
            EmployeeHistoryEvent.objects.create(
                employee=instance.user,
                company=company,
                event_type='correction',
                effective_date=new_date or timezone.now().date(),
                corrected_field='date_of_joining',
                old_value=str(old_date),
                new_value=str(new_date),
                reason='Date of joining corrected',
            )
