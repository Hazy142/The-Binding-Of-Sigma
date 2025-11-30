import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import * as THREE from 'three';

/**
 * Character model mapping for the game
 */
export const CHARACTER_MODELS = {
    PLAYER: 'character-a',
    BASIC_ENEMY: 'character-b',
    SHOOTER_ENEMY: 'character-c',
    DASHER_ENEMY: 'character-d',
    TANK_ENEMY: 'character-e',
    BOSS_ENEMY: 'character-f',
} as const;

/**
 * Load an OBJ model with its MTL texture
 * @param modelName - Name of the model without extension (e.g., 'character-a')
 * @returns Promise that resolves to the loaded THREE.Group
 */
export async function loadOBJModel(modelName: string): Promise<THREE.Group> {
    const basePath = '/assets/3d/OBJ format/';
    const objPath = `${basePath}${modelName}.obj`;

    return new Promise((resolve, reject) => {
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath(basePath);
        mtlLoader.setResourcePath(basePath); // Set resource path for texture loading

        mtlLoader.load(
            `${modelName}.mtl`,
            (materials) => {
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);

                objLoader.load(
                    objPath,
                    (object) => {
                        resolve(object);
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading OBJ model ${modelName}:`, error);
                        reject(error);
                    }
                );
            },
            undefined,
            (error) => {
                console.error(`Error loading MTL file for ${modelName}:`, error);
                reject(error);
            }
        );
    });
}

/**
 * Get the model name for a specific enemy variant
 */
export function getEnemyModelName(variant?: string): string {
    switch (variant) {
        case 'BASIC':
            return CHARACTER_MODELS.BASIC_ENEMY;
        case 'SHOOTER':
            return CHARACTER_MODELS.SHOOTER_ENEMY;
        case 'DASHER':
            return CHARACTER_MODELS.DASHER_ENEMY;
        case 'TANK':
            return CHARACTER_MODELS.TANK_ENEMY;
        default:
            return CHARACTER_MODELS.BASIC_ENEMY;
    }
}
