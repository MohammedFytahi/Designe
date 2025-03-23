// script.js
let scene, camera, renderer, controls, standGroup, panel, visualCircles = [], compartment, blinders = [], lights = [];
let isFolded = false, isCompartmentOpen = false, isPulsing = false;

function init() {
    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);

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

    // Contrôles
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Groupe du présentoir
    standGroup = new THREE.Group();
    scene.add(standGroup);

    // Panneau vertical courbé (en bois)
    const panelShape = new THREE.Shape();
    panelShape.moveTo(-1.6, 0);
    panelShape.lineTo(-1.6, 7.2);
    panelShape.quadraticCurveTo(0, 6.4, 1.6, 7.2);
    panelShape.lineTo(1.6, 0);
    panelShape.lineTo(-1.6, 0);
    const extrudeSettings = { depth: 0.2, bevelEnabled: false };
    const panelGeometry = new THREE.ExtrudeGeometry(panelShape, extrudeSettings);
    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8B4513, // Bois brun
        metalness: 0.1,
        roughness: 0.5,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
    });
    panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = -2.2;
    panel.castShadow = true;
    panel.receiveShadow = true;
    standGroup.add(panel);

    // Base
    const baseGeometry = new THREE.BoxGeometry(3.2, 0.8, 2);
    const baseMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.6;
    base.castShadow = true;
    base.receiveShadow = true;
    standGroup.add(base);

    // Cercles visuels (3 emplacements)
    const circleGeometry = new THREE.CircleGeometry(1, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
    for (let i = 0; i < 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'KALINE' : i === 1 ? 'Soin expert' : 'Committed', 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        const circleMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(0, 2.4 * (1 - i) - 0.4, 0.11);
        visualCircles.push(circle);
        standGroup.add(circle);

        // Lumière TLS autour des cercles
        const tlsLight = new THREE.PointLight(0xffffcc, 1.5, 5);
        tlsLight.position.set(0, circle.position.y, 0.5);
        lights.push(tlsLight);
        standGroup.add(tlsLight);
    }

    // Compartiment
    const compartmentGeometry = new THREE.BoxGeometry(1, 0.4, 0.4);
    const compartmentMaterial = new THREE.MeshPhysicalMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
    compartment.position.set(0, -2.2, 0.8);
    compartment.castShadow = true;
    standGroup.add(compartment);

    // Blinders
    const blinderGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const blinderMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd0d0d0, emissive: 0xffffcc, emissiveIntensity: 0.8 });
    const blinderLeft = new THREE.Mesh(blinderGeometry, blinderMaterial);
    const blinderRight = new THREE.Mesh(blinderGeometry, blinderMaterial);
    blinderLeft.position.set(-1.2, 4.8, 0.5);
    blinderRight.position.set(1.2, 4.8, 0.5);
    blinders.push(blinderLeft, blinderRight);
    standGroup.add(blinderLeft, blinderRight);

    blinders.forEach(blinder => {
        const blinderLight = new THREE.SpotLight(0xffffcc, 3, 6, Math.PI / 8);
        blinderLight.position.copy(blinder.position);
        blinderLight.target.position.set(0, 2, 0);
        lights.push(blinderLight);
        standGroup.add(blinderLight, blinderLight.target);
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (isPulsing) {
        lights.forEach((light, i) => {
            light.intensity = 1.5 + Math.sin(Date.now() * 0.003 + i) * 0.5;
        });
        blinders.forEach(blinder => {
            blinder.rotation.y += 0.05;
        });
    }

    controls.update();
    renderer.render(scene, camera);
}

// Plier/Déplier
document.getElementById('toggle-btn').addEventListener('click', () => {
    isFolded = !isFolded;
    const duration = 1200;
    const startTime = performance.now();

    function foldAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        panel.rotation.x = isFolded ? THREE.MathUtils.lerp(0, -Math.PI / 2, ease) : THREE.MathUtils.lerp(-Math.PI / 2, 0, ease);
        visualCircles.forEach(circle => {
            circle.scale.setScalar(isFolded ? 1 - ease : ease);
            circle.rotation.x = panel.rotation.x;
        });

        if (progress < 1) requestAnimationFrame(foldAnimation);
    }

    requestAnimationFrame(foldAnimation);
    document.getElementById('toggle-btn').textContent = isFolded ? 'Déplier' : 'Plier';
});

// Mettre à jour visuels (dynamique)
document.getElementById('update-visuals-btn').addEventListener('click', () => {
    const newVisuals = [
        prompt('Texte panneau 1 :', 'KALINE Dermocosmétiques'),
        prompt('Texte panneau 2 :', 'Soin expert pour votre peau'),
        prompt('Texte panneau 3 :', 'Committed to your skin health')
    ];

    const duration = 1500;
    const startTime = performance.now();

    function updateAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        visualCircles.forEach((circle, index) => {
            if (newVisuals[index]) {
                // Animation de glissement et rotation
                circle.position.z = THREE.MathUtils.lerp(0.11, -1, ease);
                circle.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 2, ease);
                if (progress > 0.5 && circle.position.z < 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#1a1a1a';
                    ctx.font = '60px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(newVisuals[index], 256, 256);
                    circle.material.map = new THREE.CanvasTexture(canvas);
                    circle.material.needsUpdate = true;
                    circle.position.z = 1;
                }
                if (progress > 0.5) {
                    circle.position.z = THREE.MathUtils.lerp(1, 0.11, (progress - 0.5) * 2);
                    circle.rotation.y = THREE.MathUtils.lerp(Math.PI * 2, 0, (progress - 0.5) * 2);
                }
            }
        });

        // Effets lumineux
        lights.forEach((light, i) => {
            light.intensity = 1.5 + Math.sin(elapsed * 0.01 + i) * 1.2;
        });
        blinders.forEach(blinder => {
            blinder.material.emissiveIntensity = THREE.MathUtils.lerp(0.8, 4, ease);
            if (progress > 0.5) blinder.material.emissiveIntensity = THREE.MathUtils.lerp(4, 0.8, (progress - 0.5) * 2);
            blinder.scale.setScalar(1 + Math.sin(elapsed * 0.01) * 0.3);
        });

        if (progress < 1) requestAnimationFrame(updateAnimation);
    }

    requestAnimationFrame(updateAnimation);
});

// Ouvrir/Fermer compartiment
document.getElementById('toggle-compartment-btn').addEventListener('click', () => {
    isCompartmentOpen = !isCompartmentOpen;
    const targetZ = isCompartmentOpen ? 1.2 : 0.8;
    const duration = 1000;
    const startTime = performance.now();

    function compartmentAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        compartment.position.z = THREE.MathUtils.lerp(compartment.position.z, targetZ, ease);
        compartment.rotation.y = isCompartmentOpen ? THREE.MathUtils.lerp(0, Math.PI, ease) : THREE.MathUtils.lerp(Math.PI, 0, ease);
        if (progress < 1) requestAnimationFrame(compartmentAnimation);
    }

    requestAnimationFrame(compartmentAnimation);
    document.getElementById('toggle-compartment-btn').textContent = isCompartmentOpen ? 'Fermer compartiment' : 'Ouvrir compartiment';
});

// Pulsation
document.getElementById('pulse-btn').addEventListener('click', () => {
    isPulsing = !isPulsing;
    document.getElementById('pulse-btn').textContent = isPulsing ? 'Désactiver pulsation' : 'Activer pulsation';
});

// Démarrer
init();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});