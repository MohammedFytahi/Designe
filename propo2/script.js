// script.js
let scene, camera, renderer, controls, standGroup, panels = [], edges = [], compartment, blinders = [], lights = [];
let isFolded = false, isCompartmentOpen = false, isPulsing = false;
let visualMeshes = []; // Stocker les meshes des visuels

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Groupe du présentoir
    standGroup = new THREE.Group();
    scene.add(standGroup);

    // Panneaux prismatiques
    const panelGeometry = new THREE.CylinderGeometry(1.6, 1.6, 2.4, 6);
    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f4f5,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.95
    });

    for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.y = 2.4 * (1 - i) - 1.2;
        panel.castShadow = true;
        panel.receiveShadow = true;
        panels.push(panel);
        standGroup.add(panel);

        // Contours lumineux (TLS)
        const edgesGeometry = new THREE.EdgesGeometry(panelGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffcc, linewidth: 2 });
        const panelEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        panelEdges.position.y = panel.position.y;
        edges.push(panelEdges);
        standGroup.add(panelEdges);

        // Texte initial
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'KALINE' : i === 1 ? 'Soin expert' : 'Committed', 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2), textMaterial);
        textMesh.position.set(0, panel.position.y, 1.61);
        visualMeshes.push(textMesh); // Stocker pour mise à jour
        standGroup.add(textMesh);

        // Lumière TLS
        const tlsLight = new THREE.PointLight(0xffffcc, 1.5, 5);
        tlsLight.position.set(0, panel.position.y, 1.8);
        lights.push(tlsLight);
        standGroup.add(tlsLight);
    }

    // Base prismatique
    const baseGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.8, 6);
    const baseMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.2;
    base.castShadow = true;
    base.receiveShadow = true;
    standGroup.add(base);

    // Compartiment
    const compartmentGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 6);
    const compartmentMaterial = new THREE.MeshPhysicalMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
    compartment.position.set(0, -2.2, 0.8);
    compartment.castShadow = true;
    standGroup.add(compartment);

    // Blinders
    const blinderGeometry = new THREE.TetrahedronGeometry(0.25);
    const blinderMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd0d0d0, emissive: 0xffffcc, emissiveIntensity: 0.8 });
    const blinderLeft = new THREE.Mesh(blinderGeometry, blinderMaterial);
    const blinderRight = new THREE.Mesh(blinderGeometry, blinderMaterial);
    blinderLeft.position.set(-1.2, 3.6, 0.5);
    blinderRight.position.set(1.2, 3.6, 0.5);
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

        panels.forEach((panel, i) => {
            const startY = 2.4 * (1 - i) - 1.2;
            const endY = -2 + i * 0.2;
            panel.position.y = THREE.MathUtils.lerp(startY, endY, ease);
            panel.scale.setScalar(isFolded ? 1 - ease : ease);
            panel.rotation.y = isFolded ? THREE.MathUtils.lerp(0, Math.PI * 2, ease) : THREE.MathUtils.lerp(Math.PI * 2, 0, ease);
            edges[i].position.y = panel.position.y;
            edges[i].scale.copy(panel.scale);
            edges[i].rotation.y = panel.rotation.y;
            visualMeshes[i].position.y = panel.position.y;
            visualMeshes[i].scale.copy(panel.scale);
            visualMeshes[i].rotation.y = panel.rotation.y;
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

    const duration = 1000;
    const startTime = performance.now();

    function updateAnimation(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        visualMeshes.forEach((mesh, index) => {
            if (newVisuals[index] && progress === 0) {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#1a1a1a';
                ctx.font = '60px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(newVisuals[index], 256, 256);
                const newTexture = new THREE.CanvasTexture(canvas);

                // Animation de fondu
                mesh.material.opacity = THREE.MathUtils.lerp(1, 0, ease);
                if (progress > 0.5 && mesh.material.map !== newTexture) {
                    mesh.material.map = newTexture;
                    mesh.material.needsUpdate = true;
                }
                if (progress > 0.5) {
                    mesh.material.opacity = THREE.MathUtils.lerp(0, 1, (progress - 0.5) * 2);
                }

                // Rotation pendant la transition
                mesh.rotation.z = THREE.MathUtils.lerp(0, Math.PI, ease);
                if (progress > 0.5) mesh.rotation.z = THREE.MathUtils.lerp(Math.PI, 0, (progress - 0.5) * 2);
            }
        });

        // Effet lumineux TLS et blinders
        lights.forEach((light, i) => {
            light.intensity = 1.5 + Math.sin(elapsed * 0.01 + i) * 1;
        });
        blinders.forEach(blinder => {
            blinder.material.emissiveIntensity = THREE.MathUtils.lerp(0.8, 3, ease);
            if (progress > 0.5) blinder.material.emissiveIntensity = THREE.MathUtils.lerp(3, 0.8, (progress - 0.5) * 2);
            blinder.scale.setScalar(1 + Math.sin(elapsed * 0.01) * 0.2);
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