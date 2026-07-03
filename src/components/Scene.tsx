import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Box3D } from "./Box3D";

interface SceneProps {
  texture: THREE.Texture | null;
  fold: number;
  size: { w: number; h: number; d: number };
}

export function Scene({ texture, fold, size }: SceneProps) {
  return (
    <Canvas camera={{ position: [4, 4, 6], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={["#111318"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} />
      <Grid
        args={[20, 20]}
        position={[0, -3, 0]}
        cellColor="#333"
        sectionColor="#555"
        fadeDistance={25}
        infiniteGrid
      />
      <Box3D size={size} texture={texture} fold={fold} />
      <OrbitControls enableDamping makeDefault />
    </Canvas>
  );
}
