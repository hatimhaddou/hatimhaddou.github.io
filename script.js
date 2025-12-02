// --- 1. NEURAL BACKGROUND ANIMATION (Optimized) ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray;
let mouse = { x: null, y: null, radius: 150 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    // Custom cursor movement
    document.querySelector('.cursor').style.left = e.x + 'px';
    document.querySelector('.cursor').style.top = e.y + 'px';
    document.querySelector('.cursor2').style.left = e.x + 'px';
    document.querySelector('.cursor2').style.top = e.y + 'px';
});

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Mouse interaction
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < mouse.radius + this.size) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
            if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
            if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 15000; // Dense but light
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.5;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let dx = (Math.random() * 1) - 0.5;
        let dy = (Math.random() * 1) - 0.5;
        particlesArray.push(new Particle(x, y, dx, dy, size, '#38bdf8'));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

function connect() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                         + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width/9) * (canvas.height/9)) {
                let opacity = 1 - (distance / 15000);
                ctx.strokeStyle = 'rgba(56, 189, 248,' + opacity + ')';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}
init();
animate();

window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
});

// --- 2. TYPEWRITER EFFECT ---
const textElement = document.querySelector('.typing-text');
const words = ["Solutions.", "Secure Systems.", "Future AI.", "Innovation."];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typeEffect = () => {
    const currentWord = words[wordIndex];
    const currentChar = currentWord.substring(0, charIndex);
    textElement.textContent = currentChar;

    if (!isDeleting && charIndex < currentWord.length) {
        charIndex++;
        setTimeout(typeEffect, 100);
    } else if (isDeleting && charIndex > 0) {
        charIndex--;
        setTimeout(typeEffect, 50);
    } else {
        isDeleting = !isDeleting;
        wordIndex = !isDeleting ? (wordIndex + 1) % words.length : wordIndex;
        setTimeout(typeEffect, 1200);
    }
};
typeEffect();

// --- 3. SKILL FILTERING SYSTEM (The "Highlight" Effect) ---
const skillBtns = document.querySelectorAll('.skill-btn');
const projectCards = document.querySelectorAll('.project-card');

skillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Toggle active state on button
        // Remove active from others if you want single select, or toggle
        if(btn.classList.contains('active')) {
            btn.classList.remove('active');
            resetProjects();
        } else {
            // Remove active from all others (optional, cleaner)
            skillBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProjects(btn.dataset.tech);
        }
    });
});

function filterProjects(tech) {
    projectCards.forEach(card => {
        const techs = card.dataset.techs.split(' ');
        if (techs.includes(tech)) {
            card.classList.remove('dimmed');
            card.classList.add('highlighted');
        } else {
            card.classList.remove('highlighted');
            card.classList.add('dimmed');
        }
    });
}

function resetProjects() {
    projectCards.forEach(card => {
        card.classList.remove('dimmed');
        card.classList.remove('highlighted');
    });
}

// --- 4. TILT EFFECT INIT ---
VanillaTilt.init(document.querySelectorAll(".tilt"), {
    max: 15,
    speed: 400,
    glare: true,
    "max-glare": 0.2,
});
