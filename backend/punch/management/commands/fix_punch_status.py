from django.core.management.base import BaseCommand
from punch.utils.fix_punch import fix_punch   # 🔥 import common function

class Command(BaseCommand):
    help = "Safely fix punch statuses with optional company/date filters."

    def add_arguments(self, parser):
        parser.add_argument("--company", type=int, required=False)
        parser.add_argument("--date", type=str, required=False)

    def handle(self, *args, **options):
        company = options.get("company")
        date = options.get("date")
        user_id = options.get("user_id")


        result = fix_punch(company_id=company, date=date,user_id=user_id)
        if result["success"]:
            self.stdout.write(f"✅ {result['message']}. Total fixed: {result['fixed']}")
        else:
            self.stderr.write(f"❌ {result['message']}")




# from django.core.management.base import BaseCommand
# from datetime import datetime
# from punch.models import PunchRecords
# from company.models import Device
# import sys

# class Command(BaseCommand):
#     help = "Safely fix punch statuses with optional company/date filters and progress tracking."

#     def add_arguments(self, parser):
#         parser.add_argument(
#             "--company", type=int, required=False,
#             help="Company ID to process only that company"
#         )
#         parser.add_argument(
#             "--date", type=str, required=False,
#             help="Process only a specific date (YYYY-MM-DD)"
#         )

#     def print_progress(self, current, total, prefix=""):
#         bar_len = 20
#         filled_len = int(bar_len * current / total) if total else 0
#         bar = "#" * filled_len + "-" * (bar_len - filled_len)
#         percent = (current / total * 100) if total else 0
#         sys.stdout.write(f"\r{prefix}[{bar}] {percent:5.1f}% ({current}/{total})")
#         sys.stdout.flush()

#     def handle(self, *args, **options):
#         company_filter = options.get("company")
#         date_filter = options.get("date")

#         # Convert date string to date object if provided
#         if date_filter:
#             try:
#                 date_filter = datetime.strptime(date_filter, "%Y-%m-%d").date()
#             except ValueError:
#                 self.stderr.write("❌ Invalid date format. Use YYYY-MM-DD.")
#                 return

#         self.stdout.write("🔧 Starting Punch Fix...\n")

#         # Device filtering by company if provided
#         if company_filter:
#             devices = Device.objects.using("default").filter(company_id=company_filter)
#             if not devices.exists():
#                 self.stdout.write("⚠ No devices found for this company.")
#                 return
#         else:
#             devices = Device.objects.using("default").all()

#         total_devices = devices.count()
#         processed_devices = 0

#         for device in devices:
#             company = device.company

#             # Punch filtering by date if provided
#             punches = PunchRecords.objects.using("secondary").filter(device_id=device.device_id)
#             if date_filter:
#                 punches = punches.filter(punch_time__date=date_filter)

#             total_punches = punches.count()
#             processed_devices += 1

#             self.stdout.write(
#                 f"\n🏢 Company: {company} | Device: {device.device_id} | Records: {total_punches}"
#             )

#             if total_punches == 0:
#                 continue

#             user_dates = punches.values_list('user_id', 'punch_time__date').distinct()
#             total_user_dates = len(user_dates)
#             processed_user_dates = 0

#             for user_id, p_date in user_dates:
#                 # Pull across all devices per user/day (main fix)
#                 user_punches = PunchRecords.objects.using("secondary").filter(
#                     user_id=user_id,
#                     punch_time__date=p_date
#                 ).order_by("punch_time")

#                 if not user_punches.exists():
#                     processed_user_dates += 1
#                     self.print_progress(processed_user_dates, total_user_dates, prefix="   ")
#                     continue

#                 statuses = list(user_punches.values_list("status", flat=True))
#                 if "Check-In" in statuses and "Check-Out" in statuses:
#                     processed_user_dates += 1
#                     self.print_progress(processed_user_dates, total_user_dates, prefix="   ")
#                     continue

#                 # Alternate statuses safely
#                 for index, punch in enumerate(user_punches):
#                     punch.status = "Check-In" if index % 2 == 0 else "Check-Out"
#                     punch.save(using="secondary")

#                 processed_user_dates += 1
#                 self.print_progress(processed_user_dates, total_user_dates, prefix="   ")

#             self.stdout.write(f"\n✅ Finished device {device.device_id} ({processed_user_dates}/{total_user_dates})")

#         self.stdout.write("\n🎉 Punch Fix Completed Successfully.\n")




# from django.core.management.base import BaseCommand
# from datetime import date
# from django.utils.timezone import make_aware
# from punch.models import PunchRecords
# from company.models import Device
# import math, sys

# class Command(BaseCommand):
#     help = "Safely fix punch statuses per user/device per day with progress tracking."

#     def print_progress(self, current, total, prefix=""):
#         bar_len = 20
#         filled_len = int(bar_len * current / total) if total else 0
#         bar = "#" * filled_len + "-" * (bar_len - filled_len)
#         percent = (current / total * 100) if total else 0
#         sys.stdout.write(f"\r{prefix}[{bar}] {percent:5.1f}% ({current}/{total})")
#         sys.stdout.flush()

#     def handle(self, *args, **options):
#         self.stdout.write("🔧 Starting safe punch status fix...\n")

#         devices = Device.objects.using('default').all()
#         total_devices = devices.count()
#         processed_devices = 0

#         for device in devices:
#             company = device.company
#             punches = PunchRecords.objects.using('secondary').filter(device_id=device.device_id)
#             total_punches = punches.count()

#             processed_devices += 1
#             self.stdout.write(f"\n🏢 Company: {company} | Device: {device.device_id} | Total punches: {total_punches}")

#             if total_punches == 0:
#                 continue

#             user_dates = punches.values_list('user_id', 'punch_time__date').distinct()
#             total_user_dates = len(user_dates)
#             processed_user_dates = 0

#             for user_id, punch_date in user_dates:
#                 user_punches = punches.filter(
#                     user_id=user_id,
#                     punch_time__date=punch_date
#                 ).order_by('punch_time')

#                 if not user_punches.exists():
#                     continue

#                 statuses = list(user_punches.values_list('status', flat=True))
#                 if "Check-In" in statuses and "Check-Out" in statuses:
#                     processed_user_dates += 1
#                     self.print_progress(processed_user_dates, total_user_dates, prefix="   ")
#                     continue

#                 # Use device entry_type if available
#                 if device.entry_type:
#                     user_punches.update(status=device.entry_type)
#                 else:
#                     for i, punch in enumerate(user_punches):
#                         punch.status = "Check-In" if i % 2 == 0 else "Check-Out"
#                         punch.save(using='secondary')

#                 processed_user_dates += 1
#                 self.print_progress(processed_user_dates, total_user_dates, prefix="   ")

#             self.stdout.write(f"\n✅ Completed {device.device_id} ({processed_user_dates}/{total_user_dates})")

#         self.stdout.write("\n🎉 Punch status fix completed.\n")
