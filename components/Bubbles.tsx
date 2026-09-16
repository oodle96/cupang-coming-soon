"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Rising bubbles drifting up through the water column. */
export default function Bubbles({ count = 160 }: { count?: number }) {
  const points = useRef<THREE.Points>(null!);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const geo = points.current.geometry;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
      // slight horizontal wobble
      arr[i * 3] += Math.sin(performance.now() * 0.001 + i) * delta * 0.05;
      if (arr[i * 3 + 1] > 3.5) arr[i * 3 + 1] = -3.5;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#e7a9b2"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
