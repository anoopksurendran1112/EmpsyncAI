from company.models import Company
from user.models import CustomUser
from .models import Leave, LeaveFlowHierarchy


def get_flow_config(company):
    try:
        return company.leave_hierarchy.flow_config or []
    except LeaveFlowHierarchy.DoesNotExist:
        return []


def _resolve_step_user_id(leave, step):
    """
    Resolve a single flow_config step dict to a concrete CustomUser id.
    Returns None if it can't be resolved, or if it resolves to the
    applicant themself (a person can't approve their own leave).
    """
    if not isinstance(step, dict):
        return None

    criteria = str(step.get('criteria', '')).lower().strip()
    managed_by = step.get('managed_by')

    if managed_by is None:
        return None

    applicant = leave.user
    company = leave.company
    mb_str = str(managed_by).strip().lower()

    # 1. Special field keywords (team_lead, company_head)
    if mb_str == 'team_lead':
        candidate = CustomUser.objects.filter(
            team_lead=True,
            company=company,
            group=applicant.group,
        ).exclude(id=applicant.id).first()
        return candidate.id if candidate else None

    elif mb_str == 'company_head':
        candidate = CustomUser.objects.filter(
            company_head=True,
            company=company,
        ).exclude(id=applicant.id).first()
        return candidate.id if candidate else None

    # 2. Role criteria (role ID or role name)
    if criteria == 'role':
        if str(managed_by).isdigit():
            candidate = CustomUser.objects.filter(
                role_id=int(managed_by),
                company=company,
            ).exclude(id=applicant.id).first()
        else:
            candidate = CustomUser.objects.filter(
                role__role__iexact=str(managed_by).strip(),
                company=company,
            ).exclude(id=applicant.id).first()
        return candidate.id if candidate else None

    # 3. User criteria (numeric User ID or direct user reference)
    elif criteria == 'user':
        try:
            user_id = int(managed_by)
        except (TypeError, ValueError):
            return None
        if user_id == applicant.id:
            return None
        candidate = CustomUser.objects.filter(id=user_id, company=company).exclude(id=applicant.id).first()
        return candidate.id if candidate else None

    # 4. Field criteria fallback
    elif criteria == 'field':
        return None

    return None


def resolve_approver_from_level(leave, flow_config, start_index):
    """
    Walk forward through flow_config starting at start_index, resolving
    each step to an actual user. Levels that can't be resolved (no team
    lead set, role has no holder) or resolve to the applicant themself
    are skipped automatically — same intent as the old "skip levels
    where the approver IS the applicant" comment, just applied per-step
    and aware of the dict-based flow_config shape.

    Returns (approver_id, level_index).
    approver_id is None when every remaining level was skipped/unresolved
    — callers should treat this as "auto-approve, nothing left to do".
    """
    level = start_index
    while level < len(flow_config):
        approver_id = _resolve_step_user_id(leave, flow_config[level])
        if approver_id is not None:
            return approver_id, level
        level += 1
    return None, level


def resolve_first_approver(leave, flow_config):
    """Skip levels where the approver IS the applicant (or unresolvable)."""
    return resolve_approver_from_level(leave, flow_config, 0)


def get_user_leave_balance(user, company=None, year=None, month=None):
    """
    Calculate available leave balance for a given user.
    Cross checks leaves taken from the Leave model against limits defined in
    LeaveType and LeavePolicy (factoring in user's staff_category from EmployeeProfile).

    If an ImportedLeaveBalance snapshot exists for a leave type in this year
    (and has not expired), the available_balance is derived as:
        opening_balance − days_taken(from_date > snapshot_date, status A|P)
    A snapshot is ignored once today > its expiry_date (falling back to the
    computed logic), but the row itself is never deleted.
    Otherwise the original computed logic applies.
    """
    from django.db.models import Q, Sum
    from django.utils import timezone
    from .models import Leave, LeaveType, LeavePolicy, LeaveCredit, ImportedLeaveBalance

    now = timezone.now()
    today = now.date()
    year = int(year) if year else now.year
    month = int(month) if month else now.month

    if not company:
        company = getattr(user, 'parent_company', None) or user.company.first()

    # Retrieve staff category from user's EmployeeProfile
    profile = getattr(user, 'profile', None)
    staff_category = getattr(profile, 'staff_category', None) if profile else None

    # Fetch active leave types applicable for the company
    leave_types = LeaveType.objects.filter(is_active=True).filter(
        Q(company=company) | Q(is_global=True)
    )

    # Pre-fetch all non-expired imported balances for this user+company+year in
    # one query. Expired snapshots are skipped so the computed logic takes over.
    imported_qs = ImportedLeaveBalance.objects.filter(
        user=user, company=company, year=year
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
    ).select_related('leave_type')
    imported_map = {ib.leave_type_id: ib for ib in imported_qs}

    balances = []

    for lt in leave_types:
        # Default limits from LeaveType
        monthly_limit = lt.monthly_limit
        yearly_limit = lt.yearly_limit
        use_credit = lt.use_credit
        initial_credit = lt.initial_credit
        policy_applied = None

        # Check for staff_category policy override if available
        if company and staff_category and lt.policy_mode == 'staff_category':
            policy = LeavePolicy.objects.filter(
                company=company,
                leave_type=lt,
                staff_category=staff_category,
                is_active=True
            ).first()
            if policy:
                monthly_limit = policy.monthly_limit
                yearly_limit = policy.yearly_limit
                use_credit = policy.use_credit
                initial_credit = policy.initial_credit
                policy_applied = policy.id

        # Calculate leaves taken (Approved 'A' and Pending 'P')
        base_leaves_qs = Leave.objects.filter(
            user=user,
            leave_type=lt,
            status__in=['A', 'P']
        )
        if company:
            base_leaves_qs = base_leaves_qs.filter(company=company)

        # Monthly taken
        monthly_taken_qs = base_leaves_qs.filter(from_date__year=year, from_date__month=month)
        approved_monthly_taken = monthly_taken_qs.filter(status='A').aggregate(total=Sum('days_taken'))['total'] or 0.0
        pending_monthly_taken = monthly_taken_qs.filter(status='P').aggregate(total=Sum('days_taken'))['total'] or 0.0
        total_monthly_taken = float(approved_monthly_taken + pending_monthly_taken)

        # Yearly taken
        yearly_taken_qs = base_leaves_qs.filter(from_date__year=year)
        approved_yearly_taken = yearly_taken_qs.filter(status='A').aggregate(total=Sum('days_taken'))['total'] or 0.0
        pending_yearly_taken = yearly_taken_qs.filter(status='P').aggregate(total=Sum('days_taken'))['total'] or 0.0
        total_yearly_taken = float(approved_yearly_taken + pending_yearly_taken)

        # Remaining calculations
        monthly_remaining = (monthly_limit - total_monthly_taken) if monthly_limit is not None else None
        yearly_remaining = (yearly_limit - total_yearly_taken) if yearly_limit is not None else None

        # Credit balance calculation (if credit system is used)
        credit_balance = None
        if use_credit:
            credit_obj = LeaveCredit.objects.filter(user=user, leave_type=lt, year=year).first()
            if credit_obj:
                credit_balance = float(credit_obj.credits)
            else:
                credit_balance = max(0.0, float(initial_credit or 0) - total_yearly_taken)

        # ------------------------------------------------------------------
        # Imported balance override
        # If a snapshot exists for this leave type+year, use it as the
        # opening balance and subtract only leaves taken AFTER snapshot_date.
        # ------------------------------------------------------------------
        imported_snapshot = imported_map.get(lt.id)
        imported_opening = None
        snapshot_date = None
        balance_source = 'computed'

        if imported_snapshot:
            snapshot_date = imported_snapshot.snapshot_date
            imported_opening = imported_snapshot.opening_balance

            # Leaves taken strictly AFTER the snapshot date
            post_snapshot_taken = base_leaves_qs.filter(
                from_date__gt=snapshot_date
            ).aggregate(total=Sum('days_taken'))['total'] or 0.0

            available_balance = max(0.0, float(imported_opening) - float(post_snapshot_taken))
            balance_source = 'imported'
        else:
            # Original computed logic
            if use_credit and credit_balance is not None:
                available_balance = credit_balance
            elif monthly_remaining is not None and yearly_remaining is not None:
                available_balance = max(0.0, min(monthly_remaining, yearly_remaining))
            elif yearly_remaining is not None:
                available_balance = max(0.0, yearly_remaining)
            elif monthly_remaining is not None:
                available_balance = max(0.0, monthly_remaining)
            else:
                available_balance = None  # Unlimited

        balances.append({
            'leave_type_id': lt.id,
            'leave_type': lt.leave_type,
            'short_name': lt.short_name,
            'policy_mode': lt.policy_mode,
            'policy_id': policy_applied,
            'monthly_limit': monthly_limit,
            'yearly_limit': yearly_limit,
            'use_credit': use_credit,
            'initial_credit': initial_credit,
            'monthly_taken': {
                'approved': float(approved_monthly_taken),
                'pending': float(pending_monthly_taken),
                'total': total_monthly_taken
            },
            'yearly_taken': {
                'approved': float(approved_yearly_taken),
                'pending': float(pending_yearly_taken),
                'total': total_yearly_taken
            },
            'monthly_remaining': monthly_remaining,
            'yearly_remaining': yearly_remaining,
            'credit_balance': credit_balance,
            # Imported-balance fields (None if no snapshot exists)
            'imported_opening_balance': imported_opening,
            'snapshot_date': snapshot_date.isoformat() if snapshot_date else None,
            'expiry_date': (
                imported_snapshot.expiry_date.isoformat()
                if imported_snapshot and imported_snapshot.expiry_date
                else None
            ),
            'balance_source': balance_source,   # 'imported' | 'computed'
            'available_balance': available_balance,
        })

    return {
        'user_id': user.id,
        'user_name': f"{user.first_name} {user.last_name}".strip() or user.email,
        'company_id': company.id if company else None,
        'staff_category_id': staff_category.id if staff_category else None,
        'staff_category_name': staff_category.category_name if staff_category else None,
        'year': year,
        'month': month,
        'balances': balances
    }



def get_company_leave_roster(company, year=None, month=None, department_id=None):
    """
    Calculate leave balances and usage for all active employees of a company
    in a bulk, highly optimized manner to populate the admin Leave Roster.
    """
    from django.db.models import Q, Sum
    from django.utils import timezone
    import calendar
    from .models import Leave, LeaveType, LeavePolicy, LeaveCredit, ImportedLeaveBalance
    from company.models import CompanyGroup

    now = timezone.now()
    try:
        year = int(year) if year else now.year
    except (ValueError, TypeError):
        year = now.year

    try:
        month = int(month) if month else now.month
    except (ValueError, TypeError):
        month = now.month

    # 1. Fetch active LeaveTypes for company
    leave_types = list(LeaveType.objects.filter(is_active=True).filter(
        Q(company=company) | Q(is_global=True)
    ).order_by('id'))

    leave_type_ids = [lt.id for lt in leave_types]

    # 2. Fetch all active LeavePolicies for company
    policies = list(LeavePolicy.objects.filter(
        company=company,
        leave_type_id__in=leave_type_ids,
        is_active=True
    ).select_related('staff_category'))

    policy_by_type_category = {
        (p.leave_type_id, p.staff_category_id): p for p in policies
    }
    type_has_category_policies = set(p.leave_type_id for p in policies)

    # 3. Fetch departments (CompanyGroup)
    groups = list(CompanyGroup.objects.filter(company=company).order_by('group'))
    departments = [
        {"id": g.id, "name": g.group or g.short_name or f"Department {g.id}"}
        for g in groups
    ]

    # 4. Fetch all active employees
    employees_qs = CustomUser.objects.filter(
        company=company,
        is_active=True
    ).select_related('profile__staff_category', 'group').order_by('first_name', 'last_name')

    if department_id:
        try:
            dept_id_int = int(department_id)
            employees_qs = employees_qs.filter(group_id=dept_id_int)
        except (ValueError, TypeError):
            pass

    employees = list(employees_qs)
    user_ids = [emp.id for emp in employees]

    # 5. Aggregate leaves taken for this year
    leave_aggregations = Leave.objects.filter(
        company=company,
        user_id__in=user_ids,
        leave_type_id__in=leave_type_ids,
        from_date__year=year,
        status__in=['A', 'P']
    ).values('user_id', 'leave_type_id', 'status', 'from_date__month').annotate(total_days=Sum('days_taken'))

    usage_map = {}
    for item in leave_aggregations:
        key = (item['user_id'], item['leave_type_id'])
        if key not in usage_map:
            usage_map[key] = {
                'yearly_approved': 0.0,
                'yearly_pending': 0.0,
                'monthly_approved': 0.0,
                'monthly_pending': 0.0,
            }
        days = float(item['total_days'] or 0.0)
        status_val = item['status']
        m = item['from_date__month']

        if status_val == 'A':
            usage_map[key]['yearly_approved'] += days
            if m == month:
                usage_map[key]['monthly_approved'] += days
        elif status_val == 'P':
            usage_map[key]['yearly_pending'] += days
            if m == month:
                usage_map[key]['monthly_pending'] += days

    # 6. Fetch credits for users in this company for this year
    credit_records = LeaveCredit.objects.filter(
        user_id__in=user_ids,
        leave_type_id__in=leave_type_ids,
        year=year
    ).values('user_id', 'leave_type_id', 'credits')

    credit_map = {
        (c['user_id'], c['leave_type_id']): float(c['credits'])
        for c in credit_records
    }

    # 6b. Non-expired imported balances for this year (bulk override source).
    today = now.date()
    imported_rows = list(ImportedLeaveBalance.objects.filter(
        company=company,
        year=year,
        user_id__in=user_ids,
        leave_type_id__in=leave_type_ids,
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
    ))
    imported_map = {(ib.user_id, ib.leave_type_id): ib for ib in imported_rows}

    # Usage taken strictly AFTER each snapshot date (this is what reduces the
    # imported opening balance). Snapshot dates are usually uniform per
    # company+year, so one aggregate query covers each distinct date.
    post_snapshot_map = {}
    for snap in sorted({ib.snapshot_date for ib in imported_rows if ib.snapshot_date}):
        snap_agg = Leave.objects.filter(
            company=company,
            user_id__in=user_ids,
            leave_type_id__in=leave_type_ids,
            from_date__gt=snap,
            status__in=['A', 'P'],
        ).values('user_id', 'leave_type_id', 'status', 'from_date__month') \
         .annotate(total_days=Sum('days_taken'))
        for item in snap_agg:
            entry = post_snapshot_map.setdefault(
                (item['user_id'], item['leave_type_id']),
                {'approved': 0.0, 'pending': 0.0,
                 'monthly_approved': 0.0, 'monthly_pending': 0.0},
            )
            days = float(item['total_days'] or 0.0)
            if item['status'] == 'A':
                entry['approved'] += days
                if item['from_date__month'] == month:
                    entry['monthly_approved'] += days
            else:
                entry['pending'] += days
                if item['from_date__month'] == month:
                    entry['monthly_pending'] += days

    # 7. Construct leave types column definitions
    columns = [
        {
            'id': lt.id,
            'name': lt.leave_type,
            'short_code': lt.short_name or lt.leave_type[:4].upper(),
            'policy_mode': lt.policy_mode,
            'monthly_limit': lt.monthly_limit,
            'yearly_limit': lt.yearly_limit,
            'use_credit': lt.use_credit,
        }
        for lt in leave_types
    ]

    # 8. Assemble roster for each employee
    employee_rows = []
    for emp in employees:
        profile = getattr(emp, 'profile', None)
        staff_cat = getattr(profile, 'staff_category', None) if profile else None
        staff_cat_id = staff_cat.id if staff_cat else None
        staff_cat_name = staff_cat.category_name if staff_cat else "Unassigned"

        dept_name = emp.group.group if emp.group and emp.group.group else (
            emp.group.short_name if emp.group and emp.group.short_name else "General"
        )

        leaves_data = {}
        for lt in leave_types:
            code = lt.short_name or str(lt.id)
            key = (emp.id, lt.id)

            # Imported-balance override: the client's snapshot decides everything.
            import_snap = imported_map.get(key)
            if import_snap:
                ps = post_snapshot_map.get(key, {
                    'approved': 0.0, 'pending': 0.0,
                    'monthly_approved': 0.0, 'monthly_pending': 0.0,
                })
                opening = float(import_snap.opening_balance)
                used_since = ps['approved']
                pending_since = ps['pending']
                leaves_data[code] = {
                    'leave_type_id': lt.id,
                    'leave_type_name': lt.leave_type,
                    'short_code': code,
                    'is_eligible': True,
                    'is_unlimited': False,
                    'entitlement': None,
                    'monthly_limit': None,
                    'yearly_limit': None,
                    'used': used_since,
                    'pending': pending_since,
                    'monthly_used': ps['monthly_approved'],
                    'monthly_pending': ps['monthly_pending'],
                    'balance': max(0.0, opening - used_since - pending_since),
                    'credit_balance': None,
                    'is_imported': True,
                    'opening_balance': opening,
                    'snapshot_date': (
                        import_snap.snapshot_date.isoformat()
                        if import_snap.snapshot_date else None
                    ),
                    'expiry_date': (
                        import_snap.expiry_date.isoformat()
                        if import_snap.expiry_date else None
                    ),
                }
                continue

            usage = usage_map.get(key, {
                'yearly_approved': 0.0,
                'yearly_pending': 0.0,
                'monthly_approved': 0.0,
                'monthly_pending': 0.0,
            })

            used_yearly = usage['yearly_approved']
            pending_yearly = usage['yearly_pending']
            used_monthly = usage['monthly_approved']
            pending_monthly = usage['monthly_pending']

            monthly_limit = lt.monthly_limit
            yearly_limit = lt.yearly_limit
            use_credit = lt.use_credit
            initial_credit = lt.initial_credit
            is_eligible = True

            if lt.policy_mode == 'staff_category':
                if staff_cat_id:
                    policy = policy_by_type_category.get((lt.id, staff_cat_id))
                    if policy:
                        monthly_limit = policy.monthly_limit
                        yearly_limit = policy.yearly_limit
                        use_credit = policy.use_credit
                        initial_credit = policy.initial_credit
                        is_eligible = True
                    else:
                        if lt.id in type_has_category_policies:
                            is_eligible = False
                else:
                    if lt.id in type_has_category_policies:
                        is_eligible = False

            if not is_eligible:
                leaves_data[code] = {
                    'leave_type_id': lt.id,
                    'leave_type_name': lt.leave_type,
                    'short_code': code,
                    'is_eligible': False,
                    'is_unlimited': False,
                    'entitlement': None,
                    'monthly_limit': None,
                    'yearly_limit': None,
                    'used': 0.0,
                    'pending': 0.0,
                    'monthly_used': 0.0,
                    'balance': None,
                }
                continue

            is_unlimited = (yearly_limit is None and not use_credit)
            credit_balance = credit_map.get(key)
            if use_credit:
                if credit_balance is None:
                    credit_balance = max(0.0, float(initial_credit or 0) - (used_yearly + pending_yearly))
                balance = credit_balance
                entitlement = initial_credit
            elif is_unlimited:
                balance = None
                entitlement = None
            else:
                entitlement = yearly_limit
                balance = max(0.0, (yearly_limit or 0) - (used_yearly + pending_yearly))

            leaves_data[code] = {
                'leave_type_id': lt.id,
                'leave_type_name': lt.leave_type,
                'short_code': code,
                'is_eligible': True,
                'is_unlimited': is_unlimited,
                'entitlement': entitlement,
                'monthly_limit': monthly_limit,
                'yearly_limit': yearly_limit,
                'used': used_yearly,
                'pending': pending_yearly,
                'monthly_used': used_monthly,
                'monthly_pending': pending_monthly,
                'balance': balance,
                'credit_balance': credit_balance if use_credit else None,
            }

        full_name = f"{emp.first_name} {emp.last_name}".strip() or emp.email
        employee_rows.append({
            'id': emp.id,
            'name': full_name,
            'email': emp.email,
            'department': dept_name,
            'department_id': emp.group_id,
            'category': staff_cat_name,
            'category_id': staff_cat_id,
            'staff_id': getattr(profile, 'staff_id', '') if profile else '',
            'leaves': leaves_data
        })

    month_name = calendar.month_name[month]
    period_str = f"{month_name} {year}"

    company_name = getattr(company, 'company_name', getattr(company, 'name', ''))

    return {
        'company_id': company.id,
        'company_name': company_name,
        'year': year,
        'month': month,
        'period': period_str,
        'departments': departments,
        'leave_types': columns,
        'employees': employee_rows
    }