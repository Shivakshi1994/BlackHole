import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { OrbitControls } from './OrbitControls.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js';

import { createBlackHoleLensingMaterial } from './blackholeLensingShader.js';

const scene = new THREE.Scene();

const loader = new THREE.CubeTextureLoader;
const skybox = loader.load([
    './bkg/lightblue/right.png',
    './bkg/lightblue/left.png',
    './bkg/lightblue/top.png',
    './bkg/lightblue/bot.png',
    './bkg/lightblue/front.png',
    './bkg/lightblue/back.png'
]);
scene.background = skybox;

import { createEinsteinRingMaterial } from './einsteinRingShader.js';

const einsteinRing = new THREE.Mesh(
    new THREE.SphereGeometry(10.1, 128, 128),
    createEinsteinRingMaterial()
);
scene.add(einsteinRing);

// Load lensing shell
const lensingMaterial = createBlackHoleLensingMaterial(skybox);
const lensingShell = new THREE.Mesh(
    new THREE.SphereGeometry(20, 128, 128),
    lensingMaterial
);
scene.add(lensingShell);

import { createCurvedSpacetimeGrid } from './curvedSpacetimeGrid.js';

const spacetimeGrid = createCurvedSpacetimeGrid(30, 100, new THREE.Vector3(0, 0, 0));
scene.add(spacetimeGrid);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 30, 200);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#webgl'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.debug.checkShaderErrors = true;

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Light near black hole (fake lighting for realism)
const pointLight = new THREE.PointLight(0xffffff, 2, 300);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Ambient light to help see objects
scene.add(new THREE.AmbientLight(0x404040));

// Grid helper (for orientation)
scene.add(new THREE.GridHelper(300, 30));

// Black hole visuals
const visualRadius = 10;

const blackHoleGeo = new THREE.SphereGeometry(visualRadius, 64, 64);
const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const blackHoleMesh = new THREE.Mesh(blackHoleGeo, blackHoleMat);
scene.add(blackHoleMesh);

// Accretion Disk
const diskInnerRadius = visualRadius * 1.2;
const diskOuterRadius = visualRadius * 4;

// Ambient Light — softens everything a bit
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // color, intensity
scene.add(ambientLight);

// Directional Light — simulates distant starlight
const dirLight = new THREE.DirectionalLight(0xffffff, 2); // white, strong
dirLight.position.set(50, 100, 50); // coming from above and side
scene.add(dirLight);

// Optionally, show light direction
// const helper = new THREE.DirectionalLightHelper(dirLight, 5);
// scene.add(helper);

// Point Light — near accretion disk, adds glow
const diskLight = new THREE.PointLight(0xffaa33, 3, 200); // color, intensity, distance
diskLight.position.set(0, 0, 0); // center of black hole
scene.add(diskLight);

const diskGeometry = new THREE.RingGeometry(diskInnerRadius, diskOuterRadius, 128);
const diskMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    emmisive: 0xffaa33,
    emmisiveIntensity: 2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});

const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);

// Rotate the disk to align with black hole's equator
accretionDisk.rotation.x = Math.PI / 2;
accretionDisk.rotation.z += 0.002; // slow swirl

scene.add(accretionDisk);

// Glow / halo
const glowGeo = new THREE.SphereGeometry(visualRadius * 1.5, 64, 64);
const glowMat = new THREE.MeshBasicMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
});
const glow = new THREE.Mesh(glowGeo, glowMat);
blackHoleMesh.add(glow);

// Cannon.js physics
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0)
});

// Falling object
const objectGeo = new THREE.SphereGeometry(2, 32, 32);
const objectMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const objectMesh = new THREE.Mesh(objectGeo, objectMat);
scene.add(objectMesh);

const objectBody = new CANNON.Body({
    mass: 10,
    shape: new CANNON.Sphere(2),
    position: new CANNON.Vec3(100, 0, 0), // Far away
    velocity: new CANNON.Vec3(10, 25, -20)    // Initial orbit-like speed
});
world.addBody(objectBody);

// Constants
const G = 6.67430e-11;
const c = 299792458;
const mass = 1.989e30 * 10; // 10 solar masses
const Rs_m = (2 * G * mass) / (c * c); // meters
const scale = 1e-7;
const Rs = Rs_m * scale; // scaled Schwarzschild radius

let observerTime = 0;
let objectTime = 0;
const rs = 2; // Schwarzschild radius

const observerDisplay = document.getElementById('observer-time');
const objectDisplay = document.getElementById('object-time');

// Assume this is your falling object
const fallingObject = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffaa00 })
);
fallingObject.position.set(8, 0.2, 0);
scene.add(fallingObject);
let clock = new THREE.Clock;

// Apply relativistic gravity approximation
function applyGravity(body, strength = 1e6) {
    const pos = body.position;
    const r = pos.length();
    if (r === 0) return;

    const dir = pos.scale(-1 / r); // normalized toward center
    const forceMag = strength / (r * r);
    const force = dir.scale(forceMag);
    body.applyForce(force, pos);
}

function animate() {
    requestAnimationFrame(animate);

    applyGravity(objectBody);

    world.step(1 / 60);

    objectMesh.position.copy(objectBody.position);
    objectMesh.quaternion.copy(objectBody.quaternion);

    // Spaghettification
    const r = objectBody.position.length();
    const stretch = THREE.MathUtils.clamp(1 + (Rs / r) * 3, 1, 15);
    objectMesh.scale.set(1, stretch, 1);

    // Time dilation color shift
    const dilation = Math.sqrt(Math.max(0.01, 1 - Rs / r));
    objectMesh.material.color.setHSL(0.5 * dilation, 1, 0.5);

    lensingMaterial.uniforms.uCameraPos.value.copy(camera.position);
    einsteinRing.material.uniforms.uCameraPos.value.copy(camera.position);

    const delta = clock.getDelta(); // time step

    // Update observer time
    observerTime += delta;

    // Distance from black hole (assumed at origin)
    const R = fallingObject.position.length();
    const dilationFactor = Math.sqrt(1 - rs / Math.max(R, rs + 0.001)); // avoid sqrt of negative
    objectTime += delta * dilationFactor;

    // Update UI
    observerDisplay.textContent = observerTime.toFixed(2);
    objectDisplay.textContent = objectTime.toFixed(2);

    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g') {
        spacetimeGrid.visible = !spacetimeGrid.visible;
    }
});
