import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function FloatingCube({ position, size = 1 }: { position: [number, number, number]; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function FloatingOctahedron({ position, size = 0.8 }: { position: [number, number, number]; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[size]} />
        <meshStandardMaterial
          color="#888888"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function GridLines() {
  const lines = useMemo(() => {
    const linesArray = [];
    const spacing = 2;
    const count = 10;
    
    for (let i = -count; i <= count; i++) {
      linesArray.push(
        <line key={`h-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-count * spacing, 0, i * spacing, count * spacing, 0, i * spacing])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
        </line>
      );
      linesArray.push(
        <line key={`v-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([i * spacing, 0, -count * spacing, i * spacing, 0, count * spacing])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
        </line>
      );
    }
    return linesArray;
  }, []);

  return <group position={[0, -3, 0]} rotation={[0, 0, 0]}>{lines}</group>;
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        
        <FloatingCube position={[-3, 1, 0]} size={1.2} />
        <FloatingCube position={[3, 0.5, -2]} size={0.8} />
        <FloatingCube position={[1, 2, 1]} size={0.6} />
        <FloatingOctahedron position={[-1, -0.5, 2]} size={0.7} />
        <FloatingOctahedron position={[2, 1.5, -1]} size={0.5} />
        
        <GridLines />
      </Canvas>
    </div>
  );
}
