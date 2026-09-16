"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Fish from "./Fish";
import Bubbles from "./Bubbles";

export default function FishTank() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 34 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Bright studio lighting for the light theme (mirrors the reference). */}
      <hemisphereLight args={["#ffffff", "#9f4655", 2.4]} />
      <directionalLight position={[-3, 4, 5]} intensity={2.6} color="#fff4f3" />
      <directionalLight position={[4, 1, 3]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[1, 2, -3]} intensity={1.4} color="#ffb7c2" />

      <Suspense fallback={null}>
        {/* A single betta roaming a slow, random, wide path across the screen. */}
        <Fish speed={0.3} scale={0.95} />
        <Environment preset="city" environmentIntensity={0.6} />
      </Suspense>

      <Bubbles count={70} />
    </Canvas>
  );
}
