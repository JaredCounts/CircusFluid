// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { View } from './view'
import { Controller } from './controller'
import { TimeManager } from './timeManager'

const cellWidth = 5;

// To keep each cell roughly uniform, determine the number of cells can fit 
// in the window along their respective axes.
let cellCountX = Math.floor(window.innerWidth / cellWidth);
let cellCountY = Math.floor(window.innerHeight / cellWidth);

let waveSolver = new WaveSolver(cellCountX, cellCountY);

let view = new View(window, waveSolver);
document.body.appendChild(view.GetDomElement());

const timestepManager = new TimeManager(
    /* timestep_ms */ 10.0,
    /* timestepLimitPerUpdate */ 10);

/**
 * The main update loop of the app.
 */
function animate() : void {
    requestAnimationFrame(animate);

    timestepManager.Update(
        waveSolver.Solve.bind(waveSolver));

    view.Render();
}

function registerControllerHandlers() {
    window.addEventListener('touchmove', controller.HandleTouchMove.bind(controller));
    window.addEventListener('touchstart', controller.HandleTouchStart.bind(controller));
    window.addEventListener('touchend', controller.HandleTouchEnd.bind(controller));
    window.addEventListener('touchleave', controller.HandleTouchEnd.bind(controller));

    window.addEventListener('mousemove', controller.HandleMouseMove.bind(controller));
    window.addEventListener('mousedown', controller.HandleMouseDown.bind(controller));
    window.addEventListener('mouseup', controller.HandleMouseUp.bind(controller));
    window.addEventListener('click', controller.HandleMouseClick.bind(controller));
}

// Setup the controller and its handlers
let controller = new Controller(waveSolver);
registerControllerHandlers();

// When window resizes, reset everything.
function onWindowResize() {
    waveSolver = new WaveSolver(cellCountX, cellCountY);
    controller = new Controller(waveSolver);
    registerControllerHandlers();

    let oldDomElement = view.GetDomElement();
    view = new View(window, waveSolver);
    document.body.replaceChild(view.GetDomElement(), oldDomElement);
}
window.addEventListener('resize', onWindowResize);

animate();
