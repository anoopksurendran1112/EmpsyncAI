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
    """
    from django.db.models import Q, Sum
    from django.utils import timezone
    from .models import Leave, LeaveType, LeavePolicy, LeaveCredit

    now = timezone.now()
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

        # Compute net available balance
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