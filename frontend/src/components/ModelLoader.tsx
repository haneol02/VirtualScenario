import { useRef, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
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

function buildAssetUrl(filePath: string) {
  // Keep absolute URLs as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
  const host = window.location.hostname || 'localhost';
  const port = 3001;
  return `${protocol}//${host}:${port}${filePath}`;
}

// Loading Fallback Component
function LoadingFallback({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <Html center position={position}>
      <div className="bg-gray-900 bg-opacity-90 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 pointer-events-none select-none whitespace-nowrap">
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
  const apiUrl = buildAssetUrl(filePath);
  const { scene } = useGLTF(apiUrl, true); // Enable Draco compression support
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
  const apiUrl = buildAssetUrl(filePath);
  const obj = useLoader(OBJLoader, apiUrl);
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
  const apiUrl = buildAssetUrl(filePath);
  const fbx = useLoader(FBXLoader, apiUrl);
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

// Error Fallback - Display default box when model fails to load
function ErrorFallback({ color = '#ff6b6b' }: { color?: string }) {
  return (
    <group>
      {/* Default fallback box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Error indicator label */}
      <Html center position={[0, 0.8, 0]} distanceFactor={10} zIndexRange={[100, 0]}>
        <div className="bg-red-900 bg-opacity-90 text-white px-3 py-1 rounded text-xs pointer-events-none select-none whitespace-nowrap">
          ⚠️ 모델 로드 실패 (기본 박스 표시)
        </div>
      </Html>
    </group>
  );
}

// ErrorBoundary for catching model loading errors
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallbackColor?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallbackColor?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Model loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback color={this.props.fallbackColor} />;
    }

    return this.props.children;
  }
}

// Main Model Loader Component with Suspense and ErrorBoundary
export default function ModelLoader({ filePath, fileFormat, color }: ModelLoaderProps) {
  return (
    <ModelErrorBoundary fallbackColor={color}>
      <Suspense fallback={<LoadingFallback />}>
        <ModelLoaderInner filePath={filePath} fileFormat={fileFormat} color={color} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// Inner loader component
function ModelLoaderInner({ filePath, fileFormat, color }: ModelLoaderProps) {
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
      // Return default box for unsupported formats
      return <ErrorFallback color={color} />;
  }
}
