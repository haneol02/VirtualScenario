import { useRef, useState, useEffect, forwardRef, useImperativeHandle, Suspense } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, TransformControls, Html, Text } from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';
import * as THREE from 'three';
import { SceneObject, BackgroundObject, Asset } from '../lib/api';
import ModelLoader from './ModelLoader';

export interface ThreeViewerHandle {
  getObjectTransform: (objectId: string) => {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    visible: number;
    show_nametag: number;
  } | null;
}

interface ThreeViewerProps {
  objects: (SceneObject | BackgroundObject)[];
  selectedObjectId?: string;
  backgroundType?: string;
  assets?: Asset[];  // Asset library for model file paths
  currentTime?: number;  // Current playback time for animation
  isPlaying?: boolean;  // Is timeline playing
  gridSize?: { width: number; depth: number };  // Custom grid size
  backgroundObjectIds?: string[];  // IDs of background objects (non-draggable)
  onObjectSelect?: (objectId: string) => void;
  onObjectTransform?: (objectId: string, transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

type TransformMode = 'translate' | 'rotate' | 'scale';

// 프리미티브 지오메트리 렌더링
function PrimitiveGeometry({ modelId }: { modelId?: string }) {
  if (!modelId || !modelId.startsWith('primitive_')) {
    return <boxGeometry args={[1, 1, 1]} />;
  }

  const geometry = modelId.replace('primitive_', '');

  switch (geometry) {
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />;
    case 'sphere':
      return <sphereGeometry args={[0.5, 32, 32]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'cone':
      return <coneGeometry args={[0.5, 1, 32]} />;
    case 'plane':
      return <planeGeometry args={[1, 1]} />;
    case 'torus':
      return <torusGeometry args={[0.4, 0.15, 16, 32]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}

// 조명 오브젝트 렌더링 컴포넌트
function LightObject({
  obj,
  isSelected,
  onSelect,
  transformMode,
  onTransformEnd,
  asset,
  isPlaying,
  onLightCreated,
  isBackgroundObject
}: {
  obj: SceneObject | BackgroundObject;
  isSelected: boolean;
  onSelect: () => void;
  asset?: Asset;
  transformMode: TransformMode;
  onTransformEnd?: (transform: any) => void;
  isPlaying?: boolean;
  onLightCreated?: (objectId: string, light: THREE.Light) => void;
  isBackgroundObject?: boolean;
}) {
  const lightRef = useRef<THREE.Light>(null);
  const transformRef = useRef<any>(null);

  // Get light metadata from asset
  const metadata = asset?.metadata ? (typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata) : {};
  const lightType = metadata.lightType || 'point';
  const intensity = metadata.intensity || 1.0;
  const distance = metadata.distance || 10;
  const angle = metadata.angle || 0.5;

  // Register light ref to parent
  useEffect(() => {
    if (lightRef.current && onLightCreated) {
      onLightCreated(obj.id, lightRef.current);
    }
  }, [obj.id, onLightCreated]);

  // Update intensity when metadata changes
  useEffect(() => {
    if (lightRef.current && 'intensity' in lightRef.current && asset) {
      // Re-parse metadata to get updated intensity
      const metadata = asset.metadata
        ? (typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata)
        : {};
      const newIntensity = metadata.intensity !== undefined ? metadata.intensity : 1.0;
      (lightRef.current as any).intensity = newIntensity;
    }
  }, [asset]);

  // Transform handling
  const handleTransform = () => {
    if (!lightRef.current || !transformRef.current) return;

    const position = lightRef.current.position;
    const rotation = lightRef.current.rotation;

    const transform = {
      position: position.toArray() as [number, number, number],
      rotation: [
        (rotation.x * 180) / Math.PI,
        (rotation.y * 180) / Math.PI,
        (rotation.z * 180) / Math.PI,
      ] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    };

    onTransformEnd?.(transform);
  };

  const position: [number, number, number] = [obj.position_x, obj.position_y, obj.position_z];
  const rotation: [number, number, number] = [
    (obj.rotation_x * Math.PI) / 180,
    (obj.rotation_y * Math.PI) / 180,
    (obj.rotation_z * Math.PI) / 180,
  ];
  const color = obj.color || '#ffffff';

  // Render different light types
  const renderLight = () => {
    switch (lightType) {
      case 'directional':
        return (
          <directionalLight
            ref={lightRef}
            position={position}
            rotation={rotation}
            intensity={intensity}
            color={color}
            castShadow
          />
        );
      case 'point':
        return (
          <pointLight
            ref={lightRef}
            position={position}
            intensity={intensity}
            color={color}
            distance={distance}
            castShadow
          />
        );
      case 'spot':
        return (
          <spotLight
            ref={lightRef}
            position={position}
            rotation={rotation}
            intensity={intensity}
            color={color}
            angle={angle}
            distance={distance}
            castShadow
          />
        );
      case 'ambient':
        return (
          <ambientLight
            ref={lightRef}
            intensity={intensity}
            color={color}
          />
        );
      default:
        return (
          <pointLight
            ref={lightRef}
            position={position}
            intensity={intensity}
            color={color}
          />
        );
    }
  };

  return (
    <group>
      {renderLight()}

      {/* Helper mesh to visualize light position (only when selected) */}
      {lightType !== 'ambient' && isSelected && (
        <mesh position={position}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffff00" wireframe />
        </mesh>
      )}

      {/* Invisible clickable area for light selection */}
      {lightType !== 'ambient' && (
        <mesh position={position} onClick={(e) => {
          e.stopPropagation();
          // Prevent selection during playback
          if (isPlaying) {
            return;
          }
          onSelect();
        }}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Nametag */}
      {obj.show_nametag === 1 && lightType !== 'ambient' && (
        <Html
          position={[position[0], position[1] + 0.5, position[2]]}
          center
          distanceFactor={10}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {obj.name} 💡
          </div>
        </Html>
      )}

      {/* TransformControls for selected light (only translate mode) - 배경 오브젝트는 드래그 불가 */}
      {isSelected && lightType !== 'ambient' && !isPlaying && !isBackgroundObject && lightRef.current && (
        <TransformControls
          ref={transformRef}
          object={lightRef.current}
          mode="translate"
          onObjectChange={handleTransform}
        />
      )}
    </group>
  );
}

// 오브젝트 렌더링 컴포넌트
function SceneObjectMesh({
  obj,
  isSelected,
  onSelect,
  transformMode,
  onTransformEnd,
  asset,
  currentTime,
  isPlaying,
  onMeshCreated,
  isBackgroundObject
}: {
  obj: SceneObject | BackgroundObject;
  isSelected: boolean;
  onSelect: () => void;
  asset?: Asset;
  transformMode: TransformMode;
  onTransformEnd?: (transform: any) => void;
  currentTime?: number;
  isPlaying?: boolean;
  onMeshCreated?: (objectId: string, mesh: THREE.Mesh) => void;
  isBackgroundObject?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<any>(null);

  // Track show_nametag from keyframe or DB
  const [currentShowNametag, setCurrentShowNametag] = useState<number>(obj.show_nametag ?? 1);

  // Register mesh ref to parent
  useEffect(() => {
    if (meshRef.current && onMeshCreated) {
      onMeshCreated(obj.id, meshRef.current);
    }
  }, [obj.id, onMeshCreated]);

  // Apply keyframe values or DB values based on currentTime
  useEffect(() => {
    if (!meshRef.current) return;

    // If currentTime is undefined (e.g., BackgroundMapEditor), always use DB values
    if (currentTime === undefined) {
      const dbVisible = ('visible' in obj && obj.visible !== undefined) ? obj.visible : 1;
      const dbNametag = obj.show_nametag ?? 1;

      meshRef.current.visible = dbVisible !== 0;
      setCurrentShowNametag(dbNametag);
      return;
    }

    // Check if object has keyframes
    if ('path_data' in obj && obj.path_data) {
      try {
        const keyframes = JSON.parse(obj.path_data);
        if (keyframes && keyframes.length > 0) {
          // HAS KEYFRAMES: Use currentTime to determine values

          // Find surrounding keyframes
          let prevKeyframe = keyframes[0];
          let nextKeyframe = keyframes[keyframes.length - 1];

          for (let i = 0; i < keyframes.length - 1; i++) {
            if (keyframes[i].time <= currentTime && keyframes[i + 1].time >= currentTime) {
              prevKeyframe = keyframes[i];
              nextKeyframe = keyframes[i + 1];
              break;
            }
          }

          // If before first keyframe or after last keyframe, use that keyframe
          if (currentTime <= keyframes[0].time) {
            prevKeyframe = nextKeyframe = keyframes[0];
          } else if (currentTime >= keyframes[keyframes.length - 1].time) {
            prevKeyframe = nextKeyframe = keyframes[keyframes.length - 1];
          }

          // Linear interpolation (lerp) for position and rotation
          const t = prevKeyframe === nextKeyframe ? 0 :
            (currentTime - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);

          // Interpolate position
          if (prevKeyframe.position && nextKeyframe.position) {
            meshRef.current.position.set(
              THREE.MathUtils.lerp(prevKeyframe.position[0], nextKeyframe.position[0], t),
              THREE.MathUtils.lerp(prevKeyframe.position[1], nextKeyframe.position[1], t),
              THREE.MathUtils.lerp(prevKeyframe.position[2], nextKeyframe.position[2], t)
            );
          }

          // Interpolate rotation (in radians)
          if (prevKeyframe.rotation && nextKeyframe.rotation) {
            const prevEuler = new THREE.Euler(
              (prevKeyframe.rotation[0] * Math.PI) / 180,
              (prevKeyframe.rotation[1] * Math.PI) / 180,
              (prevKeyframe.rotation[2] * Math.PI) / 180
            );
            const nextEuler = new THREE.Euler(
              (nextKeyframe.rotation[0] * Math.PI) / 180,
              (nextKeyframe.rotation[1] * Math.PI) / 180,
              (nextKeyframe.rotation[2] * Math.PI) / 180
            );

            // Spherical linear interpolation for rotation
            const prevQuat = new THREE.Quaternion().setFromEuler(prevEuler);
            const nextQuat = new THREE.Quaternion().setFromEuler(nextEuler);
            const resultQuat = new THREE.Quaternion().slerpQuaternions(prevQuat, nextQuat, t);

            meshRef.current.rotation.setFromQuaternion(resultQuat);
          }

          // Interpolate scale
          const prevScale = prevKeyframe.scale ?? [1, 1, 1];
          const nextScale = nextKeyframe.scale ?? [1, 1, 1];

          meshRef.current.scale.set(
            THREE.MathUtils.lerp(prevScale[0], nextScale[0], t),
            THREE.MathUtils.lerp(prevScale[1], nextScale[1], t),
            THREE.MathUtils.lerp(prevScale[2], nextScale[2], t)
          );

          // Apply visible and show_nametag (no interpolation, discrete values)
          // Use prevKeyframe values with fallback to DB
          const visibleValue = prevKeyframe.visible !== undefined ? prevKeyframe.visible :
            (('visible' in obj && obj.visible !== undefined) ? obj.visible : 1);
          const nametagValue = prevKeyframe.show_nametag !== undefined ? prevKeyframe.show_nametag :
            (obj.show_nametag ?? 1);

          meshRef.current.visible = visibleValue === 1;
          setCurrentShowNametag(nametagValue);

          return; // Exit early, we used keyframes
        }
      } catch (e) {
        console.error('Failed to parse keyframes:', e);
      }
    }

    // NO KEYFRAMES: Use DB values
    const dbVisible = ('visible' in obj && obj.visible !== undefined) ? obj.visible : 1;
    const dbNametag = obj.show_nametag ?? 1;

    meshRef.current.visible = dbVisible !== 0;
    setCurrentShowNametag(dbNametag);
  }, [currentTime, obj]);

  // 색상 결정 (color 필드 우선, 없으면 타입별 기본 색상)
  const getColor = () => {
    if ('color' in obj && obj.color) {
      return obj.color;
    }

    switch (obj.type) {
      case 'person': return '#4f46e5'; // indigo
      case 'train': return '#dc2626'; // red
      case 'facility': return '#059669'; // emerald
      case 'sign': return '#d97706'; // amber
      case 'primitive': return '#6b7280'; // gray
      default: return '#6b7280'; // gray
    }
  };

  const color = getColor();

  // Check asset types
  const is3DModel = asset?.type === 'model' && asset.file_path && asset.file_format;
  const isImage = asset?.type === 'image' && asset.file_path;
  const isText = asset?.type === 'text' && asset.text_content;

  // Get initial transform (use first keyframe if exists, otherwise DB values)
  const getInitialTransform = () => {
    if ('path_data' in obj && obj.path_data) {
      try {
        const keyframes = JSON.parse(obj.path_data);
        if (keyframes && keyframes.length > 0) {
          const firstKeyframe = keyframes[0];
          return {
            position: firstKeyframe.position ?? [obj.position_x, obj.position_y, obj.position_z],
            rotation: firstKeyframe.rotation ?? [obj.rotation_x, obj.rotation_y, obj.rotation_z],
            scale: firstKeyframe.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z]
          };
        }
      } catch (e) {
        console.error('Failed to parse path_data for initial transform:', e);
      }
    }

    // Fallback to DB values
    return {
      position: [obj.position_x, obj.position_y, obj.position_z],
      rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
      scale: [obj.scale_x, obj.scale_y, obj.scale_z]
    };
  };

  const initialTransform = getInitialTransform();

  return (
    <>
      {is3DModel ? (
        // Render 3D Model
        <group
          ref={meshRef as any}
          position={initialTransform.position as [number, number, number]}
          rotation={[
            (initialTransform.rotation[0] * Math.PI) / 180,
            (initialTransform.rotation[1] * Math.PI) / 180,
            (initialTransform.rotation[2] * Math.PI) / 180,
          ]}
          scale={initialTransform.scale as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation();
            // Prevent selection during playback
            if (isPlaying) {
              return;
            }
            // Prevent selection if object is locked
            if ('locked' in obj && obj.locked === 1) {
              return;
            }
            onSelect();
          }}
        >
          <ModelLoader
            filePath={asset.file_path!}
            fileFormat={asset.file_format as 'glb' | 'gltf' | 'obj' | 'fbx'}
            color={color}
          />

          {/* Nametag */}
          {currentShowNametag === 1 && (
            <Html
              position={[0, 'scale_y' in obj ? obj.scale_y * 0.7 : 1, 0]}
              center
              distanceFactor={10}
              zIndexRange={[100, 0]}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {obj.name}
              </div>
            </Html>
          )}
        </group>
      ) : isImage ? (
        // Render Image with error handling
        <Suspense fallback={<ImageFallback meshRef={meshRef} initialTransform={initialTransform} obj={obj} />}>
          <ErrorBoundary FallbackComponent={() => <ImageFallback meshRef={meshRef} initialTransform={initialTransform} obj={obj} />}>
            <ImagePlane
              meshRef={meshRef}
              imagePath={`${window.location.protocol}//${window.location.hostname}:3001${asset.file_path}`}
              initialTransform={initialTransform}
              isSelected={isSelected}
              onSelect={onSelect}
              obj={obj}
              isPlaying={isPlaying}
            />
          </ErrorBoundary>
        </Suspense>
      ) : isText ? (
        // Render 3D Text
        <Text3DObject
          meshRef={meshRef}
          textContent={asset.text_content!}
          textColor={asset.text_color || '#ffffff'}
          textSize={asset.text_font_size || 1.0}
          initialTransform={initialTransform}
          isSelected={isSelected}
          onSelect={onSelect}
          obj={obj}
          isPlaying={isPlaying}
        />
      ) : (
        // Render Primitive
        <mesh
          ref={meshRef}
          position={initialTransform.position as [number, number, number]}
          rotation={[
            (initialTransform.rotation[0] * Math.PI) / 180,
            (initialTransform.rotation[1] * Math.PI) / 180,
            (initialTransform.rotation[2] * Math.PI) / 180,
          ]}
          scale={initialTransform.scale as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation();
            // Prevent selection during playback
            if (isPlaying) {
              return;
            }
            // Prevent selection if object is locked
            if ('locked' in obj && obj.locked === 1) {
              return;
            }
            onSelect();
          }}
        >
          <PrimitiveGeometry modelId={obj.model_id} />
          <meshStandardMaterial
            color={color}
            emissive={isSelected ? color : '#000000'}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />

          {/* Nametag */}
          {currentShowNametag === 1 && (
            <Html
              position={[0, 'scale_y' in obj ? obj.scale_y * 0.7 : 1, 0]}
              center
              distanceFactor={10}
              zIndexRange={[100, 0]}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {obj.name}
              </div>
            </Html>
          )}
        </mesh>
      )}

      {/* TransformControls - 배경 오브젝트는 드래그 불가 */}
      {isSelected && meshRef.current && !isPlaying && !isBackgroundObject && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={transformMode}
          enabled={!isPlaying && !isBackgroundObject}
          onObjectChange={() => {
            if (meshRef.current) {
              // 변환 중 실시간 업데이트는 하지 않음 (성능 문제)
            }
          }}
          onMouseUp={() => {
            if (meshRef.current && onTransformEnd) {
              const mesh = meshRef.current;
              onTransformEnd({
                position: mesh.position.toArray(),
                rotation: [
                  (mesh.rotation.x * 180) / Math.PI,
                  (mesh.rotation.y * 180) / Math.PI,
                  (mesh.rotation.z * 180) / Math.PI,
                ],
                scale: mesh.scale.toArray(),
              });
            }
          }}
        />
      )}
    </>
  );
}

// Image Fallback Component (when image fails to load)
function ImageFallback({
  meshRef,
  initialTransform,
  obj
}: {
  meshRef: any;
  initialTransform: any;
  obj: SceneObject | BackgroundObject;
}) {
  return (
    <mesh
      ref={meshRef}
      position={initialTransform.position as [number, number, number]}
      rotation={[
        (initialTransform.rotation[0] * Math.PI) / 180,
        (initialTransform.rotation[1] * Math.PI) / 180,
        (initialTransform.rotation[2] * Math.PI) / 180,
      ]}
      scale={initialTransform.scale as [number, number, number]}
    >
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial color="#ff6b6b" side={THREE.DoubleSide} />

      {/* Error indicator */}
      <Html center position={[0, 0, 0.01]} distanceFactor={10} zIndexRange={[100, 0]}>
        <div className="bg-red-900 bg-opacity-90 text-white px-3 py-1 rounded text-xs pointer-events-none select-none whitespace-nowrap">
          ⚠️ 이미지 로드 실패
        </div>
      </Html>
    </mesh>
  );
}

// Image Plane Component
function ImagePlane({
  meshRef,
  imagePath,
  initialTransform,
  isSelected,
  onSelect,
  obj,
  isPlaying
}: {
  meshRef: any;
  imagePath: string;
  initialTransform: any;
  isSelected: boolean;
  onSelect: () => void;
  obj: SceneObject | BackgroundObject;
  isPlaying?: boolean;
}) {
  const texture = useLoader(THREE.TextureLoader, imagePath);

  return (
    <mesh
      ref={meshRef}
      position={initialTransform.position as [number, number, number]}
      rotation={[
        (initialTransform.rotation[0] * Math.PI) / 180,
        (initialTransform.rotation[1] * Math.PI) / 180,
        (initialTransform.rotation[2] * Math.PI) / 180,
      ]}
      scale={initialTransform.scale as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        // Prevent selection during playback
        if (isPlaying) {
          return;
        }
        // Prevent selection if object is locked
        if ('locked' in obj && obj.locked === 1) {
          return;
        }
        onSelect();
      }}
    >
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        emissive={isSelected ? '#ffffff' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />

      {/* Nametag */}
      {obj.show_nametag === 1 && (
        <Html
          position={[0, 'scale_y' in obj ? obj.scale_y * 1.2 : 1, 0]}
          center
          distanceFactor={10}
              zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {obj.name}
          </div>
        </Html>
      )}
    </mesh>
  );
}

// 3D Text Component
function Text3DObject({
  meshRef,
  textContent,
  textColor,
  textSize,
  initialTransform,
  isSelected,
  onSelect,
  obj,
  isPlaying
}: {
  meshRef: any;
  textContent: string;
  textColor: string;
  textSize: number;
  initialTransform: any;
  isSelected: boolean;
  onSelect: () => void;
  obj: SceneObject | BackgroundObject;
  isPlaying?: boolean;
}) {
  return (
    <group
      ref={meshRef}
      position={initialTransform.position as [number, number, number]}
      rotation={[
        (initialTransform.rotation[0] * Math.PI) / 180,
        (initialTransform.rotation[1] * Math.PI) / 180,
        (initialTransform.rotation[2] * Math.PI) / 180,
      ]}
      scale={initialTransform.scale as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        // Prevent selection during playback
        if (isPlaying) {
          return;
        }
        // Prevent selection if object is locked
        if ('locked' in obj && obj.locked === 1) {
          return;
        }
        onSelect();
      }}
    >
      <Text
        fontSize={textSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={isSelected ? '#ffff00' : '#000000'}
      >
        {textContent}
      </Text>

      {/* Nametag */}
      {obj.show_nametag === 1 && (
        <Html
          position={[0, textSize * 0.7, 0]}
          center
          distanceFactor={10}
              zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {obj.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// 배경 렌더링 컴포넌트
function BackgroundEnvironment({
  backgroundType = 'grid',
  gridSize = { width: 20, depth: 20 }
}: {
  backgroundType?: string;
  gridSize?: { width: number; depth: number };
}) {
  // 배경별 색상 설정
  const getBackgroundColors = () => {
    switch (backgroundType) {
      case 'platform':
        return {
          cellColor: '#d4d4d4',
          sectionColor: '#fbbf24', // 노란색 안전선
          groundColor: '#e5e5e5',
        };
      case 'tracks':
        return {
          cellColor: '#78716c',
          sectionColor: '#57534e',
          groundColor: '#a8a29e',
        };
      case 'train_interior':
        return {
          cellColor: '#cbd5e1',
          sectionColor: '#94a3b8',
          groundColor: '#f1f5f9',
        };
      case 'station':
        return {
          cellColor: '#d1d5db',
          sectionColor: '#9ca3af',
          groundColor: '#f3f4f6',
        };
      default: // grid
        return {
          cellColor: '#6b7280',
          sectionColor: '#3b82f6',
          groundColor: '#1f2937',
        };
    }
  };

  const colors = getBackgroundColors();

  return (
    <>
      {/* 그리드 */}
      <Grid
        args={[gridSize.width, gridSize.depth]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={colors.cellColor}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={colors.sectionColor}
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* 바닥면 (배경에 따라 색상 변경) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize.width, gridSize.depth]} />
        <meshStandardMaterial color={colors.groundColor} opacity={0.2} transparent />
      </mesh>
    </>
  );
}

const ThreeViewer = forwardRef<ThreeViewerHandle, ThreeViewerProps>(({
  objects,
  selectedObjectId,
  backgroundType = 'grid',
  assets = [],
  currentTime,
  isPlaying,
  gridSize = { width: 20, depth: 20 },
  backgroundObjectIds = [],
  onObjectSelect,
  onObjectTransform
}, ref) => {
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const objectRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  // Keyboard shortcuts for transform mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'g' || e.key === 'G') {
        setTransformMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
      } else if (e.key === 's' || e.key === 'S') {
        setTransformMode('scale');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Expose getObjectTransform method to parent
  useImperativeHandle(ref, () => ({
    getObjectTransform: (objectId: string) => {
      const mesh = objectRefs.current.get(objectId);
      if (!mesh) {
        return null;
      }

      // Find object in props to get visible and show_nametag
      const obj = objects.find(o => o.id === objectId);
      if (!obj) {
        return null;
      }

      const result = {
        position: mesh.position.toArray() as [number, number, number],
        rotation: [
          (mesh.rotation.x * 180) / Math.PI,
          (mesh.rotation.y * 180) / Math.PI,
          (mesh.rotation.z * 180) / Math.PI,
        ] as [number, number, number],
        scale: mesh.scale.toArray() as [number, number, number],
        // Use actual visible state from Three.js mesh (reflects current state)
        visible: mesh.visible ? 1 : 0,
        // Use DB value (already updated by toggle handlers)
        show_nametag: obj.show_nametag ?? 1,
      };

      return result;
    }
  }), [objects]);

  const handleTransformEnd = (objectId: string, transform: any) => {
    onObjectTransform?.(objectId, transform);
  };

  // Find asset for each object
  const getAssetForObject = (obj: SceneObject | BackgroundObject) => {
    if (!obj.model_id) return undefined;
    return assets.find(asset => asset.id === obj.model_id);
  };

  // Handle mesh registration
  const handleMeshCreated = (objectId: string, mesh: THREE.Mesh) => {
    objectRefs.current.set(objectId, mesh);
  };

  return (
    <div className="w-full h-full bg-gray-950 relative">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
        onPointerMissed={() => onObjectSelect?.(undefined as any)}
      >
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* 배경 환경 */}
        <BackgroundEnvironment backgroundType={backgroundType} gridSize={gridSize} />

        {/* 오브젝트 렌더링 */}
        {objects
          .filter(obj => !('visible' in obj) || obj.visible !== 0)  // visible이 없거나 0이 아닌 경우만 렌더링
          .map((obj) => {
            const asset = getAssetForObject(obj);
            const isLight = obj.model_id?.startsWith('light_');
            const isBackgroundObject = backgroundObjectIds.includes(obj.id);

            // Render light objects with LightObject component
            if (isLight) {
              return (
                <LightObject
                  key={obj.id}
                  obj={obj}
                  isSelected={selectedObjectId === obj.id}
                  onSelect={() => onObjectSelect?.(obj.id)}
                  transformMode={transformMode}
                  onTransformEnd={(transform) => handleTransformEnd(obj.id, transform)}
                  asset={asset}
                  isPlaying={isPlaying}
                  onLightCreated={handleMeshCreated as any}
                  isBackgroundObject={isBackgroundObject}
                />
              );
            }

            // Render normal objects with SceneObjectMesh component
            return (
              <SceneObjectMesh
                key={obj.id}
                obj={obj}
                isSelected={selectedObjectId === obj.id}
                onSelect={() => onObjectSelect?.(obj.id)}
                transformMode={transformMode}
                onTransformEnd={(transform) => handleTransformEnd(obj.id, transform)}
                asset={asset}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onMeshCreated={handleMeshCreated}
                isBackgroundObject={isBackgroundObject}
              />
            );
          })}

        {/* 카메라 컨트롤 */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2}
        />

        {/* 축 표시 (우측 하단) */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#22c55e', '#3b82f6']}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>

      {/* Transform 모드 전환 버튼 */}
      {selectedObjectId && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 rounded-lg p-2 flex gap-2 z-10 max-w-[calc(100%-2rem)] mx-4">
          <button
            onClick={() => setTransformMode('translate')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              transformMode === 'translate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="hidden sm:inline">📍 이동 (G)</span>
            <span className="sm:hidden">📍</span>
          </button>
          <button
            onClick={() => setTransformMode('rotate')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              transformMode === 'rotate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="hidden sm:inline">🔄 회전 (R)</span>
            <span className="sm:hidden">🔄</span>
          </button>
          <button
            onClick={() => setTransformMode('scale')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              transformMode === 'scale'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="hidden sm:inline">📏 스케일 (S)</span>
            <span className="sm:hidden">📏</span>
          </button>
        </div>
      )}

      {/* 안내 텍스트 - 작은 화면에서는 숨김 */}
      <div className="hidden lg:block absolute bottom-4 left-4 bg-gray-900 bg-opacity-75 text-white p-3 rounded-lg text-xs pointer-events-none select-none z-10 max-w-[180px]">
        <p className="mb-1">🖱️ <strong>좌클릭</strong>: 회전</p>
        <p className="mb-1">🖱️ <strong>우클릭</strong>: 팬</p>
        <p className="mb-1">🖱️ <strong>휠</strong>: 줌</p>
        {selectedObjectId && (
          <>
            <hr className="my-2 border-gray-600" />
            <p className="mb-1">⌨️ <strong>G</strong>: 이동</p>
            <p className="mb-1">⌨️ <strong>R</strong>: 회전</p>
            <p>⌨️ <strong>S</strong>: 스케일</p>
          </>
        )}
      </div>

      {/* 객체 수 표시 */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gray-900 bg-opacity-75 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm pointer-events-none select-none z-10 whitespace-nowrap">
        📦 <span className="hidden sm:inline">오브젝트: </span><strong>{objects.length}</strong><span className="hidden sm:inline">개</span>
      </div>
    </div>
  );
});

ThreeViewer.displayName = 'ThreeViewer';

export default ThreeViewer;
