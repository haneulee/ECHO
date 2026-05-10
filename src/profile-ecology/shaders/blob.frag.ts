export const blobFragmentShader = /* glsl */ `
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uBrightness;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vAlong;
varying float vNoise;

void main() {
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.35, 0.82, 0.42));
  float diff = max(dot(n, lightDir), 0.0);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.4);

  float along = clamp(vAlong + 0.07 * vNoise, 0.0, 1.0);
  vec3 base = mix(uColA, uColB, along);
  vec3 col = base * (0.38 + 0.62 * diff) + rim * mix(uColB, uColA, 0.35) * 0.22;

  col *= uBrightness;
  gl_FragColor = vec4(col, 0.94);
}
`;
