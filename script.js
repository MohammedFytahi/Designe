// script.js
let scene, camera, renderer, controls, standGroup, panels = [], compartment, blinders = [], lights = [];
let isFolded = false, isCompartmentOpen = false, isRotating = false;

// Initialisation
function init() {
    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // Caméra
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    // Rendu
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Contrôles OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Groupe du présentoir
    standGroup = new THREE.Group();
    scene.add(standGroup);

    // Panneaux (3 visuels avec effet TLS)
    const panelGeometry = new THREE.BoxGeometry(3.2, 2.4, 0.2); // 80cm x 60cm x 5cm
    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8ecef,
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.y = 2.4 * (1 - i) - 1.2;
        panel.castShadow = true;
        panel.receiveShadow = true;
        panels.push(panel);
        standGroup.add(panel);

        // Texte dynamique
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'KALINE Dermocosmétiques' : i === 1 ? 'Soin expert pour votre peau' : 'Committed to your skin health', 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), textMaterial);
        textMesh.position.set(0, panel.position.y, 0.11);
        standGroup.add(textMesh);

        // Simulation TLS (lumières autour des panneaux)
        const tlsLight = new THREE.PointLight(0xffffcc, 1, 5);
        tlsLight.position.set(0, panel.position.y, 0.5);
        lights.push(tlsLight);
        standGroup.add(tlsLight);
    }

    // Base
    const baseGeometry = new THREE.BoxGeometry(3.2, 0.8, 1);
    const baseMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.2;
    base.castShadow = true;
    base.receiveShadow = true;
    standGroup.add(base);

    // Compartiment caché
    const compartmentGeometry = new THREE.BoxGeometry(1, 0.4, 0.4);
    const compartmentMaterial = new THREE.MeshPhysicalMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
    compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
    compartment.position.set(0, -2.2, 0.3);
    compartment.castShadow = true;
    standGroup.add(compartment);

    // Blinders (lumières dynamiques)
    const blinderGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const blinderMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc0c0c0, emissive: 0xffffcc, emissiveIntensity: 0.5 });
    const blinderLeft = new THREE.Mesh(blinderGeometry, blinderMaterial);
    const blinderRight = new THREE.Mesh(blinderGeometry, blinderMaterial);
    blinderLeft.position.set(-1.4, 3.4, 0.2);
    blinderRight.position.set(1.4, 3.4, 0.2);
    blinders.push(blinderLeft, blinderRight);
    standGroup.add(blinderLeft, blinderRight);

    // Lumière des blinders
    blinders.forEach(blinder => {
        const blinderLight = new THREE.SpotLight(0xffffcc, 2, 5, Math.PI / 6);
        blinderLight.position.copy(blinder.position);
        blinderLight.target.position.set(0, 2, 0);
        lights.push(blinderLight);
        standGroup.add(blinderLight, blinderLight.target);
    });
}

// Animation
function animate() {
    requestAnimationFrame(animate);

    if (isRotating) standGroup.rotation.y += 0.01;
    controls.update();

    // Pulsation des lumières TLS
    lights.forEach((light, i) => {
        if (i < 3) light.intensity = 1 + Math.sin(Date.now() * 0.002 + i) * 0.2;
    });

    renderer.render(scene, camera);
}

// Plier/Déplier
document.getElementById('toggle-btn').addEventListener('click', () => {
    isFolded = !isFolded;
    const duration = 1000;
    const startTime = performance.now();

    function foldAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        panels.forEach((panel, i) => {
            const startY = 2.4 * (1 - i) - 1.2;
            const endY = -2 + i * 0.1;
            panel.position.y = THREE.MathUtils.lerp(startY, endY, ease);
            panel.scale.y = isFolded ? 1 - ease : ease;
            panel.rotation.x = isFolded ? THREE.MathUtils.lerp(0, -Math.PI / 2, ease) : THREE.MathUtils.lerp(-Math.PI / 2, 0, ease);
        });

        if (progress < 1) requestAnimationFrame(foldAnimation);
    }

    requestAnimationFrame(foldAnimation);
    document.getElementById('toggle-btn').textContent = isFolded ? 'Déplier' : 'Plier';
});

// Mettre à jour visuels
document.getElementById('update-visuals-btn').addEventListener('click', () => {
    const newVisuals = [
        prompt('Texte panneau 1 :', 'KALINE Dermocosmétiques'),
        prompt('Texte panneau 2 :', 'Soin expert pour votre peau'),
        prompt('Texte panneau 3 :', 'Committed to your skin health')
    ];

    standGroup.children.forEach(child => {
        if (child.geometry.type === 'PlaneGeometry') {
            const index = Math.floor((3.4 - child.position.y) / 2.4);
            if (newVisuals[index]) {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#333';
                ctx.font = '60px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(newVisuals[index], 256, 256);
                child.material.map = new THREE.CanvasTexture(canvas);
                child.material.needsUpdate = true;

                // Effet des blinders
                blinders.forEach(blinder => {
                    blinder.material.emissiveIntensity = 2;
                    setTimeout(() => blinder.material.emissiveIntensity = 0.5, 1000);
                });
            }
        }
    });
});

// Ouvrir/Fermer compartiment
document.getElementById('toggle-compartment-btn').addEventListener('click', () => {
    isCompartmentOpen = !isCompartmentOpen;
    const targetZ = isCompartmentOpen ? 0.8 : 0.3;
    const duration = 800;
    const startTime = performance.now();

    function compartmentAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        compartment.position.z = THREE.MathUtils.lerp(compartment.position.z, targetZ, ease);
        if (progress < 1) requestAnimationFrame(compartmentAnimation);
    }

    requestAnimationFrame(compartmentAnimation);
    document.getElementById('toggle-compartment-btn').textContent = isCompartmentOpen ? 'Fermer compartiment' : 'Ouvrir compartiment';
});

// Rotation automatique
document.getElementById('rotate-btn').addEventListener('click', () => {
    isRotating = !isRotating;
    document.getElementById('rotate-btn').textContent = isRotating ? 'Arrêter rotation' : 'Rotation auto';
});

// Démarrer
init();
animate();

// Redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});