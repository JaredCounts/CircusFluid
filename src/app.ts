// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { View } from './view'
import { Controller } from './controller'

// When window resizes, reset everything.
function onWindowResize() {

    waveSolver = new WaveSolver(cellCountX, cellCountY);
    controller = new Controller(waveSolver);
    registerControllerHandlers();

    let oldDomElement = view.GetDomElement();
    view = new View(window, waveSolver);
    document.body.replaceChild(view.GetDomElement(), oldDomElement);
}

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

    view.Render();
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
