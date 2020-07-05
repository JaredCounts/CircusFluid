// add styles
import './style.css';

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
function Animate() : void {
    requestAnimationFrame(Animate);

    timestepManager.Update(
        waveSolver.Solve.bind(waveSolver));

    view.Render();
}

// Setup the controller and its handlers
let controller = new Controller(window, waveSolver);

// When window resizes, reset everything.
function OnWindowResize() {
    waveSolver = new WaveSolver(cellCountX, cellCountY);
    controller = new Controller(window, waveSolver);

    // When updating the view, we need to be sure to replace the old dom element 
    // instead of just adding a new one.
    let oldDomElement = view.GetDomElement();
    view = new View(window, waveSolver);
    document.body.replaceChild(view.GetDomElement(), oldDomElement);
}
window.addEventListener('resize', OnWindowResize);

Animate();
