import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function createBlackHoleLensingMaterial(skyboxTexture) {
    return new THREE.ShaderMaterial({
        uniforms: {
            envMap: { value: skyboxTexture },
            blackHoleCenter: { value: new THREE.Vector3(0, 0, 0) },
            uCameraPos: { value: new THREE.Vector3() },
            strength: { value: 5.0 }, // lensing strength
            lensFalloff: { value: 20.0 }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            uniform samplerCube envMap;
            uniform vec3 blackHoleCenter;
            uniform vec3 uCameraPos;
            uniform float strength;
            uniform float lensFalloff;

            varying vec3 vWorldPosition;

            void main() {
                vec3 rayDir = normalize(vWorldPosition - uCameraPos);
                vec3 toCenter = normalize(blackHoleCenter - vWorldPosition);
                float dist = length(vWorldPosition - blackHoleCenter);

                // Falloff controls
                float influence = clamp(lensFalloff / (dist * dist + 1.0), 0.0, 1.0);

                // Distort background ray
                vec3 distortedRay = normalize(rayDir + toCenter * strength * influence);

                // Sample environment
                vec4 color = textureCube(envMap, distortedRay);

                // Optional: slightly tint red for visibility (remove later)
                // color.rgb = mix(color.rgb, vec3(1.0, 0.2, 0.2), influence * 0.3);

                // Blend edges using alpha
                float alpha = smoothstep(0.0, 0.6, influence); // smooth blending

                gl_FragColor = vec4(color.rgb, alpha);
            }
        `,
        side: THREE.BackSide,
        transparent: false,
        blending: THREE.NormalBlending,
        depthWrite: false,
    });
}
