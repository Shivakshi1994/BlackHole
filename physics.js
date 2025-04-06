import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0)
});

world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

let fallingBody;
let linkedMesh = null;

export function createPhysicsSphere(mesh) {
    const shape = new CANNON.Sphere(0.3);
    fallingBody = new CANNON.Body({
        mass: 0.5,
        shape: shape,
        position: new CANNON.Vec3(0, 3, 10),
        velocity: new CANNON.Vec3(0, 0, -1)
    });

    linkedMesh = mesh;
    world.addBody(fallingBody);
    return fallingBody;
}

export function updatePhysics() {
    world.step(1 / 60);

    if (fallingBody && linkedMesh) {
        const r = fallingBody.position.length();
        const dir = fallingBody.position.scale(-1).unit(); // to center
        const G = 40;
        const forceMagnitude = G / (r * r + 1e-3);
        const gravityForce = dir.scale(forceMagnitude);

        fallingBody.applyForce(gravityForce);

        // ✅ Sync physics -> mesh
        linkedMesh.position.copy(fallingBody.position);
    }
}

