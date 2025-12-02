// Initialisation de GSAP
gsap.registerPlugin(ScrollTrigger);

// --- 1. CURSEUR MAGNÉTIQUE AVANCÉ ---
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
const magneticElements = document.querySelectorAll('.magnetic');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    // Le point suit instantanément
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Le cercle suit avec un délai (smooth) via animation native JS pour perf
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Effet magnétique sur les boutons
magneticElements.forEach(elem => {
    elem.addEventListener('mouseenter', () => {
        document.body.classList.add('hovering');
        gsap.to(elem, { scale: 1.1, duration: 0.3 });
    });
    elem.addEventListener('mouseleave', () => {
        document.body.classList.remove('hovering');
        gsap.to(elem, { scale: 1, duration: 0.3 });
    });
});

// --- 2. HERO REVEAL ANIMATION ---
const tl = gsap.timeline();

tl.from('.reveal-text', {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power4.out"
})
.from('.reveal-text-title', {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out"
}, "-=0.8")
.from('.hero-visual', {
    x: 100,
    opacity: 0,
    duration: 1.5,
    ease: "expo.out"
}, "-=1");

// --- 3. FILTRAGE DES PROJETS (STYLE BENTO) ---
const filterBtns = document.querySelectorAll('.filter-btn');
const bentoItems = document.querySelectorAll('.bento-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active Class
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        bentoItems.forEach(item => {
            const categories = item.getAttribute('data-category');
            
            if (filterValue === 'all' || categories.includes(filterValue)) {
                gsap.to(item, { 
                    scale: 1, 
                    opacity: 1, 
                    display: 'flex', 
                    duration: 0.5,
                    ease: "power2.out"
                });
            } else {
                gsap.to(item, { 
                    scale: 0.8, 
                    opacity: 0, 
                    display: 'none', 
                    duration: 0.3 
                });
            }
        });
    });
});

// --- 4. SCROLL ANIMATIONS (Reveal au défilement) ---
gsap.utils.toArray('.bento-item').forEach((item, i) => {
    gsap.from(item, {
        scrollTrigger: {
            trigger: item,
            start: "top 85%",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1, // Petit délai en cascade
        ease: "power2.out"
    });
});

gsap.from('.about-image', {
    scrollTrigger: { trigger: '#about', start: "top 70%" },
    x: -100, opacity: 0, duration: 1, ease: "power2.out"
});

gsap.from('.about-text', {
    scrollTrigger: { trigger: '#about', start: "top 70%" },
    x: 100, opacity: 0, duration: 1, ease: "power2.out"
});
