# leave/management/commands/reset_leave_credits.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from leave.models import LeaveType, LeaveCredit
from user.models import CustomUser

class Command(BaseCommand):
    help = "Reset or carry forward leave credits for all users at the start of a new year"

    def handle(self, *args, **kwargs):
        year = timezone.now().year
        users = CustomUser.objects.all()
        total_updated = 0

        for user in users:
            for lt in LeaveType.objects.filter(is_active=True):
                # Get or create current year's credit
                credit, _ = LeaveCredit.objects.get_or_create(
                    user=user,
                    leave_type=lt,
                    year=year,
                    defaults={'credits': lt.initial_credit or 0}
                )

                if getattr(lt, 'allow_carry_forward', False):
                    # carry forward unused credits from last year
                    last_year = LeaveCredit.objects.filter(user=user, leave_type=lt, year=year-1).first()
                    if last_year:
                        credit.credits += last_year.credits
                else:
                    # reset to initial credit
                    credit.credits = lt.initial_credit or 0

                credit.save()
                total_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Successfully updated leave credits for {total_updated} records for year {year}"
        ))
