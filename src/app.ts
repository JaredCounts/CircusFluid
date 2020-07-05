// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { Controller } from './controller'
import { TouchPos } from './touchPos'
import { View } from './view'

import * as Util from './util'

// Basic THREE.js setup
// ====================

// create the scene
// const scene = new THREE.Scene();
// const camera = new THREE.OrthographicCamera(
//     /* left */ -50,
//     /* right */ 50,
//     /* top */ -50,
//     /* bottom */ 50,
//     /* near */ 0.1, 
//     /* far */ 7000);

// Renderer setup
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(view.GetDomElement());


// Update the renderer and wave solver when the window resizes.
function onWindowResize() {

    waveSolver = new WaveSolver(cellCountX, cellCountY);
    controller = new Controller(waveSolver);
    registerControllerHandlers();

    let oldDomElement = view.GetDomElement();
    view = new View(window, waveSolver);
    document.body.replaceChild(view.GetDomElement(), oldDomElement);
    // view.GetRenderer().setSize(window.innerWidth, window.innerHeight);

    // var cellCountX = Math.floor(window.innerWidth / cellWidth);
    // var cellCountY = Math.floor(window.innerHeight / cellWidth);
    // waveSolver = new WaveSolver(cellCountX, cellCountY);
}

var textureClock = new THREE.Clock(false);
var textureTimes = [];

// function GetWaveTexture(waveSolver) : void {
//     textureClock.start();

//     var r = 0;
//     var g = 0;
//     var b = 0;

//     var countX = waveSolver.GetCellCountX();
//     var countY = waveSolver.GetCellCountY();

//     var cellSizeX = textureWidth / countX;
//     var cellSizeY = textureHeight / countY;

//     for (let j = 0; j < textureHeight; j++) {
//         for (let i = 0; i < textureWidth; i++) {
//             let index = i + j * textureWidth;

//             var x = i/textureWidth * 2 - 1;
//             var y = j/textureHeight * 2 - 1;

//             var pixel = new THREE.Vector2(x, y);

//             var cellI = i / cellSizeX;
//             var cellJ = j / cellSizeY;

//             var density = waveSolver.GetDensity(cellI, cellJ);
//             var velocity = waveSolver.GetVelocity(cellI, cellJ);
//             var color = new THREE.Color(); // 127 + 127 * Math.sin(velocity * 0.0004)

//             var hsl = Util.hsvToHsl(
//                 0.5 + 0.5 * Math.sin(density*0.0004), 
//                 1.0, 
//                 0.5 + 0.5 * Math.sin(velocity*0.01));

//             color.setHSL(hsl[0], hsl[1], hsl[2]);

//             var stride = index * 3;
//             textureData[ stride ]     = Math.floor(color.r * 255);
//             textureData[ stride + 1 ] = Math.floor(color.g * 255);
//             textureData[ stride + 2 ] = Math.floor(color.b * 255);
//         }
//     }

//     textureClock.stop();

//     textureTimes.push(textureClock.getElapsedTime());
// }

var cellWidth = 5;
var cellCountX = Math.floor(window.innerWidth / cellWidth);
var cellCountY = Math.floor(window.innerHeight / cellWidth);

var waveSolver = new WaveSolver(cellCountX, cellCountY);

var view = new View(window, waveSolver);
document.body.appendChild(view.GetDomElement());

function animate(): void {
    requestAnimationFrame(animate);
    render();
}

var lastUpdateTime = Date.now();

var timestep = 10.0; // in ms
var timestepSec = timestep / 1000.0;
var leftoverTime = 0;

var fps = 60;

var iter = 0;

function getAverage(arr): number {
    var sum = 0;
    for (let num of arr) {
        sum += num;
    }

    return sum / arr.length;
}

var solveClock = new THREE.Clock(false);
var solveTimes = [];

function render(): void {
    var time = Date.now();
    var elapsed = time - lastUpdateTime;
    lastUpdateTime = time;

    var elapsedSec = elapsed/1000;
    if (elapsedSec != 0) {
        var instantFPS = 1.0 / elapsedSec;
        fps = 0.9 * fps + 0.1 * instantFPS;
    }
    
    iter++;
    if (iter % 100 == 0) {
        console.log("fps: " + fps);
        console.log("texture avg time (ms): " + 1000 * getAverage(textureTimes));
        console.log("solve avg time / iteration (ms): " + 1000 * getAverage(solveTimes));
    }

    var timestepCount = Math.floor((elapsed + leftoverTime) / timestep);
    leftoverTime += elapsed - timestepCount * timestep;

    if (timestepCount > 10) {
        timestepCount = 10;
    }

    for (var i = 0; i < timestepCount; i++) {
        solveClock.start();
        waveSolver.Solve(timestepSec);
        solveClock.stop();

        solveTimes.push(solveClock.getElapsedTime());
    }

    // // GetWaveTexture(waveSolver);
    // material.map.needsUpdate = true;
    view.Render();

    // renderer.render(scene, camera);
}

function registerControllerHandlers() {
    window.addEventListener( 'touchmove', controller.HandleTouchMove.bind(controller), false );
    window.addEventListener( 'touchstart', controller.HandleTouchStart.bind(controller), false );
    window.addEventListener( 'touchend', controller.HandleTouchEnd.bind(controller), false );
    window.addEventListener( 'touchleave', controller.HandleTouchEnd.bind(controller), false );

    window.addEventListener( 'mousemove', controller.HandleMouseMove.bind(controller), false );
    window.addEventListener( 'mousedown', controller.HandleMouseDown.bind(controller), false );
    window.addEventListener( 'mouseup', controller.HandleMouseUp.bind(controller), false );
    window.addEventListener( 'click', controller.HandleMouseClick.bind(controller), true);
}

var controller = new Controller(waveSolver);
registerControllerHandlers();

window.addEventListener( 'resize', onWindowResize, false );


animate();
