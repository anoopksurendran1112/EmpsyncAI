from django.core.management.base import BaseCommand
from leave.models import LeaveType, LeaveCredit
from user.models import CustomUser
from django.utils import timezone

class Command(BaseCommand):
    help = 'Carry forward unused leave credits at year-end'

    def handle(self, *args, **kwargs):
        current_year = timezone.now().year
        next_year = current_year + 1

        leave_types = LeaveType.objects.filter(use_credit=True, allow_carry_forward=True)

        for leave_type in leave_types:
            users = CustomUser.objects.filter(company=leave_type.company)
            for user in users:
                try:
                    credit = LeaveCredit.objects.get(user=user, leave_type=leave_type, year=current_year)
                    unused = credit.credits
                    carry = min(unused, leave_type.max_carry_forward or unused)
                except LeaveCredit.DoesNotExist:
                    carry = 0

                # Create or update credit for next year
                next_credit, created = LeaveCredit.objects.get_or_create(
                    user=user, leave_type=leave_type, year=next_year,
                    defaults={'credits': carry}
                )
                if not created:
                    next_credit.credits += carry
                    next_credit.save()

        self.stdout.write(self.style.SUCCESS('✅ Carried forward unused credits.'))
