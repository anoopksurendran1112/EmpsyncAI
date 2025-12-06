from django.core.management.base import BaseCommand
from django.utils.timezone import now
from user.utils import update_avg_hours as u

class Command(BaseCommand):
    help = "Update weekly and monthly average working hours for all users"

    def handle(self, *args, **kwargs):
        today = now().date()
        u.recalculate_all_users(today=today)
        self.stdout.write(self.style.SUCCESS("Successfully updated avg working hours"))
