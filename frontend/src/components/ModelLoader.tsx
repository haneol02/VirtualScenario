import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';

interface ModelLoaderProps {
  filePath: string;
  fileFormat: 'glb' | 'gltf' | 'obj' | 'fbx';
  color?: string;
}

// GLB/GLTF Loader Component
function GLTFModelLoader({ filePath, color }: { filePath: string; color?: string }) {
  const { scene } = useGLTF(`http://localhost:3001${filePath}`);
  const clonedScene = scene.clone();

  // Apply color if provided
  useEffect(() => {
    if (color) {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.color = new THREE.Color(color);
          }
        }
      });
    }
  }, [color, clonedScene]);

  return <primitive object={clonedScene} />;
}

// OBJ Loader Component
function OBJModelLoader({ filePath, color }: { filePath: string; color?: string }) {
  const obj = useLoader(OBJLoader, `http://localhost:3001${filePath}`);
  const clonedObj = obj.clone();

  // Apply color if provided
  useEffect(() => {
    if (color) {
      clonedObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = new THREE.MeshStandardMaterial({ color });
        }
      });
    }
  }, [color, clonedObj]);

  return <primitive object={clonedObj} />;
}

// FBX Loader Component
function FBXModelLoader({ filePath, color }: { filePath: string; color?: string }) {
  const fbx = useLoader(FBXLoader, `http://localhost:3001${filePath}`);
  const clonedFbx = fbx.clone();

  // Apply color if provided
  useEffect(() => {
    if (color) {
      clonedFbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.color = new THREE.Color(color);
          }
        }
      });
    }
  }, [color, clonedFbx]);

  return <primitive object={clonedFbx} />;
}

// Main Model Loader Component
export default function ModelLoader({ filePath, fileFormat, color }: ModelLoaderProps) {
  switch (fileFormat) {
    case 'glb':
    case 'gltf':
      return <GLTFModelLoader filePath={filePath} color={color} />;
    case 'obj':
      return <OBJModelLoader filePath={filePath} color={color} />;
    case 'fbx':
      return <FBXModelLoader filePath={filePath} color={color} />;
    default:
      console.warn(`Unsupported file format: ${fileFormat}`);
      return null;
  }
}
