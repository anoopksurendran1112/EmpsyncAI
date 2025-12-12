from datetime import timedelta
import copy

def deduplicate_punches(punches, threshold_seconds=60):
    """
    Deduplicates a list (or QuerySet) of punch objects using 'Cluster & Sequence Match' logic.
    
    Args:
        punches: A list or QuerySet of PunchRecords objects.
        threshold_seconds: Time window to group punches (default 60s).
        
    Returns:
        list: A filtered list of PunchRecords objects with duplicates removed.
    """
    if not punches:
        return []
        
    # 1. STRICT SORTING: Enforce chronological order (Ascending)
    # This is critical. If input is descending, clustering logic fails.
    sorted_punches = sorted(list(punches), key=lambda p: p.punch_time)
    
    valid_punches = []
    
    # Initial expected state: Day starts with Check-In
    expected_state = 'Check-In' 
    
    # Start first cluster
    current_cluster = [sorted_punches[0]]
    cluster_start_time = sorted_punches[0].punch_time
    
    for i in range(1, len(sorted_punches)):
        punch = sorted_punches[i]
        
        # Check time difference
        time_diff = (punch.punch_time - cluster_start_time).total_seconds()
        
        # Check Day Change (Reset logic)
        same_day = punch.punch_time.date() == cluster_start_time.date()
        
        if time_diff <= threshold_seconds and same_day:
            current_cluster.append(punch)
        else:
            # --- Process Previous Cluster ---
            best_punch, next_state = _process_cluster_and_get_state(current_cluster, expected_state)
            valid_punches.append(best_punch)
            expected_state = next_state
            
            # --- DAY RESET CHECK ---
            # If we crossed a day boundary, reset expected state to Check-In.
            # This handles cases where the previous day ended with a Partial Punch (missing Check-Out).
            # Without this, the next day would start expecting 'Check-Out', flipping all statuses.
            if not same_day:
                expected_state = 'Check-In'
                
            # --- Start New Cluster ---
            current_cluster = [punch]
            cluster_start_time = punch.punch_time
            
    # --- Process Final Cluster ---
    if current_cluster:
        best_punch, next_state = _process_cluster_and_get_state(current_cluster, expected_state)
        valid_punches.append(best_punch)
        
    return valid_punches

def _process_cluster_and_get_state(cluster, expected_state):
    """
    Selects the best punch and determines the next expected state.
    Implements 'Force Status' logic.
    """
    best_punch = None
    
    # 1. Try to find match for expected state
    match = next((p for p in cluster if p.status == expected_state), None)
    
    if match:
        best_punch = match
    else:
        # 2. Fallback: Use the first punch, but FORCE the status to match expectation
        # This handles "Evening Single Punch" where user punches 'In' (raw) but it should be 'Out'
        best_punch = copy.copy(cluster[0]) # Don't mutate original DB instance
        best_punch.status = expected_state
    
    # Determine next state based on the DECISION we just made
    if best_punch.status == 'Check-In':
        return best_punch, 'Check-Out'
    else:
        return best_punch, 'Check-In'
