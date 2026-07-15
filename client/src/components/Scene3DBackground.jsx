import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// WebGL Detector Helper
function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// Camera parallax mouse controller
function CameraRig({ isScanning, isTabVisible }) {
  const { camera, pointer } = useThree();
  
  useFrame((state) => {
    if (!isTabVisible) return; // Throttled if tab is inactive
    
    // Parallax camera lerp target matching mouse cursor
    const targetX = pointer.x * 2.2;
    const targetY = pointer.y * 2.2 + 2; // hover elevated
    const targetZ = 8.5 + (isScanning ? -1.8 : 0); // zoom in on scanning
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    
    state.camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Custom 3D wireframe Curly Bracket component
function CurlyBracketMesh({ left, isScanning, isSuccess, isTabVisible }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!isTabVisible) return;
    const t = state.clock.getElapsedTime();
    const speed = isScanning ? 4.5 : 0.8;
    
    // Rotate individual bracket
    groupRef.current.rotation.y = (left ? 1 : -1) * t * speed * 0.4;
    groupRef.current.rotation.x = t * speed * 0.2;
    
    // Pulse scale matching pulse animation
    const scaleFactor = 1.0 + Math.sin(t * (isScanning ? 12 : 2.5)) * 0.04;
    groupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
  });

  // Color mapping based on solver state
  let glowColor = '#8b5cf6'; // purple default
  if (isScanning) glowColor = '#ff3b5c'; // error neon red
  if (isSuccess) glowColor = '#00ffb3'; // solver neon green

  return (
    <group ref={groupRef} position={[left ? -2.2 : 2.2, 0, 0]}>
      {/* Horizontal top bars */}
      <mesh position={[left ? 0.3 : -0.3, 1.4, 0]}>
        <boxGeometry args={[0.7, 0.15, 0.15]} />
        <meshBasicMaterial color={glowColor} wireframe />
      </mesh>
      
      {/* Vertical main stem */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 2.7, 0.15]} />
        <meshBasicMaterial color={glowColor} wireframe />
      </mesh>

      {/* Center horizontal tip jutting out */}
      <mesh position={[left ? 0.25 : -0.25, 0, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.15]} />
        <meshBasicMaterial color={glowColor} wireframe />
      </mesh>
      
      {/* Horizontal bottom bars */}
      <mesh position={[left ? 0.3 : -0.3, -1.4, 0]}>
        <boxGeometry args={[0.7, 0.15, 0.15]} />
        <meshBasicMaterial color={glowColor} wireframe />
      </mesh>
    </group>
  );
}

// Particle stars drifting simulation representing "code bits"
function FloatingCodeBits({ isScanning, isTabVisible }) {
  const pointsRef = useRef();
  const count = 350;
  
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return arr;
  });

  useFrame((state) => {
    if (!isTabVisible) return;
    const posArray = pointsRef.current.geometry.attributes.position.array;
    const speed = isScanning ? 0.14 : 0.02; // Sucked in or slow drift

    for (let i = 0; i < count; i++) {
      if (isScanning) {
        // Particles converge towards bracket core center (0,0,0)
        posArray[i * 3] += (0 - posArray[i * 3]) * 0.02;
        posArray[i * 3 + 1] += (0 - posArray[i * 3 + 1]) * 0.02;
        posArray[i * 3 + 2] += (0 - posArray[i * 3 + 2]) * 0.02;

        // Reset if too close
        const dist = Math.sqrt(posArray[i * 3]**2 + posArray[i * 3 + 1]**2 + posArray[i * 3 + 2]**2);
        if (dist < 0.6) {
          posArray[i * 3] = (Math.random() - 0.5) * 20;
          posArray[i * 3 + 1] = (Math.random() - 0.5) * 15;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 25;
        }
      } else {
        // Slow vertical drift representing falling code dust
        posArray[i * 3 + 1] -= speed;
        if (posArray[i * 3 + 1] < -8) {
          posArray[i * 3 + 1] = 8; // reset to top
        }
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ffb3" // neon green code bits
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.5}
      />
    </points>
  );
}

export default function Scene3DBackground({ isScanning, isSuccess }) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // 1. Detect WebGL capabilities on mount
  useEffect(() => {
    setHasWebGL(hasWebGLSupport());
  }, []);

  // 2. Tab Visibility monitor (Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
      console.log(`R3F Canvas: Visibility toggled. Render Loop active: ${document.visibilityState === 'visible'}`);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Graceful Degradation: static fallback
  if (!hasWebGL) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-gray-950 to-indigo-950 overflow-hidden">
        {/* CSS Falling Code Bits Matrix lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none matrix-falling-code" />
        <style>{`
          .matrix-falling-code {
            background: linear-gradient(rgba(0, 255, 179, 0.1) 50%, transparent 50%),
                        linear-gradient(90deg, rgba(0, 255, 179, 0.1) 50%, transparent 50%);
            background-size: 20px 20px;
            animation: moveGrid 8s linear infinite;
          }
          @keyframes moveGrid {
            from { background-position: 0 0; }
            to { background-position: 0 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 bg-radial from-gray-950 via-slate-950 to-black overflow-hidden select-none">
      <Canvas camera={{ position: [0, 1.5, 8.5], fov: 60 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.4} />
        
        {/* Neon Starfield */}
        <Stars radius={100} depth={50} count={1200} factor={4} saturation={0.5} fade speed={1.2} />
        
        {/* Falling Code Dust */}
        <FloatingCodeBits isScanning={isScanning} isTabVisible={isTabVisible} />

        {/* Floating Bracket Mesh */}
        <CurlyBracketMesh left={true} isScanning={isScanning} isSuccess={isSuccess} isTabVisible={isTabVisible} />
        <CurlyBracketMesh left={false} isScanning={isScanning} isSuccess={isSuccess} isTabVisible={isTabVisible} />

        {/* Camera Rig controller */}
        <CameraRig isScanning={isScanning} isTabVisible={isTabVisible} />

        {/* Postprocessing Bloom */}
        <EffectComposer>
          <Bloom
            intensity={isScanning ? 2.5 : 1.2}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
      </Canvas>

      {/* Grid Vignetting Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/85 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </div>
  );
}
