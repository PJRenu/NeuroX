# models/treatment.py
import numpy as np
from copy import deepcopy

# Define available treatments and their effects
TREATMENTS = {
    'medication_a': {
        'name': 'Cholinesterase Inhibitors',
        'description': 'Helps manage cognitive symptoms by increasing acetylcholine levels',
        'efficacy': {
            'hippocampus': 0.15,  # Slows decline by 15%
            'entorhinal_cortex': 0.10,
            'prefrontal_cortex': 0.05
        },
        'side_effects': 0.2,  # 20% chance of side effects
        'cost': 2  # Relative cost factor
    },
    'medication_b': {
        'name': 'NMDA Receptor Antagonists',
        'description': 'Regulates glutamate activity to slow neurodegeneration',
        'efficacy': {
            'hippocampus': 0.10,
            'entorhinal_cortex': 0.15,
            'prefrontal_cortex': 0.10
        },
        'side_effects': 0.15,
        'cost': 3
    },
    'cognitive_training': {
        'name': 'Cognitive Training',
        'description': 'Structured exercises to maintain and improve cognitive function',
        'efficacy': {
            'hippocampus': 0.05,
            'entorhinal_cortex': 0.05,
            'prefrontal_cortex': 0.20
        },
        'side_effects': 0.0,
        'cost': 1
    },
    'lifestyle_changes': {
        'name': 'Lifestyle Modifications',
        'description': 'Exercise, diet, and stress management to support brain health',
        'efficacy': {
            'hippocampus': 0.08,
            'entorhinal_cortex': 0.08,
            'prefrontal_cortex': 0.08
        },
        'side_effects': 0.0,
        'cost': 1
    }
}

def optimize_treatment(scenario_a, scenario_b, factors):
    """
    Find optimal treatment plan effective for both progression scenarios
    
    Args:
        scenario_a (dict): Typical progression scenario
        scenario_b (dict): Accelerated progression scenario
        factors (dict): Patient factors (age, genetic_markers, etc.)
    
    Returns:
        dict: Optimal treatment plan with effects on both scenarios
    """
    # Consider patient factors
    age = factors['age']
    
    # Age-based treatment modifications
    age_factor = min(1.0, max(0.6, (100 - age) / 60))  # Treatments less effective with age
    
    # Copy scenarios to simulate treatment effects
    baseline_a = deepcopy(scenario_a)
    baseline_b = deepcopy(scenario_b)
    
    # Best treatment combination
    best_combo = None
    best_score = -float('inf')
    
    # Try different treatment combinations (could be optimized with more sophisticated algorithms)
    treatment_options = list(TREATMENTS.keys())
    
    # Start with single treatments for simplicity
    for treatment_id in treatment_options:
        treatment = TREATMENTS[treatment_id]
        
        # Apply treatment to both scenarios
        treated_a = apply_treatment(deepcopy(baseline_a), treatment, age_factor)
        treated_b = apply_treatment(deepcopy(baseline_b), treatment, age_factor)
        
        # Calculate robustness score (improvement in both scenarios)
        score_a = calculate_improvement(baseline_a, treated_a)
        score_b = calculate_improvement(baseline_b, treated_b)
        
        # Combined score (weighted toward worst-case scenario)
        combined_score = 0.4 * score_a + 0.6 * score_b - treatment['side_effects'] * 2 - treatment['cost'] * 0.5
        
        if combined_score > best_score:
            best_score = combined_score
            best_combo = [treatment_id]
    
    # Try combinations of two treatments
    for i, t1 in enumerate(treatment_options):
        for t2 in treatment_options[i+1:]:
            # Skip incompatible treatments (could add logic for this)
            if t1 == t2:
                continue
                
            # Combine treatments
            combined_treatment = {
                'efficacy': {
                    region: TREATMENTS[t1]['efficacy'][region] + TREATMENTS[t2]['efficacy'][region] * 0.8
                    for region in TREATMENTS[t1]['efficacy']
                },
                'side_effects': TREATMENTS[t1]['side_effects'] + TREATMENTS[t2]['side_effects'] * 1.2,
                'cost': TREATMENTS[t1]['cost'] + TREATMENTS[t2]['cost']
            }
            
            # Apply combined treatment to both scenarios
            treated_a = apply_treatment(deepcopy(baseline_a), combined_treatment, age_factor)
            treated_b = apply_treatment(deepcopy(baseline_b), combined_treatment, age_factor)
            
            # Calculate improvements
            score_a = calculate_improvement(baseline_a, treated_a)
            score_b = calculate_improvement(baseline_b, treated_b)
            
            # Combined score
            combined_score = 0.4 * score_a + 0.6 * score_b - combined_treatment['side_effects'] * 2 - combined_treatment['cost'] * 0.5
            
            if combined_score > best_score:
                best_score = combined_score
                best_combo = [t1, t2]
    
    # Create detailed treatment plan
    treatment_plan = {
        'treatments': [{'id': t_id, **TREATMENTS[t_id]} for t_id in best_combo],
        'description': "Optimized treatment plan effective across both progression scenarios",
        'effects': {
            'scenario_a': simulate_treatment_effects(baseline_a, best_combo, age_factor),
            'scenario_b': simulate_treatment_effects(baseline_b, best_combo, age_factor)
        },
        'confidence': min(0.95, max(0.6, best_score / 10)),
        'reasoning': generate_reasoning(best_combo, score_a, score_b)
    }
    
    return treatment_plan

def apply_treatment(scenario, treatment, age_factor):
    """Apply treatment effects to a scenario"""
    result = deepcopy(scenario)
    
    # Apply treatment effects to each region's progression
    for region, progression in result['regions'].items():
        if region in treatment['efficacy']:
            effect = treatment['efficacy'][region] * age_factor
            
            # Modify progression (slow down deterioration)
            for i in range(1, len(progression)):
                # Calculate improvement (smaller decline)
                decline = progression[i-1] - progression[i]
                reduced_decline = decline * (1 - effect)
                
                # Apply reduced decline
                progression[i] = max(progression[i-1] - reduced_decline, progression[i])
    
    # Recalculate cognitive function
    region_weights = {'hippocampus': 0.4, 'entorhinal_cortex': 0.3, 'prefrontal_cortex': 0.3}
    
    for t_idx in range(len(result['cognitive_function'])):
        # Weighted average of region values
        result['cognitive_function'][t_idx] = sum(
            result['regions'][r][t_idx] * region_weights[r] 
            for r in region_weights
        )
    
    return result

def calculate_improvement(baseline, treated):
    """Calculate overall improvement from treatment"""
    # Measure improvement in cognitive function over time
    baseline_end = baseline['cognitive_function'][-1]
    treated_end = treated['cognitive_function'][-1]
    
    # Score is based on final improvement and slower deterioration
    return (treated_end - baseline_end) * 10

def simulate_treatment_effects(baseline, treatment_ids, age_factor):
    """Simulate effects of treatments on progression"""
    # Start with a copy of the baseline
    result = deepcopy(baseline)
    
    # Apply each treatment
    for t_id in treatment_ids:
        treatment = TREATMENTS[t_id]
        result = apply_treatment(result, treatment, age_factor)
    
    return {
        'cognitive_function': result['cognitive_function'],
        'improvement': [
            round((result['cognitive_function'][i] - baseline['cognitive_function'][i]) * 100, 1)
            for i in range(len(result['cognitive_function']))
        ]
    }

def generate_reasoning(treatment_ids, score_a, score_b):
    """Generate clinical reasoning for treatment plan"""
    reasoning = []
    
    if len(treatment_ids) == 1:
        t = TREATMENTS[treatment_ids[0]]
        reasoning.append(f"{t['name']} was selected as the optimal treatment because it provides balanced protection across key brain regions.")
    else:
        reasoning.append("This combination therapy was selected because it provides complementary protection mechanisms:")
        for t_id in treatment_ids:
            t = TREATMENTS[t_id]
            key_region = max(t['efficacy'].items(), key=lambda x: x[1])[0].replace('_', ' ').title()
            reasoning.append(f"- {t['name']}: Particularly effective for the {key_region}.")
    
    reasoning.append(f"This treatment approach is robust across both progression scenarios, with particularly strong benefits in the accelerated scenario.")
    
    if 'lifestyle_changes' in treatment_ids:
        reasoning.append("The inclusion of lifestyle modifications provides additive benefits with minimal side effects.")
    
    return reasoning