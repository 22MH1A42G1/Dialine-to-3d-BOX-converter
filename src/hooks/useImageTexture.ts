import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Loads a data URL into a THREE.Texture. Returns null while loading or when
 * no URL is provided. Disposes the previous texture on change to avoid GPU
 * leaks.
 */
export function useImageTexture(dataUrl: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(dataUrl, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}
