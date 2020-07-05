import * as THREE from 'three';

import { WaveSolver } from './waveSolver'

/**
 * The "view" of our application. Given the wave solver, this will render to
 * match the wave solver's current state.
 */
export class View {
    private readonly scene : THREE.Scene;
    private readonly renderer : THREE.WebGLRenderer;
    private readonly camera : THREE.Camera;

    private readonly material : THREE.MeshBasicMaterial;
    
    private readonly waveSolver : WaveSolver;

    private readonly textureWidth : number;
    private readonly textureHeight : number;
    
    // Pixel data for the on screen texture.
    private textureData : Uint8Array;

    constructor(window, waveSolver : WaveSolver) {
        this.waveSolver = waveSolver;

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // I somewhat arbitrarily chose a screen that goes [-50,50] along each
        // axis.
        this.camera = new THREE.OrthographicCamera(
            /* left */ -50,
            /* right */ 50,
            /* top */ -50,
            /* bottom */ 50,
            /* near */ 0.1,
            /* far */ 7000);

        this.textureWidth = this.waveSolver.GetCellCountX();
        this.textureHeight = this.waveSolver.GetCellCountY();

        let textureSize = this.textureWidth * this.textureHeight;
        this.textureData = new Uint8Array(3 * textureSize);

        let texture = new THREE.DataTexture(
            this.textureData, 
            this.textureWidth, 
            this.textureHeight, 
            THREE.RGBFormat);

        this.material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide, 
            map: texture
        });

        // Size the geometry to match the arbitrary screen coordinates I chose
        // above.
        let geometry = new THREE.PlaneGeometry(100, 100);
        let plane = new THREE.Mesh(geometry, this.material);
        this.scene.add( plane );

        this.camera.position.x = 0;
        this.camera.position.y = 0;
        // The camera is orthographic, so things don't scale with distance. 
        // That means the z-coordinate we choose here doesn't matter, as long as
        // it's positive.
        this.camera.position.z = 100;
    }

    /**
     * Update the scene to match the current wave solver and render.
     */
    Render() : void {
        this._Update();
        this.renderer.render(this.scene, this.camera);
    }

    GetDomElement() {
        return this.renderer.domElement;
    }

    private _Update() : void {
        // Update the data texture to reflect the wave solver state.

        let countX = this.waveSolver.GetCellCountX();
        let countY = this.waveSolver.GetCellCountY();

        let cellSizeX = this.textureWidth / countX;
        let cellSizeY = this.textureHeight / countY;

        for (let j = 0; j < this.textureHeight; j++) {
            for (let i = 0; i < this.textureWidth; i++) {
                let index = i + j * this.textureWidth;

                // Calculate the data texture pixel position
                let x = i / this.textureWidth * 2 - 1;
                let y = j / this.textureHeight * 2 - 1;

                let pixel = new THREE.Vector2(x, y);

                // Calculate the wave solver cell position
                let cellI = i / cellSizeX;
                let cellJ = j / cellSizeY;

                let density = this.waveSolver.GetDensity(cellI, cellJ);
                let velocity = this.waveSolver.GetVelocity(cellI, cellJ);

                // Compute the color from HSV space
                let hsl = this._HsvToHsl(
                    0.5 + 0.5 * Math.sin(density*0.0004), 
                    1.0, 
                    0.5 + 0.5 * Math.sin(velocity*0.01));

                let color = new THREE.Color();
                color.setHSL(hsl[0], hsl[1], hsl[2]);

                let stride = index * 3;
                this.textureData[stride]     = Math.floor(color.r * 255);
                this.textureData[stride + 1] = Math.floor(color.g * 255);
                this.textureData[stride + 2] = Math.floor(color.b * 255);
            }
        }

        // Signal the material to update its texture
        this.material.map.needsUpdate = true;
    }

    /**
     * Convert hue/saturation/variance to hue/saturation/luminance.
     * Borrowed from https://stackoverflow.com/a/31851617/456460
     */
    private _HsvToHsl(h, s, v) {
        // both hsv and hsl values are in [0, 1]
        let l = (2 - s) * v / 2;

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

}