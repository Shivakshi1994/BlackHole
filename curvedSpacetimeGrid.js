import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function createCurvedSpacetimeGrid(size = 20, segments = 100, blackHole = new THREE.Vector3(0, 0, 0)) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        opacity: 0.4,
        transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // face upward

    // Warp vertices to simulate curvature
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const dist = Math.sqrt((x - blackHole.x) ** 2 + (z - blackHole.z) ** 2);
        const curve = -10 / (dist + 1); // warping depth (stronger closer to center)
        positions.setY(i, curve);
    }
    positions.needsUpdate = true;

    return mesh;
}
