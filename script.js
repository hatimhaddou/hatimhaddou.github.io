// --- 1. SYSTEM INITIALIZATION (Loader) ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1500); // Fake loading time for effect
});

// --- 2. THREE.JS 3D BACKGROUND (The "Waw" Factor) ---
// We create a rotating cybernetic core
const container = document.getElementById('canvas-container');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Create Geometry (Icosahedron = Techy shape)
const geometry = new THREE.IcosahedronGeometry(1, 1);
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, // Cyan
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const cyberCore = new THREE.Mesh(geometry, material);
scene.add(cyberCore);

// Add inner core (solid)
const innerGeo = new THREE.IcosahedronGeometry(0.5, 0);
const innerMat = new THREE.MeshBasicMaterial({ color: 0x7000ff, wireframe: true });
const innerCore = new THREE.Mesh(innerGeo, innerMat);
scene.add(innerCore);

// Particles around
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 700;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5; // Spread particles
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

camera.position.z = 3;

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
    
    // Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    cursor.style.left = event.clientX + 'px';
    cursor.style.top = event.clientY + 'px';
});

// Animation Loop
const animate = () => {
    requestAnimationFrame(animate);

    // Rotate objects
    cyberCore.rotation.y += 0.002;
    cyberCore.rotation.x += 0.001;
    innerCore.rotation.y -= 0.005;
    innerCore.rotation.x -= 0.005;
    particlesMesh.rotation.y = -mouseX * 0.5;
    particlesMesh.rotation.x = -mouseY * 0.5;

    // Responsive follow mouse
    cyberCore.rotation.y += mouseX * 0.05;
    cyberCore.rotation.x += mouseY * 0.05;

    renderer.render(scene, camera);
};

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});


// --- 3. EASTER EGG (Hacker Terminal) ---
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
    // Insert before the input line
    terminalOutput.insertBefore(p, terminalOutput.lastElementChild);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function processCommand(cmd) {
    switch(cmd) {
        case 'help':
            printOutput('Available commands: help, clear, contact, skills, whoami, exit');
            break;
        case 'clear':
            // Remove all p tags except the welcome msg logic if wanted, simple clear:
            while (terminalOutput.children.length > 2) { 
                terminalOutput.removeChild(terminalOutput.firstChild); 
            }
            break;
        case 'contact':
            printOutput('Email: hatim.haddou07@gmail.com | Phone: +33 6 21 04 34 62');
            break;
        case 'skills':
            printOutput('AI, Cybersecurity, C++, Python, Embedded Systems...');
            break;
        case 'whoami':
            printOutput('Hatim Haddou. The Engineer you are looking for.');
            break;
        case 'exit':
            closeTerminal();
            break;
        default:
            printOutput(`Command not found: ${cmd}`);
    }
}

// --- 4. TILT EFFECT INIT ---
VanillaTilt.init(document.querySelectorAll(".project-card"), {
    max: 5,
    speed: 400,
    glare: true,
    "max-glare": 0.2,
});
