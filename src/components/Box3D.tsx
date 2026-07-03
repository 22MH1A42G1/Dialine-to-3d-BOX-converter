import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Panel } from "./Panel";

interface Box3DProps {
  size: { w: number; h: number; d: number };
  texture: THREE.Texture | null;
  // 0 = flat, 1 = fully folded.
  fold: number;
}

/**
 * Foldable box built from six panels connected by hinge groups.
 *
 * The FRONT panel is the base and stays in the XY plane. Every other panel
 * sits inside a THREE.Group whose position is the hinge line. Rotating the
 * group rotates the panel around that hinge — real parent/child pivot
 * behavior, no scaling tricks.
 *
 *   front (base)
 *     ├── top    hinge at y=+h/2, rotate around X  →  -90°
 *     ├── bottom hinge at y=-h/2, rotate around X  →  +90°
 *     ├── left   hinge at x=-w/2, rotate around Y  →  +90°
 *     └── right  hinge at x=+w/2, rotate around Y  →  -90°
 *              └── back hinge at x=+w/2 (of right), rotate around Y → -90°
 */
export function Box3D({ size, texture, fold }: Box3DProps) {
  const { w, h, d } = size;

  const topRef = useRef<THREE.Group>(null);
  const bottomRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const backRef = useRef<THREE.Group>(null);

  // Smoothly ease toward target fold angle each frame.
  const target = useRef(fold);
  useEffect(() => {
    target.current = fold;
  }, [fold]);

  const current = useRef(fold);
  useFrame((_, dt) => {
    current.current += (target.current - current.current) * Math.min(1, dt * 4);
    const t = current.current;
    const quarter = Math.PI / 2;

    if (topRef.current) topRef.current.rotation.x = quarter * t;
    if (bottomRef.current) bottomRef.current.rotation.x = -quarter * t;
    if (leftRef.current) leftRef.current.rotation.y = quarter * t;
    if (rightRef.current) rightRef.current.rotation.y = -quarter * t;
    if (backRef.current) backRef.current.rotation.y = -quarter * t;
  });

  return (
    <group>
      {/* FRONT — the base panel. Its center is at the origin. */}
      <Panel id="front" width={w} height={h} texture={texture} offset={[0, 0, 0]} />

      {/* TOP — hinge along the top edge of front */}
      <group ref={topRef} position={[0, h / 2, 0]}>
        <Panel id="top" width={w} height={d} texture={texture} offset={[0, d / 2, 0]} />
      </group>

      {/* BOTTOM */}
      <group ref={bottomRef} position={[0, -h / 2, 0]}>
        <Panel id="bottom" width={w} height={d} texture={texture} offset={[0, -d / 2, 0]} />
      </group>

      {/* LEFT */}
      <group ref={leftRef} position={[-w / 2, 0, 0]}>
        <Panel id="left" width={d} height={h} texture={texture} offset={[-d / 2, 0, 0]} />
      </group>

      {/* RIGHT — carries BACK as a nested hinge */}
      <group ref={rightRef} position={[w / 2, 0, 0]}>
        <Panel id="right" width={d} height={h} texture={texture} offset={[d / 2, 0, 0]} />
        {/* BACK hinges at the far edge of RIGHT (local x = d) */}
        <group ref={backRef} position={[d, 0, 0]}>
          <Panel id="back" width={w} height={h} texture={texture} offset={[w / 2, 0, 0]} />
        </group>
      </group>
    </group>
  );
}
