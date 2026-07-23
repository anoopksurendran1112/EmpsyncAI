from company.models import Company
from user.models import CustomUser
from .models import Leave, LeaveFlowHierarchy

def get_flow_config(company):
    try:
        return company.leave_hierarchy.flow_config or []
    except LeaveFlowHierarchy.DoesNotExist:
        return []

def resolve_first_approver(leave, flow_config):
    """Skip levels where the approver IS the applicant."""
    level = 0
    while level < len(flow_config) and flow_config[level] == leave.user_id:
        level += 1
    if level >= len(flow_config):
        return None, level
    return flow_config[level], level