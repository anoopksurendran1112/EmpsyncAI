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
    criteria = step.get('criteria')
    managed_by = step.get('managed_by')

    applicant = leave.user
    company = leave.company

    if criteria == 'field':
        if managed_by == 'team_lead':
            candidate = CustomUser.objects.filter(
                team_lead=True,
                company=company,
                group=applicant.group,
            ).exclude(id=applicant.id).first()
            return candidate.id if candidate else None

        elif managed_by == 'company_head':
            candidate = CustomUser.objects.filter(
                company_head=True,
                company=company,
            ).exclude(id=applicant.id).first()
            print("Company:", company.id)
            print("Candidate:", candidate)
            return candidate.id if candidate else None
        

        return None

    elif criteria == 'role':
        # NOTE: defaults to "first user holding this role" when there
        # are multiple holders — flag if a different rule is needed.
        candidate = CustomUser.objects.filter(
            role_id=managed_by,
            company=company,
        ).exclude(id=applicant.id).first()
        return candidate.id if candidate else None
    
    elif criteria == 'user':
        try:
            user_id = int(managed_by)
        except (TypeError, ValueError):
            return None
        if user_id == applicant.id:
            return None
        candidate = CustomUser.objects.filter(id=user_id, company=company).first()
        return candidate.id if candidate else None

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