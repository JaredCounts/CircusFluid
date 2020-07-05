import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import * as Util from './util'

export class View {
    private readonly scene : THREE.Scene;
    private readonly renderer : THREE.WebGLRenderer;
    private readonly camera : THREE.Camera;

    private readonly texture : THREE.DataTexture;
    private readonly material : THREE.MeshBasicMaterial;
    private textureData : Uint8Array;
    
    private readonly waveSolver : WaveSolver;

    private readonly textureWidth : number;
    private readonly textureHeight : number;
    // Reference to the current window
    // private readonly window;

    constructor(window, waveSolver : WaveSolver) {
        this.waveSolver = waveSolver;

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.camera = new THREE.OrthographicCamera(
            /* left */ -50,
            /* right */ 50,
            /* top */ -50,
            /* bottom */ 50,
            /* near */ 0.1,
            /* far */ 7000);

        // this.window = window;
        this.textureWidth = this.waveSolver.GetCellCountX();
        this.textureHeight = this.waveSolver.GetCellCountY();

        let textureSize = this.textureWidth * this.textureHeight;
        this.textureData = new Uint8Array(3 * textureSize);

        this.texture = new THREE.DataTexture(
            this.textureData, 
            this.textureWidth, 
            this.textureHeight, 
            THREE.RGBFormat);

        this.material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide, 
            map: this.texture
        });

        this.material.map = this.texture;

        let geometry = new THREE.PlaneGeometry(100, 100);
        let plane = new THREE.Mesh(geometry, this.material);
        this.scene.add( plane );

        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 100;

        this.camera.lookAt(this.scene.position);
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
                let hsl = Util.hsvToHsl(
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

    Render() : void {
        this._Update();
        this.renderer.render(this.scene, this.camera);
    }
    
    GetDomElement() {
        return this.renderer.domElement;
    }
}