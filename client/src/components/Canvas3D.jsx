import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Component to handle mouse move parallax
function CameraRig({ isScanning }) {
  const { camera, pointer } = useThree();
  
  useFrame((state) => {
    // Parallax effect: camera position adapts slightly to mouse position
    const targetX = pointer.x * 2.5;
    const targetY = pointer.y * 2.5 + 2; // offset upward
    const targetZ = 8 + (isScanning ? -1.5 : 0); // Zoom in slightly when scanning
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    
    state.camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Glowing cyber grid component
function CyberGrid({ isScanning, isSuccess }) {
  const gridRef = useRef();
  
  // Choose color based on state
  let gridColor = '#8b5cf6'; // purple
  if (isScanning) gridColor = '#ec4899'; // pink
  if (isSuccess) gridColor = '#10b981'; // green

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Flow/movement effect
    gridRef.current.position.z = (t * (isScanning ? 1.5 : 0.4)) % 2;
  });

  return (
    <group position={[0, -2.5, 0]}>
      {/* Moving grid */}
      <gridHelper
        ref={gridRef}
        args={[30, 30, gridColor, '#1f2937']}
        position={[0, 0, 0]}
      />
    </group>
  );
}

// Glowing Core component that represents the debugging engine
function EngineCore({ isScanning, isSuccess }) {
  const coreRef = useRef();
  const innerRef = useRef();
  const outerRef = useRef();

  // Color mappings
  let coreColor = new THREE.Color('#8b5cf6'); // purple
  let emissiveColor = new THREE.Color('#3b82f6'); // blue
  let intensity = 1.5;

  if (isScanning) {
    coreColor = new THREE.Color('#f43f5e'); // rose/red
    emissiveColor = new THREE.Color('#db2777'); // pink
    intensity = 3.5;
  } else if (isSuccess) {
    coreColor = new THREE.Color('#10b981'); // emerald
    emissiveColor = new THREE.Color('#06b6d4'); // cyan
    intensity = 2.0;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = isScanning ? 4 : 0.8;
    
    // Rotate structures
    coreRef.current.rotation.y = t * speed * 0.5;
    coreRef.current.rotation.x = t * speed * 0.3;
    
    innerRef.current.rotation.y = -t * speed * 0.8;
    innerRef.current.rotation.z = t * speed * 0.4;
    
    outerRef.current.rotation.y = t * speed * 0.1;
    outerRef.current.rotation.x = -t * speed * 0.2;

    // Pulse core scale
    const pulse = 1 + Math.sin(t * (isScanning ? 10 : 2)) * 0.05;
    coreRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group ref={coreRef}>
      {/* Central crystal octahedron */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color={coreColor}
          emissive={emissiveColor}
          emissiveIntensity={intensity}
          roughness={0.1}
          metalness={0.9}
          transmission={0.6}
          thickness={0.8}
        />
      </mesh>

      {/* Wireframe cage sphere */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          color={emissiveColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Outer rotating orbit rings */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.9, 0.015, 8, 48]} />
        <meshBasicMaterial color={emissiveColor} transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / -4, Math.PI / 2, 0]}>
        <torusGeometry args={[2.1, 0.015, 8, 48]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.3} />
      </mesh>

      {/* Central light source inside the core */}
      <pointLight color={emissiveColor} intensity={isScanning ? 8 : 3} distance={10} />
    </group>
  );
}

// Background space dust particles
function SpaceDust({ isScanning }) {
  const pointsRef = useRef();
  const count = 500;
  
  // Initialize particle positions
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = isScanning ? 0.08 : 0.015;
    
    // Slow drifting animation
    const posArray = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 2] += speed; // drift forward
      if (posArray[i * 3 + 2] > 10) {
        posArray[i * 3 + 2] = -10; // reset to back
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.01;
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
        color="#a855f7"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
}

export default function Canvas3D({ isScanning, isSuccess }) {
  return (
    <div className="absolute inset-0 z-0 bg-radial from-gray-950 via-slate-950 to-black overflow-hidden">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />
        
        {/* Futuristic Grid and Core */}
        <CyberGrid isScanning={isScanning} isSuccess={isSuccess} />
        <EngineCore isScanning={isScanning} isSuccess={isSuccess} />
        
        {/* Starfields & Particles */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1.5} />
        <SpaceDust isScanning={isScanning} />
        
        {/* Interactive parallax & orbit controls */}
        <CameraRig isScanning={isScanning} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 2 - 0.5}
        />
      </Canvas>
      
      {/* Futuristic vignetting / gradient mask to blend 3D canvas with overlay UI */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none" />
    </div>
  );
}
