import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Projectile } from '../../types';

interface Projectile3DProps {
    projectile: Projectile;
    position: [number, number, number];
}

export const Projectile3D: React.FC<Projectile3DProps> = ({ projectile, position }) => {
    const mesh = useRef<Mesh>(null);

    useFrame(() => {
        if (mesh.current) {
            mesh.current.position.set(...position);
        }
    });

    return (
        <mesh ref={mesh} position={position}>
            <sphereGeometry args={[projectile.size / 60, 16, 16]} />
            <meshStandardMaterial color={projectile.color} emissive={projectile.color} emissiveIntensity={0.5} />
        </mesh>
    );
};
