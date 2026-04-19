from datetime import datetime
from punch.utils.deduplication import deduplicate_punches

def process_punch_logic(records, punch_mode):
    """
    Deduplicates punches, groups them into check-ins and check-outs, and calculates work duration.
    
    :param records: List of punch record objects for a single day.
    :param punch_mode: 'M' for Multi-mode, 'S' for Single-mode.
    :return: Dictionary containing check_ins, check_outs lists and total work_duration in hours.
    """
    # 1. Deduplicate raw punches (removes accidental multi-taps within 60s window)
    records = deduplicate_punches(records)
    
    check_ins = [p for p in records if p.status == "Check-In"]
    check_outs = [p for p in records if p.status == "Check-Out"]
    work_duration = 0

    if punch_mode == 'M':
        # Sort to ensure correct pairing
        check_ins.sort(key=lambda x: x.punch_time)
        check_outs.sort(key=lambda x: x.punch_time)

        in_index = 0
        check_outs_copy = list(check_outs)
        while in_index < len(check_ins):
            in_time = check_ins[in_index].punch_time
            # Find the first check-out that occurs after this check-in
            out = next((o for o in check_outs_copy if o.punch_time > in_time), None)
            if out:
                duration = (out.punch_time - in_time).total_seconds() / 3600
                work_duration += duration
                check_outs_copy.remove(out)
            in_index += 1
    else:
        # Single punch mode: Difference between earliest check-in and latest check-out
        if check_ins and check_outs:
            duration = (
                max(check_outs, key=lambda x: x.punch_time).punch_time -
                min(check_ins, key=lambda x: x.punch_time).punch_time
            ).total_seconds() / 3600
            work_duration = duration

    return {
        "check_ins": check_ins,
        "check_outs": check_outs,
        "work_duration": work_duration
    }
