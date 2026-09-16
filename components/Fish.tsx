"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

const MODEL_URL = "/models/cupang-swim.glb";

// Roaming area in world units (+y up). Wide, so it wanders far and natural.
const DEFAULT_AREA = { x: [-2.9, 2.9], y: [-1.7, 1.6] } as const;

const randRange = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * A single betta roaming freely and calmly, like the reference homepage hero:
 *  - the baked "CUPANG_Natural_Swim" clip drives the body, with the
 *    "Reference_Procedural_Swim" wave layered on top;
 *  - it picks random destinations across a wide area, cruises there at a slow,
 *    slightly varying pace, sometimes hovers to rest, and tilts to climb/dive;
 *  - whenever a destination is on its other side it plays the real
 *    "Turn_Left"/"Turn_Right" clip, whose baked root rotation is transferred
 *    onto the travel group so the new heading survives the blend back to swim.
 */
export default function Fish({
  area = DEFAULT_AREA,
  speed = 0.3,
  scale = 1.0,
}: {
  area?: { x: readonly [number, number]; y: readonly [number, number] };
  /** Base cruise speed in world units/second (low = chill). */
  speed?: number;
  scale?: number;
}) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const group = useRef<THREE.Group>(null!);

  // Build the mixer, actions and turn clips once per clone.
  const rig = useMemo(() => {
    // Center the model so it rotates about its own middle.
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = false;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (mat) {
            mat.roughness = Math.max(mat.roughness ?? 0.5, 0.45);
            mat.metalness = Math.min(mat.metalness ?? 0, 0.18);
            mat.side = THREE.DoubleSide;
          }
        });
      }
    });

    const mixer = new THREE.AnimationMixer(cloned);

    // Normalise clips to start at t=0.
    const clips = animations.map((c) => c.clone());
    for (const clip of clips) {
      const start = Math.min(...clip.tracks.map((t) => t.times[0]));
      if (start > 0) for (const t of clip.tracks) t.shift(-start);
      clip.resetDuration();
    }

    const swim = clips.find((c) => c.name === "CUPANG_Natural_Swim_4s")!;
    const swimAction = mixer.clipAction(swim).play();

    const wave = clips.find((c) => c.name === "Reference_Procedural_Swim_2s");
    if (wave) mixer.clipAction(wave).setEffectiveWeight(0.5).play();

    // Split the turn clips: body (no root) + root rotation interpolant.
    const turnClips: Record<
      string,
      { body: THREE.AnimationClip; root: THREE.Interpolant; duration: number }
    > = {};
    for (const clip of clips.filter((c) => c.name.startsWith("Turn_"))) {
      const rootTrack = clip.tracks.find(
        (t) => t.name.includes("Swim_Rig") && t.name.endsWith(".quaternion")
      );
      const body = clip.clone();
      if (rootTrack) {
        body.tracks = body.tracks.filter((t) => t.name !== rootTrack.name);
        turnClips[clip.name] = {
          body,
          root: rootTrack.createInterpolant(),
          duration: clip.duration,
        };
      }
    }

    return { mixer, swimAction, turnClips };
  }, [cloned, animations]);

  // Mutable swim state. Start at top-right, aiming left so it eases off calmly.
  const st = useRef({
    pos: new THREE.Vector3(area.x[1], area.y[1] * 0.7, 0),
    target: new THREE.Vector2(area.x[0], randRange(area.y[0], area.y[1])),
    baseYaw: -Math.PI / 2, // facing left
    facing: -1 as 1 | -1,
    legSpeed: speed,
    pause: 0,
    pitch: 0,
    phase: Math.random() * 10,
    turn: null as null | {
      action: THREE.AnimationAction;
      clip: { root: THREE.Interpolant; duration: number };
      direction: 1 | -1;
      startYaw: number;
    },
  });

  // Pick a new random destination that is a meaningful distance away.
  const pickTarget = () => {
    const s = st.current;
    let nx = s.pos.x;
    let ny = s.pos.y;
    for (let i = 0; i < 14; i++) {
      nx = randRange(area.x[0], area.x[1]);
      ny = randRange(area.y[0], area.y[1]);
      if (Math.hypot(nx - s.pos.x, ny - s.pos.y) > 1.6) break;
    }
    s.target.set(nx, ny);
    s.legSpeed = speed * randRange(0.6, 1.25); // vary the pace per leg
  };

  const beginTurn = (direction: 1 | -1) => {
    const clip =
      rig.turnClips[direction > 0 ? "Turn_Left_3s" : "Turn_Right_3s"];
    if (!clip) return;
    const action = rig.mixer.clipAction(clip.body);
    action.reset().setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
    rig.swimAction.fadeOut(0.2);
    st.current.turn = { action, clip, direction, startYaw: st.current.baseYaw };
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = st.current;
    s.phase += dt;

    const dx = s.target.x - s.pos.x;
    const dy = s.target.y - s.pos.y;

    let yaw = s.baseYaw;
    let targetPitch = 0;

    if (s.turn) {
      // Play the baked turn clip and lift its root rotation onto the group.
      rig.mixer.update(dt);
      const t = s.turn;
      const q = t.clip.root.evaluate(
        Math.min(t.action.time, t.clip.duration)
      ) as unknown as Float32Array;
      yaw = t.startYaw + 2 * Math.atan2(q[1], q[3]);
      if (t.action.time >= t.clip.duration - 1e-4) {
        s.baseYaw = t.startYaw + (t.direction > 0 ? Math.PI : -Math.PI);
        yaw = s.baseYaw;
        s.facing = t.direction;
        t.action.fadeOut(0.22);
        rig.swimAction.reset().setEffectiveWeight(1).fadeIn(0.22).play();
        s.turn = null;
      }
    } else if (s.pause > 0) {
      // Resting: hover in place, tail idling slowly.
      s.pause -= dt;
      rig.swimAction.setEffectiveTimeScale(0.55);
      rig.mixer.update(dt);
    } else {
      // Turn first if the destination is on the other side.
      if (Math.abs(dx) > 0.2 && Math.sign(dx) !== s.facing) {
        beginTurn(Math.sign(dx) as 1 | -1);
      } else {
        rig.swimAction.setEffectiveTimeScale(0.7 + (s.legSpeed / speed) * 0.15);
        rig.mixer.update(dt);

        const dist = Math.hypot(dx, dy);
        if (dist < 0.3) {
          // Arrived — sometimes rest a while, then choose a new spot.
          s.pause = Math.random() < 0.6 ? randRange(0.8, 3.2) : 0;
          pickTarget();
        } else {
          const step = Math.min(s.legSpeed * dt, dist);
          s.pos.x += (dx / dist) * step;
          s.pos.y += (dy / dist) * step;
          // Tilt to climb/dive with the vertical direction of travel.
          targetPitch = s.facing * (dy / dist) * 0.22;
        }
      }
    }

    // Ease the pitch so climbs/dives feel smooth.
    s.pitch += (targetPitch - s.pitch) * (1 - Math.exp(-dt * 3));

    if (group.current) {
      // Gentle vertical bob layered on the roam.
      group.current.position.set(
        s.pos.x,
        s.pos.y + Math.sin(s.phase * 0.6) * 0.07,
        0
      );
      group.current.rotation.y = yaw;
      group.current.rotation.z = s.pitch + Math.sin(s.phase * 0.45) * 0.04;
    }
  });

  return <primitive ref={group} object={cloned} scale={scale} dispose={null} />;
}

useGLTF.preload(MODEL_URL);
