// main.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    const app = new NeuroXApp();
});

class NeuroXApp {
    constructor() {
        // Initialize properties
        this.brainModel = null;
        this.scenarioData = null;
        this.treatmentData = null;
        this.timelineChart = null;
        
        // Bind event handlers
        this.bindEvents();
    }
    
    bindEvents() {
        // Form submission
        document.getElementById('uploadForm').addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Scenario toggle
        const scenarioRadios = document.querySelectorAll('input[name="scenario"]');
        scenarioRadios.forEach(radio => {
            radio.addEventListener('change', this.handleScenarioChange.bind(this));
        });
        
        // Time slider
        document.getElementById('timeSlider').addEventListener('input', this.handleTimeSliderChange.bind(this));
        
        // Timeline scenario toggle
        const timelineRadios = document.querySelectorAll('input[name="timelineScenario"]');
        timelineRadios.forEach(radio => {
            radio.addEventListener('change', this.handleTimelineScenarioChange.bind(this));
        });
        
        // Treatment effect toggle
        document.getElementById('showTreatmentEffect').addEventListener('change', this.handleTreatmentEffectToggle.bind(this));
    }
    
    handleFormSubmit(event) {
        event.preventDefault();
        
        // Show loading state
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;
        
        // Get form data
        const formData = new FormData(event.target);
        
        // Send to server
        fetch('/api/upload_scan', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store data
            this.processResults(data);
            
            // Show results container
            document.getElementById('resultsContainer').classList.remove('hidden');
            
            // Reset button
            analyzeBtn.textContent = 'Analyze Brain';
            analyzeBtn.disabled = false;
            
            // Scroll to results
            document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during analysis. Please try again.');
            
            // Reset button
            analyzeBtn.textContent = 'Analyze Brain';
            analyzeBtn.disabled = false;
            
            // For development - simulate data when API fails
            if (confirm('Would you like to use simulated data for testing?')) {
                this.processResults(this.getSimulatedData());
                document.getElementById('resultsContainer').classList.remove('hidden');
            }
        });
    }
    
    processResults(data) {
        // Store data
        this.scenarioData = {
            'a': data.scenario_a,
            'b': data.scenario_b
        };
        this.treatmentData = {
            'a': data.treatment_plan.effects.scenario_a,
            'b': data.treatment_plan.effects.scenario_b
        };
        
        // Initialize 3D brain model if not already created
        if (!this.brainModel) {
            this.brainModel = new BrainModel('brainModelContainer');
        }
        
        // Update brain visualization
        this.brainModel.updateBrainRegions(data.affected_regions, data.region_coords);
        this.updateBrainVisualization();
        
        // Update treatment plan display
        this.displayTreatmentPlan(data.treatment_plan);
        
        // Update timeline chart
        this.updateTimelineChart();
        
        // Display clinical reasoning
        this.displayClinicalReasoning(data.treatment_plan.reasoning);
    }
    
    updateBrainVisualization() {
        // Get current scenario and time
        const currentScenario = document.querySelector('input[name="scenario"]:checked').value;
        const timeIndex = parseInt(document.getElementById('timeSlider').value);
        
        // Update time label
        const dates = this.scenarioData[currentScenario].timepoints;
        document.getElementById('timeLabel').textContent = dates[timeIndex];
        
        // Update brain model with current data
        this.brainModel.setScenario(currentScenario);
        this.brainModel.updateTimePoint(
            timeIndex,
            this.scenarioData[currentScenario],
            this.treatmentData[currentScenario]
        );
    }
    
    displayTreatmentPlan(treatmentPlan) {
        const treatmentPlanElement = document.getElementById('treatmentPlan');
        
        let html = `
            <div class="treatment-header">
                <h4>${treatmentPlan.treatments.map(t => t.name).join(' + ')}</h4>
                <div class="confidence">Confidence: ${Math.round(treatmentPlan.confidence * 100)}%</div>
            </div>
            <p>${treatmentPlan.description}</p>
            <div class="treatments">
        `;
        
        treatmentPlan.treatments.forEach(treatment => {
            html += `
                <div class="treatment-item">
                    <h5>${treatment.name}</h5>
                    <p>${treatment.description}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        
        treatmentPlanElement.innerHTML = html;
    }
    
    displayClinicalReasoning(reasoning) {
        const container = document.getElementById('clinicalReasoningContainer');
        
        let html = '<ul class="reasoning-list">';
        reasoning.forEach(point => {
            html += `<li>${point}</li>`;
        });
        html += '</ul>';
        
        container.innerHTML = html;
    }
    
    updateTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.timelineChart) {
            this.timelineChart.destroy();
        }
        
        // Get current timeline scenario
        const currentScenario = document.querySelector('input[name="timelineScenario"]:checked').value;
        const scenario = this.scenarioData[currentScenario];
        const treatment = this.treatmentData[currentScenario];
        
        // Prepare data
        const labels = scenario.timepoints;
        
        this.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'No Treatment',
                        data: scenario.cognitive_function.map(val => Math.round(val * 100)),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'With Treatment',
                        data: treatment.cognitive_function.map(val => Math.round(val * 100)),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Cognitive Function (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Timeline'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return `Time: ${tooltipItems[0].label}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    handleScenarioChange(event) {
        this.updateBrainVisualization();
    }
    
    handleTimeSliderChange(event) {
        this.updateBrainVisualization();
    }
    
    handleTimelineScenarioChange(event) {
        this.updateTimelineChart();
    }
    
    handleTreatmentEffectToggle(event) {
        const showEffect = event.target.checked;
        this.brainModel.setTreatmentEffect(showEffect);
        this.updateBrainVisualization();
    }
    
    // For development/testing - simulate API response
    getSimulatedData() {
        return {
            "affected_regions": [
                {"id": "hippocampus_left", "name": "Hippocampus (Left)", "x": 35, "y": 45, "z": 30, "size": 5, "severity": 0.3, "color": "rgb(0, 105, 178)"},
                {"id": "hippocampus_right", "name": "Hippocampus (Right)", "x": 65, "y": 45, "z": 30, "size": 5, "severity": 0.3, "color": "rgb(0, 105, 178)"},
                {"id": "entorhinal_cortex_left", "name": "Entorhinal Cortex (Left)", "x": 32, "y": 50, "z": 25, "size": 3, "severity": 0.2, "color": "rgb(0, 120, 204)"},
                {"id": "entorhinal_cortex_right", "name": "Entorhinal Cortex (Right)", "x": 68, "y": 50, "z": 25, "size": 3, "severity": 0.2, "color": "rgb(0, 120, 204)"},
                {"id": "prefrontal_cortex_left", "name": "Prefrontal Cortex (Left)", "x": 35, "y": 65, "z": 40, "size": 8, "severity": 0.1, "color": "rgb(0, 135, 229)"},
                {"id": "prefrontal_cortex_right", "name": "Prefrontal Cortex (Right)", "x": 65, "y": 65, "z": 40, "size": 8, "severity": 0.1, "color": "rgb(0, 135, 229)"}
            ],
            "scenario_a": {
                "name": "Typical Progression",
                "description": "Most likely progression based on current factors",
                "timepoints": ["2025-03", "2026-03", "2027-03", "2028-03", "2029-03", "2030-03", "2031-03", "2032-03", "2033-03", "2034-03", "2035-03", "2036-03", "2037-03", "2038-03", "2039-03", "2040-03"],
                "regions": {
                    "hippocampus": [0.7, 0.65, 0.6, 0.56, 0.52, 0.48, 0.45, 0.42, 0.39, 0.36, 0.33, 0.3, 0.27, 0.24, 0.21, 0.19],
                    "entorhinal_cortex": [0.8, 0.76, 0.72, 0.68, 0.64, 0.61, 0.58, 0.55, 0.52, 0.49, 0.46, 0.43, 0.4, 0.37, 0.34, 0.31],
                    "prefrontal_cortex": [0.9, 0.87, 0.84, 0.81, 0.78, 0.75, 0.72, 0.69, 0.66, 0.63, 0.6, 0.57, 0.54, 0.51, 0.48, 0.45]
                },
                "cognitive_function": [0.8, 0.76, 0.72, 0.68, 0.65, 0.61, 0.58, 0.55, 0.52, 0.49, 0.46, 0.43, 0.4, 0.37, 0.34, 0.32]
            },
            "scenario_b": {
                "name": "Accelerated Progression",
                "description": "More aggressive progression scenario",
                "timepoints": ["2025-03", "2026-03", "2027-03", "2028-03", "2029-03", "2030-03", "2031-03", "2032-03", "2033-03", "2034-03", "2035-03", "2036-03", "2037-03", "2038-03", "2039-03", "2040-03"],
                "regions": {
                    "hippocampus": [0.7, 0.61, 0.53, 0.46, 0.4, 0.35, 0.31, 0.27, 0.24, 0.21, 0.18, 0.16, 0.14, 0.12, 0.11, 0.1],
                    "entorhinal_cortex": [0.8, 0.73, 0.66, 0.6, 0.54, 0.49, 0.44, 0.4, 0.36, 0.32, 0.29, 0.26, 0.23, 0.21, 0.19, 0.17],
                    "prefrontal_cortex": [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.36, 0.32, 0.29, 0.26, 0.23]
                },
                "cognitive_function": [0.8, 0.73, 0.67, 0.61, 0.55, 0.5, 0.45, 0.41, 0.37, 0.33, 0.3, 0.27, 0.24, 0.21, 0.19, 0.17]
            },
            "treatment_plan": {
                "treatments": [
                    {
                        "id": "medication_a",
                        "name": "Cholinesterase Inhibitors",
                        "description": "Helps manage cognitive symptoms by increasing acetylcholine levels",
                        "efficacy": {
                            "hippocampus": 0.15,
                            "entorhinal_cortex": 0.10,
                            "prefrontal_cortex": 0.05
                        },
                        "side_effects": 0.2,
                        "cost": 2
                    },
                    {
                        "id": "lifestyle_changes",
                        "name": "Lifestyle Modifications",
                        "description": "Exercise, diet, and stress management to support brain health",
                        "efficacy": {
                            "hippocampus": 0.08,
                            "entorhinal_cortex": 0.08,
                            "prefrontal_cortex": 0.08
                        },
                        "side_effects": 0,
                        "cost": 1
                    }
                ],
                "description": "Optimized treatment plan effective across both progression scenarios",
                "effects": {
                    "scenario_a": {
                        "cognitive_function": [0.8, 0.77, 0.74, 0.71, 0.68, 0.65, 0.62, 0.59, 0.56, 0.53, 0.5, 0.47, 0.44, 0.41, 0.38, 0.36],
                        "improvement": [0, 1, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
                    },
                    "scenario_b": {
                        "cognitive_function": [0.8, 0.74, 0.69, 0.64, 0.59, 0.55, 0.51, 0.47, 0.43, 0.39, 0.36, 0.33, 0.3, 0.27, 0.25, 0.23],
                        "improvement": [0, 1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
                    }
                },
                "confidence": 0.85,
                "reasoning": [
                    "Cholinesterase Inhibitors were selected as the optimal treatment because they provide balanced protection across key brain regions.",
                    "Lifestyle Modifications were included to provide additive benefits with minimal side effects.",
                    "This treatment approach is robust across both progression scenarios, with particularly strong benefits in the accelerated scenario."
                ]
            }
        };
    }
}