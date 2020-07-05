import * as THREE from 'three';

export function pageToCamera(clientX, clientY) : THREE.Vector2 {
    return new THREE.Vector2(
        ((clientX / window.innerWidth) * 2 - 1) * 50,
        (-(clientY / window.innerHeight) * 2 + 1) * -50);
}


export function hsvToHsl(h, s, v) {
    // both hsv and hsl values are in [0, 1]
    var l = (2 - s) * v / 2;

    if (l != 0) {
        if (l == 1) {
            s = 0
        } else if (l < 0.5) {
            s = s * v / (l * 2)
        } else {
            s = s * v / (2 - l * 2)
        }
    }

    return [h, s, l]
}


export function worldToCellCoords(waveSolver, vec) : THREE.Vector2 {
    var result = new THREE.Vector2();
    
    result.addVectors(vec, new THREE.Vector2(50,50));
    result.divideScalar(100.0);

    result.x = 
        THREE.MathUtils.clamp(Math.floor(result.x * (waveSolver.GetCellCountX()-1)), 
            /* min */ 0, 
            /* max */ waveSolver.GetCellCountX() - 1);
    result.y = 
        THREE.MathUtils.clamp(Math.floor(result.y * (waveSolver.GetCellCountY()-1)),
            /* min */ 0, 
            /* max */ waveSolver.GetCellCountY() - 1);

    return result;
}