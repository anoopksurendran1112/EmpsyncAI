from datetime import timedelta, date
from django.utils import timezone
from company.models import Company, CompanyUser, Device
from user.models import CustomUser
from punch.models import PunchRecords
from collections import defaultdict


def recalculate_avg_hours(user, company, today=None, device_ids=None):
    """
    Recalculate weekly and monthly avg working hours for a single user.
    Overwrites saved values daily.
    """
    today = today or timezone.now().date()
    punch_mode = company.punch_mode or "M"
    expected_hours = company.daily_working_hours or 8

    # Fetch device_ids once if not provided
    if device_ids is None:
        device_ids = list(Device.objects.using("default").filter(company=company).values_list("device_id", flat=True))

    # ---- Intervals ----
    start_week = today - timedelta(days=today.weekday())
    end_week = start_week + timedelta(days=6)
    
    start_month = today.replace(day=1)
    end_month = today

    # Find the absolute minimum start date to fetch all required records in ONE query
    earliest_date = min(start_week, start_month)
    latest_date = max(end_week, end_month)

    # 1. Fetch all punches for this user in the required date range at once
    all_punches = list(PunchRecords.objects.using('secondary').filter(
        user_id=user.biometric_id,
        punch_time__date__gte=earliest_date,
        punch_time__date__lte=latest_date,
        device_id__in=device_ids,
    ).order_by("punch_time"))

    # Group punches by date in Python (Memory operation, very fast)
    punches_by_date = defaultdict(lambda: {'in': [], 'out': []})
    for p in all_punches:
        p_date = p.punch_time.date()
        if p.status == "Check-In":
            punches_by_date[p_date]['in'].append(p)
        elif p.status == "Check-Out":
            punches_by_date[p_date]['out'].append(p)

    def calculate_duration_for_day(p_date):
        check_ins = punches_by_date[p_date]['in']
        check_outs = punches_by_date[p_date]['out']
        
        if not check_ins or not check_outs:
            return None  # Returns None if absent or missed a punch

        if punch_mode == "M":  # Multi IN/OUT mode
            total_duration = 0
            out_idx = 0
            for in_punch in check_ins:
                # Find the next out punch that happened after this in punch
                while out_idx < len(check_outs) and check_outs[out_idx].punch_time <= in_punch.punch_time:
                    out_idx += 1
                
                if out_idx < len(check_outs):
                    out_time = check_outs[out_idx].punch_time
                    total_duration += (out_time - in_punch.punch_time).total_seconds() / 3600
                    out_idx += 1 # Move to the next out punch for the next in punch
            return total_duration
            
        else:  # Single IN/OUT mode
            first_in = min(check_ins, key=lambda x: x.punch_time).punch_time
            last_out = max(check_outs, key=lambda x: x.punch_time).punch_time
            return (last_out - first_in).total_seconds() / 3600


    def get_average_for_range(start_d, end_d):
        daily_hours = []
        current = start_d
        
        # Calculate up to 'today' or the end of the interval, whichever is earlier
        # This prevents dividing by future days in the current week/month where hours are naturally 0
        calc_end_date = min(end_d, today) 
        
        while current <= calc_end_date:
            duration = calculate_duration_for_day(current)
            if duration is not None:
                daily_hours.append(duration)
            current += timedelta(days=1)
            
        return round(sum(daily_hours) / len(daily_hours), 2) if daily_hours else 0


    # --- Calculate and update ---
    weekly_avg = get_average_for_range(start_week, end_week)
    monthly_avg = get_average_for_range(start_month, end_month)

    user.weekly_avg_working_hour = weekly_avg
    user.monthly_avg_working_hour = monthly_avg

    # Percentage calculation
    if company.work_summary_interval == "W":
        user.avg_working_percentage = round((weekly_avg / expected_hours) * 100, 2)
    else:
        user.avg_working_percentage = round((monthly_avg / expected_hours) * 100, 2)

    user.last_avg_calculated_date = today
    user.save()


def recalculate_all_users(today=None):
    """
    Loop through all companies and users and recalc averages.
    Call this daily (cron or Celery).
    """
    today = today or timezone.now().date()
    for company in Company.objects.all():
        # Fetch device IDs ONCE per company instead of per user
        device_ids = list(Device.objects.using("default").filter(company=company).values_list("device_id", flat=True))
        
        users = CustomUser.objects.filter(company=company).distinct()
        for user in users:
            recalculate_avg_hours(user, company, today, device_ids)
