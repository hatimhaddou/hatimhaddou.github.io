// --- 1. SYSTEM INITIALIZATION (Loader) ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    }, 1500);
});

// Custom Cursor logic
document.addEventListener('mousemove', (event) => {
    const cursor = document.querySelector('.cursor');
    cursor.style.left = event.clientX + 'px';
    cursor.style.top = event.clientY + 'px';
});


// =================================================================
// --- 2. THREE.JS ADVANCED SCENE (THE "SPECTACULAR ORB") ---
// =================================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
// Camera setup for better depth perspective
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 18; // Move camera back a bit to see the large orb

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimization
container.appendChild(renderer.domElement);

// Lights for realism
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// --- GLOBAL VARIABLES FOR INTERACTION ---
let isRevealed = false;
let spinVelocity = 0;
let lastMouseX = 0;
let lastMouseY = 0;
const group = new THREE.Group(); // Everything will be inside this group for easy rotation
scene.add(group);


// ============================
// PART A: THE CORE (Hidden Initially)
// ============================
// A dense, metallic looking icosahedron core
const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1); // Slightly detailed
const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x7000ff, // Purple glow from inside
    emissiveIntensity: 0.5,
    wireframe: false
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.visible = false; // Hidden at start
group.add(core);

// Add a wireframe cage around the core for extra tech look
const cageGeo = new THREE.IcosahedronGeometry(1.6, 1);
const cageMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.3 });
const cage = new THREE.Mesh(cageGeo, cageMat);
core.add(cage); // Attached to core so they rotate together


// ============================
// PART B: THE GAS ORB (Realistic Smoke Effect)
// ============================
// Technique: Layered transparent spheres with noisy textures moving in opposite directions.
// This simulates volumetric smoke without the heavy computational cost.

// Helper function to create noise texture (Simulating smoke clouds)
function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d');
    const simplex = new SimplexNoise();
    const imgData = context.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        // Create cloudy noise pattern
        let noise = (simplex.noise2D(x / 50, y / 50) + 1) / 2; 
        noise += (simplex.noise2D(x / 20, y / 20) + 1) / 4;
        noise /= 1.5;
        
        const val = Math.floor(noise * 255);
        imgData.data[i] = 0x00;     // R (Cyan tint added in material)
        imgData.data[i+1] = 0xf3;   // G
        imgData.data[i+2] = 0xff;   // B
        imgData.data[i+3] = val;    // Alpha (transparency based on noise)
    }
    context.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

const gasTexture1 = createNoiseTexture();
const gasTexture2 = createNoiseTexture(); // Second layer for complexity

const gasGeometry = new THREE.SphereGeometry(4, 64, 64); // Large sphere

// Inner Gas Layer
const gasMaterial1 = new THREE.MeshPhongMaterial({
    map: gasTexture1,
    transparent: true,
    opacity: 0.6,
    depthWrite: false, // Important for transparency overlap
    blending: THREE.AdditiveBlending, // Makes it look glowing/gaseous
    side: THREE.DoubleSide,
    color: 0x00aaff // Deep Blue/Cyan
});
const gasOrb1 = new THREE.Mesh(gasGeometry, gasMaterial1);
group.add(gasOrb1);

// Outer Gas Layer (Slightly larger, different texture, rotating opposite)
const gasMaterial2 = new THREE.MeshPhongMaterial({
    map: gasTexture2,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    color: 0x7000ff // Purple tint overlapping
});
const gasOrb2 = new THREE.Mesh(new THREE.SphereGeometry(4.1, 64, 64), gasMaterial2);
group.add(gasOrb2);


// ============================
// PART C: THE AURA (Fresnel Shader Glow)
// ============================
// Using a custom shader material to create a realistic "edge glow" effect (Fresnel).
// This makes the edges of the sphere glow brighter than the center.

const auraVertexShader = `
varying vec3 vNormal;
varying vec3 viewDir;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    viewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const auraFragmentShader = `
varying vec3 vNormal;
varying vec3 viewDir;
uniform float time;
void main() {
    // Fresnel calculation: dot product of view direction and surface normal
    float fresnel = dot(viewDir, vNormal);
    // Invert and power for sharper edge glow
    float glow = pow(1.0 - fresnel, 3.0); 
    
    // Pulsating color between Cyan and Purple
    vec3 cyan = vec3(0.0, 0.95, 1.0);
    vec3 purple = vec3(0.44, 0.0, 1.0);
    vec3 finalColor = mix(cyan, purple, sin(time * 2.0) * 0.5 + 0.5);

    gl_FragColor = vec4(finalColor * glow * 2.0, glow); // Multiplied intensity
}
`;

const auraMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 1.0 } },
    vertexShader: auraVertexShader,
    fragmentShader: auraFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide // Render inside out for better aura effect on top
});

const auraOrb = new THREE.Mesh(new THREE.SphereGeometry(4.3, 64, 64), auraMaterial);
group.add(auraOrb);


// ============================
// INTERACTION & ANIMATION LOOP
// ============================

// Mouse movement to calculate spin velocity
document.addEventListener('mousemove', (e) => {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    // Calculate speed based on mouse movement distance
    const speed = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    
    // Add to spin velocity smoothly
    spinVelocity += speed * 0.0005; 

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

// RAYCASTER FOR CLICKING THE CORE
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();

container.addEventListener('click', (e) => {
    // Only check for clicks if the core is revealed
    if(!isRevealed) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = container.getBoundingClientRect();
    mouseVector.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouseVector.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);

    // Check intersection specifically with the CORE mesh
    const intersects = raycaster.intersectObject(core);

    if (intersects.length > 0) {
        // CLICK DETECTED ON CORE!
        console.log("Core accessed. Downloading CV...");
        // Trigger the hidden download link
        document.getElementById('hidden-cv-link').click();
        
        // Optional: Add a visual click feedback effect here
        gsap.to(core.scale, {x:1.2, y:1.2, z:1.2, yoyo:true, repeat:1, duration:0.2});
    }
});


let time = 0;
const animate = () => {
    requestAnimationFrame(animate);
    time += 0.01;

    // 1. Base Rotation (always turning slightly)
    group.rotation.y += 0.002;
    core.rotation.x += 0.01;
    core.rotation.z += 0.005;

    // 2. Apply Spin Velocity from mouse interaction
    group.rotation.y += spinVelocity;
    // Decay velocity (friction)
    spinVelocity *= 0.95; 

    // 3. Animate Gas Textures (Swirling effect)
    // Move texture offsets in opposite directions
    gasTexture1.offset.x += 0.001 + spinVelocity * 0.1;
    gasTexture2.offset.x -= 0.0015 + spinVelocity * 0.1;
    gasTexture1.offset.y += 0.0005;
    
    // 4. Update Shader Uniforms
    auraMaterial.uniforms.time.value = time;

    // ============================
    // THE REVELATION LOGIC (Spectacular Effect)
    // ============================
    // Threshold: If spinning fast enough, trigger revelation
    if (Math.abs(spinVelocity) > 0.15 && !isRevealed) {
        isRevealed = true;
        console.log("Velocity threshold reached. Dissipating energy field...");
        
        // GSAP Animations for smooth dissipation
        // Fade out Gas layers
        gsap.to(gasMaterial1, { opacity: 0, duration: 2, ease: "power2.out" });
        gsap.to(gasMaterial2, { opacity: 0, duration: 2.2, ease: "power2.out" });
        // Fade out and shrink Aura
        gsap.to(auraMaterial, { opacity: 0, duration: 1.5, ease: "power2.out" });
        gsap.to(auraOrb.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1.5, ease: "expo.in" });
        
        // Reveal Core (Scale up and show)
        core.visible = true;
        core.scale.set(0,0,0); // Start small
        gsap.to(core.scale, { x: 1, y: 1, z: 1, duration: 1, delay: 0.5, ease: "back.out(1.7)" });
        
        // Update hint text
        document.querySelector('.hint-text').innerHTML = "Energy dissipated. <span style='color:var(--primary)'>Click the Core to access data.</span>";
    }

    // Optional: Mechanic to reform the orb if it stops spinning?
    // For now, let's keep it revealed once opened for simplicity in accessing the CV.

    renderer.render(scene, camera);
};

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


// =================================================================
// --- 3. EASTER EGG (Hacker Terminal) - UNCHANGED ---
// =================================================================
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
let isTerminalOpen = false;

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && !isTerminalOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        isTerminalOpen = true;
        terminalOverlay.style.display = 'flex';
        terminalInput.focus();
    } else if (e.key === 'Escape' && isTerminalOpen) {
        closeTerminal();
    }
});

terminalOverlay.addEventListener('click', (e) => {
    if (e.target === terminalOverlay) closeTerminal();
});

function closeTerminal() {
    isTerminalOpen = false;
    terminalOverlay.style.display = 'none';
}

terminalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value.toLowerCase().trim();
        printOutput(`hatim@root:~$ ${command}`);
        processCommand(command);
        terminalInput.value = '';
    }
});

function printOutput(text) {
    const p = document.createElement('p');
    p.textContent = text;
    terminalOutput.insertBefore(p, terminalOutput.lastElementChild);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function processCommand(cmd) {
    switch(cmd) {
        case 'help': printOutput('Available commands: help, clear, contact, skills, whoami, exit'); break;
        case 'clear': while (terminalOutput.children.length > 2) { terminalOutput.removeChild(terminalOutput.firstChild); } break;
        case 'contact': printOutput('Email: hatim.haddou07@gmail.com | Phone: +33 6 21 04 34 62'); break;
        case 'skills': printOutput('AI, Cybersecurity, C++, Python, Embedded Systems, Azure AI...'); break;
        case 'whoami': printOutput('Hatim Haddou. The Engineer integrating AI with secure infrastructure.'); break;
        case 'exit': closeTerminal(); break;
        default: printOutput(`Command not found: ${cmd}`);
    }
}

// --- 4. TILT EFFECT INIT ---
VanillaTilt.init(document.querySelectorAll(".project-card"), { max: 5, speed: 400, glare: true, "max-glare": 0.2 });
