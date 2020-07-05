// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { View } from './view'
import { Controller } from './controller'
import { TimeManager } from './timeManager'

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

// To keep each cell roughly uniform, determine the number of cells can fit 
// in the window along their respective axes.
var cellCountX = Math.floor(window.innerWidth / cellWidth);
var cellCountY = Math.floor(window.innerHeight / cellWidth);

var waveSolver = new WaveSolver(cellCountX, cellCountY);

var view = new View(window, waveSolver);
document.body.appendChild(view.GetDomElement());

var timestepManager = new TimeManager(
    /* timestep_ms */ 10.0,
    /* timestepLimitPerUpdate */ 10);

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

var controller = new Controller(waveSolver);
registerControllerHandlers();

window.addEventListener('resize', onWindowResize);


animate();
