from datetime import date

def process_single_day(current_day, punches, multi_mode, today):
    filtered_punches_for_day = []

    if multi_mode:
        if punches:
            sorted_punches = sorted(punches, key=lambda x: x.punch_time)

            for idx, punch in enumerate(sorted_punches):
                punch_obj = {
                    "id": punch.id,
                    "date": punch.punch_time.date(),
                    "punch_time": punch.punch_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "raw_status": punch.status,   # original from device (may be None)
                }
                # Alternate pairing
                if idx % 2 == 0:
                    punch_obj["status"] = "Check-In"
                else:
                    punch_obj["status"] = "Check-Out"

                filtered_punches_for_day.append(punch_obj)

            # If odd punches, last punch has no pair ?? pending
            if len(sorted_punches) % 2 != 0:
                filtered_punches_for_day[-1]["status"] = "pending"
                filtered_punches_for_day[-1]["message"] = "Partial punch recorded"
        else:
            filtered_punches_for_day.append({
                'date': current_day,
                'message': 'No punches recorded',
                'status': 'pending' if current_day == today else 'leave'
            })
    else:
        check_ins = [p for p in punches if p.status == 'Check-In']
        check_outs = [p for p in punches if p.status == 'Check-Out']
        first_check_in = check_ins[0] if check_ins else None
        latest_check_out = check_outs[-1] if check_outs else None

        if not punches:
            filtered_punches_for_day.append({
                'date': current_day,
                'message': 'No punches recorded',
                'status': 'pending' if current_day == today else 'leave'
            })
        elif not first_check_in and not latest_check_out:
            filtered_punches_for_day.append({
                'date': current_day,
                'message': 'Day ongoing, no punches yet' if current_day == today else 'No punches recorded',
                'status': 'pending' if current_day == today else 'leave'
            })
        elif (first_check_in and not latest_check_out) or (latest_check_out and not first_check_in):
            partial = first_check_in or latest_check_out
            filtered_punches_for_day.append({
                'date': current_day,
                'punch_time': partial.punch_time.strftime('%H:%M:%S'),
                'message': 'Partial punch recorded',
                'status': 'pending' if current_day == today else 'absent'
            })
        else:
            filtered_punches_for_day.append(first_check_in)
            if latest_check_out != first_check_in:
                filtered_punches_for_day.append(latest_check_out)
    
    return filtered_punches_for_day
