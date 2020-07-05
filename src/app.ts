// add styles
import './style.css';

import { WaveSolver } from './waveSolver'
import { View } from './view'
import { Controller } from './controller'
import { TimeManager } from './timeManager'

const cellWidth = 3;

// To keep each cell roughly uniform, determine the number of cells can fit 
// in the window along their respective axes.
let cellCountX = Math.floor(window.innerWidth / cellWidth);
let cellCountY = Math.floor(window.innerHeight / cellWidth);

let waveSolver = new WaveSolver(cellCountX, cellCountY);

function ResetView() : void {
    let appElement = document.getElementById('app');

    // When updating the view, we need to be sure to replace the old dom element 
    // instead of just adding a new one.
    let oldDomElement = view == null ? null : view.GetDomElement();
    view = new View(appElement, waveSolver);

    if (oldDomElement == null) {
        appElement.appendChild(view.GetDomElement());
    }
    else {
        appElement.replaceChild(view.GetDomElement(), oldDomElement);
    }
}

let view;

function OnDOMContentLoaded(event) : void {
    ResetView();
}
document.addEventListener('DOMContentLoaded', OnDOMContentLoaded);

const timestepManager = new TimeManager(
    /* timestep_ms */ 10.0,
    /* timestepLimitPerUpdate */ 10);

/**
 * The main update loop of the app.
 */
function Animate() : void {
    requestAnimationFrame(Animate);

    timestepManager.Update(
        waveSolver.Solve.bind(waveSolver));

    if (view != null) {
        view.Render();
    }
}

// Setup the controller and its handlers
let controller = new Controller(window, waveSolver);

// When window resizes, reset everything.
function OnWindowResize() {
    cellCountX = Math.floor(window.innerWidth / cellWidth);
    cellCountY = Math.floor(window.innerHeight / cellWidth);
    
    waveSolver = new WaveSolver(cellCountX, cellCountY);
    controller = new Controller(window, waveSolver);

    ResetView();
}
window.addEventListener('resize', OnWindowResize);

Animate();
