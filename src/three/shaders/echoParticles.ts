export const echoParticlesVertex = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uPersonality;
uniform float uMotionStrength;
uniform float uRippleStrength;
uniform float uBloomStrength;
uniform float uPixelRatio;
uniform float uFade;
uniform float uGalleryMode;

attribute vec3 aOriginal;
attribute vec3 aColor;
attribute float aRandom;
attribute float aDepth;
attribute float aSize;
attribute float aEdgeFade;

varying vec3 vColor;
varying float vAlphaMul;

void main() {
  vec3 pos = position;

  float t = uTime;
  float breath = sin(t * 0.52 + aRandom * 6.2831853) * 0.11 * uMotionStrength;
  float ripple = sin(t * 1.1 + position.x * 0.35 + position.y * 0.28)
    * 0.09 * uRippleStrength * (0.35 + aDepth);
  float bloom = cos(t * 0.74 + aRandom * 12.9898) * 0.07 * uBloomStrength;

  pos.z += breath + ripple + bloom;

  float twist = t * (0.045 + uRippleStrength * 0.035);
  float dist = length(pos.xy) + 0.001;
  twist *= inversesqrt(dist) * 0.65;
  float c = cos(twist);
  float s = sin(twist);
  float px = pos.x * c - pos.y * s;
  float py = pos.x * s + pos.y * c;
  pos.x = px;
  pos.y = py;

  float gallery = step(0.5, uGalleryMode);
  vec2 mousePull = uMouse * (0.022 + (1.0 - gallery) * 0.018);
  pos.xy += mousePull * mix(0.55, 1.0, aDepth);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float pr = max(uPixelRatio, 1.0);
  float baseSize = mix(2.1, 3.35, gallery) * aSize;
  float perspectiveScale = 140.0 / max(-mvPosition.z, 0.12);
  gl_PointSize = baseSize * pr * perspectiveScale;
  gl_PointSize = clamp(gl_PointSize, 2.75, mix(64.0, 84.0, gallery));

  vColor = aColor * uFade;
  vAlphaMul = aEdgeFade * mix(0.92, 1.0, aDepth);
}
`;

export const echoParticlesFragment = /* glsl */ `
uniform float uGalleryMode;
varying vec3 vColor;
varying float vAlphaMul;

void main() {
  vec2 pc = gl_PointCoord - vec2(0.5);
  float r = length(pc);
  float gallery = step(0.5, uGalleryMode);

  float soft = mix(
    smoothstep(0.52, 0.08, r),
    1.0 - smoothstep(0.42, 0.5, r),
    gallery
  );

  float alpha = soft * vAlphaMul;
  if (alpha < 0.0008) discard;

  vec3 rgb = vColor * mix(1.15, 1.0, gallery);
  gl_FragColor = vec4(rgb, alpha);
}
`;
