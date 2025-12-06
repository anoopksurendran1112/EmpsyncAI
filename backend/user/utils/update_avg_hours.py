from datetime import timedelta, date
from django.utils import timezone
from company.models import Company,CompanyUser, Device
from user.models import CustomUser
from punch.models import PunchRecords


def recalculate_avg_hours(user, company,today=None):
    """
    Recalculate weekly and monthly avg working hours for a single user.
    Overwrites saved values daily.
    """
    today = today or timezone.now().date()
    punch_mode = company.punch_mode or "M"   # Multi or Single punch mode
    expected_hours = company.daily_working_hours or 8

    # ---- WEEKLY interval ----
    start_week = today - timedelta(days=today.weekday())  # Monday
    end_week = start_week + timedelta(days=6)

    # ---- MONTHLY interval ----
    start_month = today.replace(day=1)
    end_month = today

    def calc_avg(start_date, end_date):

        device_ids = list(
        Device.objects.using("default")
        .filter(company=company)
        .values_list("device_id", flat=True)
    )
        punches = PunchRecords.objects.using('secondary').filter(
            user_id=user.biometric_id,
            punch_time__date__gte=start_date,
            punch_time__date__lte=end_date,
            device_id__in=device_ids,
        ).order_by("punch_time")

        daily_hours = []
        current_date = start_date
        while current_date <= end_date:
            day_punches = punches.filter(punch_time__date=current_date)
            check_ins = [p for p in day_punches if p.status == "Check-In"]
            check_outs = [p for p in day_punches if p.status == "Check-Out"]

            if check_ins and check_outs:
                if punch_mode == "M":  # Multi IN/OUT mode
                    total_daily_duration = 0
                    check_in_index = 0
                    while check_in_index < len(check_ins):
                        in_time = check_ins[check_in_index].punch_time
                        next_out_index = next(
                            (i for i, out in enumerate(check_outs) if out.punch_time > in_time),
                            None
                        )
                        if next_out_index is not None:
                            out_time = check_outs[next_out_index].punch_time
                            total_daily_duration += (out_time - in_time).total_seconds() / 3600
                            check_outs.pop(next_out_index)  # remove used out
                        check_in_index += 1
                    daily_hours.append(total_daily_duration)
                else:  # Single IN/OUT
                    duration = (
                        max(check_outs, key=lambda x: x.punch_time).punch_time -
                        min(check_ins, key=lambda x: x.punch_time).punch_time
                    ).total_seconds() / 3600
                    daily_hours.append(duration)

            current_date += timedelta(days=1)

        return round(sum(daily_hours) / len(daily_hours), 2) if daily_hours else 0

    # --- Calculate and update ---
    weekly_avg = calc_avg(start_week, end_week)
    monthly_avg = calc_avg(start_month, end_month)

    user.weekly_avg_working_hour = weekly_avg
    user.monthly_avg_working_hour = monthly_avg

    # Percentage calculation based on company setting
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
        users = CustomUser.objects.filter(company=company).distinct()
        for user in users:
            recalculate_avg_hours(user, company, today)
