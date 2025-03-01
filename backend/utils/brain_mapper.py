# utils/brain_mapper.py
def map_affected_regions(affected_regions):
    """
    Map affected brain regions to 3D coordinates for visualization
    
    Args:
        affected_regions (dict): Dictionary of affected regions with severity
        
    Returns:
        list: List of affected region objects with 3D coordinates and metadata
    """
    # Define baseline 3D coordinates for important brain regions
    region_coords = {
        'hippocampus': {
            'left': {'x': 35, 'y': 45, 'z': 30, 'size': 5},
            'right': {'x': 65, 'y': 45, 'z': 30, 'size': 5}
        },
        'entorhinal_cortex': {
            'left': {'x': 32, 'y': 50, 'z': 25, 'size': 3},
            'right': {'x': 68, 'y': 50, 'z': 25, 'size': 3}
        },
        'prefrontal_cortex': {
            'left': {'x': 35, 'y': 65, 'z': 40, 'size': 8},
            'right': {'x': 65, 'y': 65, 'z': 40, 'size': 8}
        }
    }
    
    # Build affected regions with coordinates
    mapped_regions = []
    
    for region, severity in affected_regions.items():
        if region in region_coords:
            # Add left and right regions
            for side in ['left', 'right']:
                coords = region_coords[region][side]
                mapped_regions.append({
                    'id': f"{region}_{side}",
                    'name': f"{region.replace('_', ' ').title()} ({side.title()})",
                    'x': coords['x'],
                    'y': coords['y'],
                    'z': coords['z'],
                    'size': coords['size'],
                    'severity': severity,
                    'color': get_heatmap_color(severity)
                })
    
    return mapped_regions

def get_heatmap_color(severity):
    """Generate a color for heatmap based on severity (0-1)"""
    # Convert severity to a blue color scale (light to dark)
    blue = int(255 * (1 - severity))
    green = int(150 * (1 - severity))
    
    return f"rgb(0, {green}, {blue})"