// --- 1. INITIALIZATION & LOADER ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    
    // Animate Hero Elements with GSAP
    gsap.to('.fade-in', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5
    });

    // Hide loader
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }, 1500);
});

// Custom Cursor
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// =================================================================
// --- 2. THREE.JS SCENE (THE ORB) ---
// =================================================================
const container = document.getElementById('canvas-container');

// Ensure container exists
if(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x404040, 2));
    const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const group = new THREE.Group();
    scene.add(group);

    // --- GAMEPLAY VARIABLES ---
    let orbHealth = 100;
    let spinVelocity = 0;
    let isRevealed = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // --- A. THE CORE (Icosahedron) ---
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.2, metalness: 0.9,
        emissive: 0x7000ff, emissiveIntensity: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.set(0.1, 0.1, 0.1); // Starts small/hidden
    group.add(core);

    const cageGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const cageMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    core.add(cage);

    // --- B. THE GAS (Procedural Noise Texture) ---
    // Function to generate noise texture internally (No external dependency)
    function createCloudTexture() {
        const size = 128;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size * size * 4; i += 4) {
            const val = Math.floor(Math.random() * 255); // Simple noise
            data[i] = 0; // R
            data[i+1] = 200; // G
            data[i+2] = 255; // B
            data[i+3] = Math.max(0, val - 100); // Alpha
        }
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.needsUpdate = true;
        return texture;
    }

    const gasTex = createCloudTexture();
    const gasGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const gasMat = new THREE.MeshBasicMaterial({
        map: gasTex, transparent: true, opacity: 0.6,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const gasOrb = new THREE.Mesh(gasGeo, gasMat);
    group.add(gasOrb);

    const gasOrb2 = new THREE.Mesh(new THREE.SphereGeometry(3.6, 32, 32), 
        new THREE.MeshBasicMaterial({
            map: gasTex, transparent: true, opacity: 0.3,
            depthWrite: false, blending: THREE.AdditiveBlending, color: 0x7000ff
        })
    );
    group.add(gasOrb2);

    // --- C. AURA (Glow) ---
    const auraGeo = new THREE.SphereGeometry(3.8, 32, 32);
    const auraMat = new THREE.ShaderMaterial({
        uniforms: { 
            c: { type: "f", value: 0.5 },
            p: { type: "f", value: 3.0 },
            glowColor: { type: "c", value: new THREE.Color(0x00f3ff) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize( normalMatrix * normal );
                vec3 vNormel = normalize( normalMatrix * viewVector );
                intensity = pow( c - dot(vNormal, vNormel), p );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4( glow, 1.0 );
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // --- INTERACTION ---
    document.addEventListener('mousemove', (e) => {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const speed = Math.sqrt(dx*dx + dy*dy);
        spinVelocity += speed * 0.0002; // Add spin
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // Click Core to Download
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    container.addEventListener('click', (e) => {
        if(!isRevealed) return;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(core);
        if(intersects.length > 0) {
            document.getElementById('hidden-cv-link').click();
            gsap.to(core.scale, {x:1.5, y:1.5, z:1.5, yoyo:true, repeat:1, duration:0.2});
        }
    });

    // --- ANIMATION LOOP ---
    const animate = () => {
        requestAnimationFrame(animate);

        // 1. Idle Rotation (Planet effect)
        group.rotation.y += 0.003; 
        
        // 2. Interaction Spin
        group.rotation.y += spinVelocity;
        group.rotation.x += spinVelocity * 0.5;
        spinVelocity *= 0.95; // Friction

        // 3. Health Logic
        if(Math.abs(spinVelocity) > 0.1 && orbHealth > 0) {
            orbHealth -= 0.5;
        } else if (Math.abs(spinVelocity) < 0.01 && orbHealth < 100 && !isRevealed) {
            orbHealth += 0.2; // Regenerate if stop spinning
        }

        // Update UI
        const healthBar = document.getElementById('orb-health');
        healthBar.style.width = orbHealth + '%';
        if(orbHealth < 30) healthBar.style.backgroundColor = '#ff2a2a';
        else healthBar.style.backgroundColor = '#00f3ff';

        // 4. Visual Dissipation
        const opacity = orbHealth / 100;
        gasMat.opacity = 0.6 * opacity;
        gasOrb2.material.opacity = 0.3 * opacity;
        auraMat.uniforms.c.value = 0.5 * opacity;

        // 5. Reveal Core
        if(orbHealth <= 0 && !isRevealed) {
            isRevealed = true;
            document.querySelector('.orb-instruction').innerText = "SHIELD DOWN. CLICK CORE.";
            document.querySelector('.orb-instruction').style.color = "#ff2a2a";
            gsap.to(core.scale, {x:1, y:1, z:1, duration: 1, ease:"back.out"});
        }

        core.rotation.x += 0.01;
        core.rotation.y += 0.02;

        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// --- 3. TERMINAL ---
const termOverlay = document.getElementById('terminal-overlay');
const termInput = document.getElementById('terminal-input');
const termOutput = document.getElementById('terminal-output');
let termOpen = false;

document.addEventListener('keydown', (e) => {
    if(e.key.toLowerCase() === 't' && !termOpen) {
        termOpen = true;
        termOverlay.style.display = 'flex';
        termInput.focus();
    } else if (e.key === 'Escape' && termOpen) {
        termOpen = false;
        termOverlay.style.display = 'none';
    }
});

termOverlay.addEventListener('click', (e) => { if(e.target === termOverlay) { termOpen = false; termOverlay.style.display = 'none'; }});

termInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const cmd = termInput.value.toLowerCase().trim();
        const p = document.createElement('p');
        p.textContent = `hatim@root:~$ ${cmd}`;
        termOutput.appendChild(p);
        
        let response = "";
        switch(cmd) {
            case 'help': response = "Available: help, contact, projects, clear, exit"; break;
            case 'contact': response = "hatim.haddou07@gmail.com"; break;
            case 'projects': response = "Check the grid below."; break;
            case 'clear': termOutput.innerHTML = ""; break;
            case 'exit': termOpen = false; termOverlay.style.display = 'none'; break;
            default: response = `Command not found: ${cmd}`;
        }
        if(response) {
            const r = document.createElement('p');
            r.style.color = "#00f3ff";
            r.textContent = response;
            termOutput.appendChild(r);
        }
        termInput.value = "";
        termOutput.scrollTop = termOutput.scrollHeight;
    }
});

// Tilt Init
VanillaTilt.init(document.querySelectorAll(".project-card"), { max: 10, speed: 400, glare: true, "max-glare": 0.2 });
