import { useRef, useEffect, Suspense } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';

interface ModelLoaderProps {
  filePath: string;
  fileFormat: 'glb' | 'gltf' | 'obj' | 'fbx';
  color?: string;
}

// Loading Fallback Component
function LoadingFallback({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <Html center position={position}>
      <div className="bg-gray-900 bg-opacity-90 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 pointer-events-none select-none">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <div>
          <div className="font-semibold">모델 로딩 중...</div>
          <div className="text-xs text-gray-400">대용량 파일은 시간이 걸릴 수 있습니다</div>
        </div>
      </div>
    </Html>
  );
}

// GLB/GLTF Loader Component
function GLTFModelLoader({ filePath, color }: { filePath: string; color?: string }) {
  const { scene } = useGLTF(`http://localhost:3001${filePath}`, true); // Enable Draco compression support
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

// Error Fallback Component
function ErrorFallback({ error, position = [0, 0, 0] }: { error: Error; position?: [number, number, number] }) {
  return (
    <Html center position={position}>
      <div className="bg-red-900 bg-opacity-90 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md pointer-events-none select-none">
        <div className="font-semibold mb-2">⚠️ 모델 로딩 실패</div>
        <div className="text-xs text-gray-300">{error.message}</div>
        <div className="text-xs text-gray-400 mt-2">파일 경로나 포맷을 확인하세요</div>
      </div>
    </Html>
  );
}

// Main Model Loader Component with Suspense
export default function ModelLoader({ filePath, fileFormat, color }: ModelLoaderProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ModelLoaderInner filePath={filePath} fileFormat={fileFormat} color={color} />
    </Suspense>
  );
}

// Inner loader component
function ModelLoaderInner({ filePath, fileFormat, color }: ModelLoaderProps) {
  try {
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
  } catch (error) {
    console.error('Model loading error:', error);
    return <ErrorFallback error={error as Error} />;
  }
}
