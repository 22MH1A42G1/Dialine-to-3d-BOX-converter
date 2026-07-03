import { useMemo } from "react";
import * as THREE from "three";
import { getPanelUV, type PanelId } from "@/utils/dielineLayout";

interface PanelProps {
  id: PanelId;
  width: number;
  height: number;
  texture: THREE.Texture | null;
  // The panel's own local origin sits at its hinge edge; `offset` moves the
  // geometry so the panel extends away from the hinge.
  offset: [number, number, number];
  // Orient the plane so its face normal points outward once folded.
  rotation?: [number, number, number];
}

/**
 * A single box panel. UVs are remapped so only the panel's slice of the
 * uploaded dieline is shown.
 */
export function Panel({ id, width, height, texture, offset, rotation }: PanelProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height);
    const uv = getPanelUV(id);
    const uvs = geo.attributes.uv as THREE.BufferAttribute;
    // PlaneGeometry UV order: (0,1),(1,1),(0,0),(1,0)
    const remap = [
      [uv.u, uv.v + uv.h],
      [uv.u + uv.w, uv.v + uv.h],
      [uv.u, uv.v],
      [uv.u + uv.w, uv.v],
    ];
    for (let i = 0; i < 4; i++) uvs.setXY(i, remap[i][0], remap[i][1]);
    uvs.needsUpdate = true;
    return geo;
  }, [id, width, height]);

  return (
    <mesh geometry={geometry} position={offset} rotation={rotation}>
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? "#ffffff" : "#d9c9a3"}
        side={THREE.DoubleSide}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}
