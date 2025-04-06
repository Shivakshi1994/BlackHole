import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function createEinsteinRingMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uCameraPos: { value: new THREE.Vector3() },
            uBlackHoleCenter: { value: new THREE.Vector3(0, 0, 0) },
            ringRadius: { value: 1.5 },      // Schwarzschild radius
            ringWidth: { value: 0.15 },      // Thickness of ring
            ringIntensity: { value: 2.0 }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uCameraPos;
            uniform vec3 uBlackHoleCenter;
            uniform float ringRadius;
            uniform float ringWidth;
            uniform float ringIntensity;

            varying vec3 vWorldPosition;

            void main() {
                vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
                vec3 fragToCenter = normalize(uBlackHoleCenter - vWorldPosition);

                float cosAngle = dot(camToFrag, fragToCenter);
                float angle = acos(clamp(cosAngle, -1.0, 1.0));

                float intensity = ringIntensity * exp(-pow((angle - ringRadius) / ringWidth, 2.0));

                gl_FragColor = vec4(vec3(intensity), intensity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
}
