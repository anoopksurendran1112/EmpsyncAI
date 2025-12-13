# Filename: leave/management/commands/carry_forward_credits.py

from django.core.management.base import BaseCommand
from django.utils.timezone import now
from leave.models import LeaveCredit, LeaveType, Leave
from user.models import CustomUser
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Carry forward unused leave credits to next month if applicable'

    def handle(self, *args, **options):
        today = now().date()
        current_month = today.month
        current_year = today.year

        users = CustomUser.objects.all()
        leave_types = LeaveType.objects.filter(use_credit=True, carry_forward=True)

        for user in users:
            for lt in leave_types:
                # Get or create LeaveCredit
                credit_obj, _ = LeaveCredit.objects.get_or_create(user=user, leave_type=lt)

                # How much leave was used this month
                used = Leave.objects.filter(
                    user=user,
                    leave_type=lt,
                    from_date__month=current_month,
                    from_date__year=current_year,
                    status='A'  # Approved leaves only
                ).aggregate(total=Sum('days_taken'))['total'] or 0

                # Calculate remaining
                unused = max(credit_obj.credits - used, 0)

                # Add monthly credit
                credit_obj.credits = unused + lt.monthly_credit
                credit_obj.save()

                self.stdout.write(self.style.SUCCESS(
                    f'User: {user.email} | Leave: {lt.leave_type} | New Credit: {credit_obj.credits}'
                ))
