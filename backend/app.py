# app.py - Main application backend
from flask import Flask, request, jsonify
import numpy as np
import os
from werkzeug.utils import secure_filename
import json
from models.progression import calculate_progression_scenarios
from models.treatment import optimize_treatment
from utils.scan_processor import process_scan
from utils.brain_mapper import map_affected_regions

app = Flask(__name__, static_folder='../frontend')

# Configure upload folder
UPLOAD_FOLDER = 'data/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'dicom', 'dcm', 'nii', 'nii.gz'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/upload_scan', methods=['POST'])
def upload_scan():
    if 'scanFile' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['scanFile']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process patient factors
        factors = {
            'age': float(request.form.get('age', 0)),
            'genetic_markers': float(request.form.get('genetic_markers', 0)),
            'brain_metrics': float(request.form.get('brain_metrics', 0)),
            'biomarkers': float(request.form.get('biomarkers', 0)),
            'cognitive_scores': float(request.form.get('cognitive_scores', 0))
        }
        
        # Process the scan
        affected_regions = process_scan(filepath)
        
        # Map regions to 3D coordinates
        region_mapping = map_affected_regions(affected_regions)
        
        # Calculate progression scenarios
        scenario_a, scenario_b = calculate_progression_scenarios(factors, affected_regions)
        
        # Determine optimal treatment
        treatment_plan = optimize_treatment(scenario_a, scenario_b, factors)
        
         # Extract brain region coordinates from the MRI scan
        # This is a simplified example. 
        region_coords = {
            'hippocampus_left': {'x': 35, 'y': 45, 'z': 30},
            'hippocampus_right': {'x': 65, 'y': 45, 'z': 30},
            'entorhinal_cortex_left': {'x': 32, 'y': 50, 'z': 25},
            'entorhinal_cortex_right': {'x': 68, 'y': 50, 'z': 25},
            'prefrontal_cortex_left': {'x': 35, 'y': 65, 'z': 40},
            'prefrontal_cortex_right': {'x': 65, 'y': 65, 'z': 40}
        }

        # Include coordinates in the response
        response = {
            'affected_regions': region_mapping,
            'scenario_a': scenario_a,
            'scenario_b': scenario_b,
            'treatment_plan': treatment_plan,
            'region_coords': region_coords 
        }
        
        return jsonify(response)
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)