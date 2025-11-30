import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Entity } from '../../types';
import { loadOBJModel, getEnemyModelName, CHARACTER_MODELS } from '../../utils/OBJLoader';

interface Enemy3DProps {
    enemy: Entity;
    position: [number, number, number];
}

export const Enemy3D: React.FC<Enemy3DProps> = ({ enemy, position }) => {
    const group = useRef<Group>(null);
    const [model, setModel] = useState<Group | null>(null);

    useEffect(() => {
        // Determine which model to load based on enemy type
        const modelName = enemy.type === 'BOSS'
            ? CHARACTER_MODELS.BOSS_ENEMY
            : getEnemyModelName(enemy.variant);

        loadOBJModel(modelName)
            .then((loadedModel) => {
                setModel(loadedModel);
            })
            .catch((error) => {
                console.error('Failed to load enemy model:', error);
            });
    }, [enemy.variant, enemy.type]);

    useFrame(() => {
        if (group.current) {
            group.current.position.set(...position);
            group.current.rotation.y = -enemy.facing + Math.PI / 2;
        }
    });

    if (!model) {
        return null; // Or a loading placeholder
    }

    return (
        <group ref={group} dispose={null}>
            <primitive object={model.clone()} scale={0.5} />
        </group>
    );
};
