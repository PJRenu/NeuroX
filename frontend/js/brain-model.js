// brain-model.js
class BrainModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.brainRegions = {};
        this.currentScenario = 'a';
        this.currentTimeIndex = 0;
        this.showTreatmentEffect = true;
        
        this.init();
    }
    
    init() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(
            45, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 150);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 20, 10);
        this.scene.add(directionalLight);
        
        // Add basic brain model (placeholder)
        this.createBaseBrainModel();
        
        // Set up controls
        this.setupControls();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    createBaseBrainModel() {
        // Create a placeholder brain model
        const brainGeometry = new THREE.SphereGeometry(40, 32, 32);
        const brainMaterial = new THREE.MeshPhongMaterial({
            color: 0xe0e0e0,
            transparent: true,
            opacity: 0.4,
            wireframe: false
        });
        this.brainBase = new THREE.Mesh(brainGeometry, brainMaterial);
        this.scene.add(this.brainBase);
        
        // Add cross-section for context
        const crossSectionGeometry = new THREE.CircleGeometry(40, 32);
        const crossSectionMaterial = new THREE.MeshBasicMaterial({
            color: 0xe0e0e0,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const crossSection = new THREE.Mesh(crossSectionGeometry, crossSectionMaterial);
        crossSection.rotation.x = Math.PI / 2;
        this.scene.add(crossSection);
    }
    
    setupControls() {
        // Add orbit controls for interactive viewing
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 80;
        this.controls.maxDistance = 200;
    }
    
    onWindowResize() {
        // Update camera and renderer on window resize
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Rotate brain slightly for better visualization
        this.brainBase.rotation.y += 0.001;
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateBrainRegions(regionsData, regionCoords) {
        // Clear existing regions
        this.clearBrainRegions();
        
        // Create region objects
        regionsData.forEach(region => {
            const sphereGeometry = new THREE.SphereGeometry(region.size, 16, 16);
            
            // Convert from our coordinate system to Three.js coordinates
            const coords = regionCoords[region.id]
            const x = region.x - 50; // Center at origin
            const y = region.y - 50;
            const z = region.z - 50;
            
            // Create material with color based on severity
            const color = this.getSeverityColor(1.0); // Start healthy
            const material = new THREE.MeshPhongMaterial({ color });
            
            // Create mesh and position it
            const mesh = new THREE.Mesh(sphereGeometry, material);
            mesh.position.set(x, y, z);
            
            // Store reference to mesh
            this.brainRegions[region.id] = {
                mesh,
                data: region
            };
            
            // Add to scene
            this.scene.add(mesh);
        });
    }
    
    clearBrainRegions() {
        // Remove all region meshes from scene
        Object.values(this.brainRegions).forEach(region => {
            this.scene.remove(region.mesh);
        });
        
        // Reset regions object
        this.brainRegions = {};
    }
    
    getSeverityColor(healthValue) {
        // Convert health value (0-1) to color
        // 1 = healthy (light blue), 0 = severe (dark blue)
        const h = 210; // Blue hue
        const s = 80; // Saturation percentage
        const l = Math.max(20, Math.min(90, 20 + healthValue * 70)); // Lightness percentage
        
        return `hsl(${h}, ${s}%, ${l}%)`;
    }
    
    updateTimePoint(timeIndex, scenarioData, treatmentData) {
        this.currentTimeIndex = timeIndex;
        
        // Update each brain region based on progression data
        Object.entries(this.brainRegions).forEach(([id, region]) => {
            const regionBase = id.split('_')[0]; // Get region name without side
            
            if (scenarioData.regions[regionBase]) {
                // Get health value at current time point
                const healthValue = scenarioData.regions[regionBase][timeIndex];
                
                // Apply treatment effect if enabled
                let adjustedHealth = healthValue;
                if (this.showTreatmentEffect && treatmentData) {
                    // Calculate treatment effect (simplified)
                    const baseValue = scenarioData.regions[regionBase][timeIndex];
                    const treatmentImprovement = (treatmentData.cognitive_function[timeIndex] - 
                                                scenarioData.cognitive_function[timeIndex]) * 0.5;
                    
                    adjustedHealth = Math.min(1.0, baseValue + treatmentImprovement);
                }
                
                // Update color based on health value
                region.mesh.material.color.set(this.getSeverityColor(adjustedHealth));
                
                // Scale region slightly to show atrophy
                const scale = 0.5 + adjustedHealth * 0.5;
                region.mesh.scale.set(scale, scale, scale);
            }
        });
    }
    
    setScenario(scenario) {
        this.currentScenario = scenario;
    }
    
    setTreatmentEffect(showEffect) {
        this.showTreatmentEffect = showEffect;
    }
}