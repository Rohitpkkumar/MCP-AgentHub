import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const Node = ({ position, color, label }: { position: [number, number, number], color: string, label: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position}>
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[0.8, 1]} />
                    <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
                </mesh>
                <Text
                    position={[0, -1.2, 0]}
                    fontSize={0.3}
                    color="#222222"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
            </group>
        </Float>
    );
};

const Connections = ({ nodes }: { nodes: any[] }) => {
    const lines = useMemo(() => {
        const connections: any[] = [];
        nodes.forEach((node, i) => {
            nodes.forEach((otherNode, j) => {
                if (i < j) {
                    connections.push([node.position, otherNode.position]);
                }
            });
        });
        return connections;
    }, [nodes]);

    return (
        <group>
            {lines.map((line, i) => {
                const points = [...line[0], ...line[1]];
                const float32 = new Float32Array(points);
                return (
                    <line key={i}>
                        <bufferGeometry attach="geometry">
                            <bufferAttribute
                                attach="attributes-position"
                                count={2}
                                array={float32}
                                itemSize={3}
                                args={[float32, 3]}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial attach="material" color="#cccccc" transparent opacity={0.3} />
                    </line>
                );
            })}
        </group>
    );
};

export const Constellation = () => {
    const nodes = [
        { position: [0, 0, 0], color: "#F3E8FF", label: "Orchestrator" },
        { position: [-3, 1, -1], color: "#DFF6FF", label: "Web Search" },
        { position: [3, -1, -2], color: "#FFE6D6", label: "Email" },
        { position: [1, 2, -1], color: "#DFF6FF", label: "Summarizer" },
        { position: [-2, -2, 0], color: "#FFE6D6", label: "Registry" },
    ];

    return (
        <div className="w-full h-[400px] md:h-[500px] relative -mt-10">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="#F3E8FF" intensity={0.5} />

                <group rotation={[0, 0, 0]}>
                    {nodes.map((node, i) => (
                        <Node key={i} position={node.position as any} color={node.color} label={node.label} />
                    ))}
                    <Connections nodes={nodes} />
                </group>

                {/* <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} /> */}
            </Canvas>
        </div>
    );
};
