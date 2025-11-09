import { PathKeyframe } from '../lib/api';
import * as THREE from 'three';

/**
 * Linear interpolation (Lerp) for position
 */
export function lerpPosition(
  pos1: [number, number, number],
  pos2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    pos1[0] + (pos2[0] - pos1[0]) * t,
    pos1[1] + (pos2[1] - pos1[1]) * t,
    pos1[2] + (pos2[2] - pos1[2]) * t,
  ];
}

/**
 * Spherical linear interpolation (Slerp) for rotation
 * Converts degrees to quaternions, slerps, and converts back
 */
export function slerpRotation(
  rot1: [number, number, number],
  rot2: [number, number, number],
  t: number
): [number, number, number] {
  // Convert degrees to radians
  const euler1 = new THREE.Euler(
    THREE.MathUtils.degToRad(rot1[0]),
    THREE.MathUtils.degToRad(rot1[1]),
    THREE.MathUtils.degToRad(rot1[2])
  );
  const euler2 = new THREE.Euler(
    THREE.MathUtils.degToRad(rot2[0]),
    THREE.MathUtils.degToRad(rot2[1]),
    THREE.MathUtils.degToRad(rot2[2])
  );

  // Convert to quaternions
  const quat1 = new THREE.Quaternion().setFromEuler(euler1);
  const quat2 = new THREE.Quaternion().setFromEuler(euler2);

  // Slerp
  const quatResult = new THREE.Quaternion().slerpQuaternions(quat1, quat2, t);

  // Convert back to euler angles (degrees)
  const eulerResult = new THREE.Euler().setFromQuaternion(quatResult);
  return [
    THREE.MathUtils.radToDeg(eulerResult.x),
    THREE.MathUtils.radToDeg(eulerResult.y),
    THREE.MathUtils.radToDeg(eulerResult.z),
  ];
}

/**
 * Get interpolated transform at a given time
 */
export function getTransformAtTime(
  keyframes: PathKeyframe[],
  time: number,
  defaultPosition: [number, number, number],
  defaultRotation: [number, number, number],
  defaultScale?: [number, number, number]
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
} {
  const fallbackScale: [number, number, number] = defaultScale || [1, 1, 1];

  if (keyframes.length === 0) {
    return { position: defaultPosition, rotation: defaultRotation, scale: fallbackScale };
  }

  // Sort keyframes by time (should already be sorted, but just in case)
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) {
    return {
      position: sorted[0].position,
      rotation: sorted[0].rotation,
      scale: sorted[0].scale || fallbackScale,
    };
  }

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    const lastKf = sorted[sorted.length - 1];
    return {
      position: lastKf.position,
      rotation: lastKf.rotation,
      scale: lastKf.scale || fallbackScale,
    };
  }

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const kf1 = sorted[i];
    const kf2 = sorted[i + 1];

    if (time >= kf1.time && time <= kf2.time) {
      // Calculate interpolation factor
      const t = (time - kf1.time) / (kf2.time - kf1.time);

      const scale1 = kf1.scale || fallbackScale;
      const scale2 = kf2.scale || fallbackScale;

      return {
        position: lerpPosition(kf1.position, kf2.position, t),
        rotation: slerpRotation(kf1.rotation, kf2.rotation, t),
        scale: lerpPosition(scale1, scale2, t),
      };
    }
  }

  // Fallback (should not reach here)
  return { position: defaultPosition, rotation: defaultRotation, scale: fallbackScale };
}
