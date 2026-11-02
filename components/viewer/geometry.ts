import * as THREE from "three";

/** A closed vine that wraps the band, weaving front-to-back as it goes round. */
export class VineCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private amplitude: number,
    private waves: number,
    private phase: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    const r = this.radius + 0.018 * Math.cos(this.waves * a + this.phase);
    return target.set(
      r * Math.cos(a),
      r * Math.sin(a),
      this.amplitude * Math.sin(this.waves * a + this.phase),
    );
  }

  /** Angle around the band of the curve parameter t. */
  static angle(t: number) {
    return t * Math.PI * 2;
  }
}

/**
 * Matrix that sits an object on a surface point: local +Y along `normal`,
 * local +X along `tangent` (made orthogonal), optionally spun around the normal.
 */
export function surfaceMatrix(
  position: THREE.Vector3,
  normal: THREE.Vector3,
  tangent: THREE.Vector3,
  spin = 0,
  scale = 1,
) {
  const y = normal.clone().normalize();
  const x = tangent.clone().sub(y.clone().multiplyScalar(tangent.dot(y))).normalize();
  if (spin) x.applyAxisAngle(y, spin);
  const z = new THREE.Vector3().crossVectors(x, y);
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  m.scale(new THREE.Vector3(scale, scale, scale));
  m.setPosition(position);
  return m;
}
