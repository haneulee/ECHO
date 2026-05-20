/**
 * Sharp circular particles — mask from gl_PointCoord (no soft sprite texture).
 */
export const icosphereFragmentShader = /* glsl */ `
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uBrightness;
uniform float uAudioLevel;
uniform float uAudioHigh;
uniform float uNotePulse;
uniform float uNoteHue;

varying float vNoise;
varying vec3 vPos;
varying float vHue;

void main() {
  vec2 qc = gl_PointCoord - vec2(0.5);
  float rd = length(qc) * 2.0;
  if (rd > 1.0) discard;

  float n = clamp(0.5 + 0.5 * vNoise, 0.0, 1.0);

  float hueDist = abs(vHue - uNoteHue);
  hueDist = min(hueDist, 1.0 - hueDist);
  float noteRegion = 1.0 - smoothstep(0.04, 0.34, hueDist);
  float along = clamp(
    vHue + 0.06 * vNoise + uAudioHigh * 0.035 + noteRegion * uNotePulse * 0.055,
    0.0,
    1.0
  );
  vec3 base = mix(uColA, uColB, along);

  float veil = smoothstep(0.15, 0.92, length(vPos.xz) * 0.31 + n * 0.22);
  vec3 lift = mix(uColB, uColA, 0.38);
  vec3 col = mix(base, lift, veil * (0.24 + uAudioLevel * 0.1));

  float breathe = 0.035 * sin(length(vPos) * 2.1 + vNoise * 3.5);
  col *= 1.0 + breathe + uAudioLevel * 0.06 + noteRegion * uNotePulse * 0.1;

  col *= uBrightness;

  gl_FragColor = vec4(col, uBrightness * (0.9 + uAudioLevel * 0.08));
}
`;
