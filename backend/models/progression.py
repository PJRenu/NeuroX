# models/progression.py
import numpy as np
from datetime import datetime, timedelta

# Define key brain regions with (x, y, z) coordinates for 3D model
BRAIN_REGIONS = {
    'hippocampus': {'left': {'coords': [35, 45, 30], 'size': 5}, 'right': {'coords': [65, 45, 30], 'size': 5}},
    'entorhinal_cortex': {'left': {'coords': [32, 50, 25], 'size': 3}, 'right': {'coords': [68, 50, 25], 'size': 3}},
    'prefrontal_cortex': {'left': {'coords': [35, 65, 40], 'size': 8}, 'right': {'coords': [65, 65, 40], 'size': 8}}
}

def calculate_progression_scenarios(factors, affected_regions):
    """
    Calculate two progression scenarios based on patient factors
    
    Args:
        factors (dict): Dict with age, genetic_markers, etc.
        affected_regions (dict): Currently affected regions from scan
        
    Returns:
        tuple: (scenario_a, scenario_b) where each scenario contains progression timeline
    """
    # Extract factors
    age = factors['age']
    genetic_risk = factors['genetic_markers']
    brain_metrics = factors['brain_metrics']
    biomarkers = factors['biomarkers']
    cognitive = factors['cognitive_scores']
    
    # Generate timepoints (years)
    timepoints = list(range(0, 16, 1))  # 0 to 15 years
    dates = [(datetime.now() + timedelta(days=365*t)).strftime('%Y-%m') for t in timepoints]
    
    # Calculate risk score (0-1)
    base_risk = (0.3 * genetic_risk + 0.2 * biomarkers + 0.1 * (age/100) + 
                0.2 * (1 - brain_metrics/100) + 0.2 * (1 - cognitive/100))
    
    # Scenario A: Typical progression
    scenario_a = {
        'name': 'Typical Progression',
        'description': 'Most likely progression based on current factors',
        'timepoints': dates,
        'regions': {}
    }
    
    # Scenario B: Accelerated/Variant progression
    scenario_b = {
        'name': 'Accelerated Progression',
        'description': 'More aggressive progression scenario',
        'timepoints': dates,
        'regions': {}
    }
    
    # Calculate degeneration for each region over time
    for region, location in BRAIN_REGIONS.items():
        # Different rates for the two scenarios
        base_rate_a = base_risk * 0.07  # 7% annual decline at maximum risk
        base_rate_b = base_risk * 0.12  # 12% annual decline in accelerated scenario
        
        # Region-specific modifiers
        if region == 'hippocampus':
            modifier_a, modifier_b = 1.2, 1.5
        elif region == 'entorhinal_cortex':
            modifier_a, modifier_b = 1.0, 1.3
        else:  # prefrontal_cortex
            modifier_a, modifier_b = 0.8, 1.1
        
        # Calculate progression
        progression_a = []
        progression_b = []
        
        # Start with current state (from scan analysis)
        current_value = 1.0
        if region in affected_regions:
            current_value = max(0.4, 1.0 - affected_regions[region] * 0.6)
        
        value_a = current_value
        value_b = current_value
        
        for _ in timepoints:
            progression_a.append(round(value_a, 2))
            progression_b.append(round(value_b, 2))
            
            # Apply decline rates
            value_a = max(0.1, value_a - (base_rate_a * modifier_a))
            value_b = max(0.1, value_b - (base_rate_b * modifier_b))
        
        scenario_a['regions'][region] = progression_a
        scenario_b['regions'][region] = progression_b
    
    # Calculate overall cognitive function
    region_weights = {'hippocampus': 0.4, 'entorhinal_cortex': 0.3, 'prefrontal_cortex': 0.3}
    
    scenario_a['cognitive_function'] = []
    scenario_b['cognitive_function'] = []
    
    for t_idx in range(len(timepoints)):
        # Weighted average of region values
        cog_a = sum(scenario_a['regions'][r][t_idx] * region_weights[r] for r in BRAIN_REGIONS)
        cog_b = sum(scenario_b['regions'][r][t_idx] * region_weights[r] for r in BRAIN_REGIONS)
        
        scenario_a['cognitive_function'].append(round(cog_a, 2))
        scenario_b['cognitive_function'].append(round(cog_b, 2))
    
    return scenario_a, scenario_b