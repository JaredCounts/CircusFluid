// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { TouchTracker } from './touchTracker'
import { bresenham } from './bresenham'

// create the scene
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    /* left */ -50,
    /* right */ 50,
    /* top */ -50,
    /* bottom */ 50,
    /* near */ 0.1, 
    /* far */ 7000);

const renderer = new THREE.WebGLRenderer();

var identifierToTouch = new Map();

// set size
renderer.setSize(window.innerWidth, window.innerHeight);

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    var cellCountX = Math.floor(window.innerWidth / cellWidth);
    var cellCountY = Math.floor(window.innerHeight / cellWidth);
    waveSolver = new WaveSolver(cellCountX, cellCountY);
}

// add canvas to dom
document.body.appendChild(renderer.domElement);

const material = new THREE.MeshPhongMaterial({
  color: 0x888888,
  wireframe: true,
});

var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();

var mouseDown = false;

function pageToCamera(clientX, clientY) : THREE.Vector2 {
    return new THREE.Vector2(
        ((clientX / window.innerWidth) * 2 - 1) * 50,
        (-(clientY / window.innerHeight) * 2 + 1) * -50);
}

function updateMousePos(clientX, clientY) {
    prevMouse.copy(mouse);

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (clientY / window.innerHeight) * 2 + 1;

    // We don't need to do any fancy projection math
    // since the camera is orthographic and facing perpendicularly down
    // instead, we just need to remap it to the frustum
    mouse.x = mouse.x * 50;
    mouse.y = -mouse.y * 50;
}

function onMouseDown(event) {
    mouseDown = true;
    updateMousePos(event.clientX, event.clientY);
}
function onMouseUp(event) {
    mouseDown = false;
    updateMousePos(event.clientX, event.clientY);
}
function onMouseMove(event) {
    updateMousePos(event.clientX, event.clientY);

    if (mouseDown) {
        // console.log("mouse drag");
        // var force = prevMouse.distanceTo(mouse) * 255;
        var force = 10000;

        var prevCellCoord = worldToCellCoords(mouse);
        var cellCoord = worldToCellCoords(prevMouse);

        var callback = function(x: number, y: number) {
            var cellI = 
                THREE.MathUtils.clamp(x, 
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountX() - 1);
            var cellJ = 
                THREE.MathUtils.clamp(y,
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountY() - 1);
            
            waveSolver.AddVelocity(force, cellI, cellJ);
        }

        bresenham(
            prevCellCoord.x, prevCellCoord.y,
            cellCoord.x, cellCoord.y,
            callback);
    }
}


function worldToCellCoords(vec) : THREE.Vector2 {
    var result = new THREE.Vector2();
    
    result.addVectors(vec, new THREE.Vector2(50,50));
    result.divideScalar(100.0);
    
    // result.x = Math.floor(result.x);
    // result.y = Math.floor(result.y);
    // console.log(result);

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


function onMouseClick(event) {
    console.log("click");
    // remap mouse from [-50,50] to [0,1]
    // var mouseXRel = mouse.x - -50;
    // var mouseYRel = mouse.y - -50;

    // console.log("click",mouse.x, mouse.y);

    var mouseXNorm = (mouse.x + 50)/100;
    var mouseYNorm = (mouse.y + 50)/100;

    var cellI = 
        THREE.MathUtils.clamp(Math.floor(mouseXNorm * (waveSolver.GetCellCountX()-1)), 
            /* min */ 0, 
            /* max */ waveSolver.GetCellCountX() - 1);
    var cellJ = 
        THREE.MathUtils.clamp(Math.floor(mouseYNorm * (waveSolver.GetCellCountY()-1)),
            /* min */ 0, 
            /* max */ waveSolver.GetCellCountY() - 1);

    // console.log('click at ' + cellI + ' ' + cellJ);

    waveSolver.AddVelocity(250000, cellI, cellJ);
}


function hsvToHsl(h, s, v) {
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

var textureClock = new THREE.Clock(false);
var textureTimes = [];

function GetWaveTexture(waveSolver) : void {
    textureClock.start();

    var r = 0;
    var g = 0;
    var b = 0;

    var countX = waveSolver.GetCellCountX();
    var countY = waveSolver.GetCellCountY();

    var cellSizeX = textureWidth / countX;
    var cellSizeY = textureHeight / countY;

    for (let j = 0; j < textureHeight; j++) {
        for (let i = 0; i < textureWidth; i++) {
            let index = i + j * textureWidth;

            var x = i/textureWidth * 2 - 1;
            var y = j/textureHeight * 2 - 1;

            var pixel = new THREE.Vector2(x, y);

            var cellI = i / cellSizeX;
            var cellJ = j / cellSizeY;

            var density = waveSolver.GetDensity(cellI, cellJ);
            var velocity = waveSolver.GetVelocity(cellI, cellJ);
            // if (i == 0 && j == 0) {
            //     console.log(density);
            // }

            var color = new THREE.Color(); // 127 + 127 * Math.sin(velocity * 0.0004)

            var hsl = hsvToHsl(
                0.5 + 0.5 * Math.sin(density*0.0004), 
                1.0, 
                0.5 + 0.5 * Math.sin(velocity*0.01));

            color.setHSL(hsl[0], hsl[1], hsl[2]);

            // if (pixel.distanceTo(mouse) < 0.1) {
            //     r = density;
            //     g = density;
            //     b = density;
            // }
            // else {
            //     r = 0;
            //     g = 0;
            //     b = 0;
            // }

            var stride = index * 3;
            textureData[ stride ]     = Math.floor(color.r * 255);
            textureData[ stride + 1 ] = Math.floor(color.g * 255);
            textureData[ stride + 2 ] = Math.floor(color.b * 255);
        }
    }

    textureClock.stop();

    textureTimes.push(textureClock.getElapsedTime());

    // return texture;
}

var cellWidth = 5;
var cellCountX = Math.floor(window.innerWidth / cellWidth);
var cellCountY = Math.floor(window.innerHeight / cellWidth);

var waveSolver = new WaveSolver(cellCountX, cellCountY);

// // console.log(ws.getCellSize());
// waveSolver.Solve(0.1);

// var texture = GetWaveTexture(waveSolver);

var textureWidth = waveSolver.GetCellCountX();
var textureHeight = waveSolver.GetCellCountY();
var textureSize = textureWidth * textureHeight;
var textureData = new Uint8Array( 3 * textureSize );

var material2 = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture});
var texture = new THREE.DataTexture( textureData, textureWidth, textureHeight, THREE.RGBFormat );
GetWaveTexture(waveSolver);

material2.map = texture;

var geometry2 = new THREE.PlaneGeometry(100, 100);
var plane = new THREE.Mesh( geometry2, material2 );
scene.add( plane );

plane.position.x = 0;
plane.position.y = 0;
plane.position.z = 0;

// plane.rotation.x = Math.PI/2;

camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 100;

camera.lookAt(scene.position);

// var geometry = new THREE.PlaneGeometry( 5, 20, 32 );
// var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
// var plane = new THREE.Mesh( geometry, material );
// scene.add( plane );

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

    // console.log(timestepCount)
    for (var i = 0; i < timestepCount; i++) {
        solveClock.start();
        waveSolver.Solve(timestepSec);
        solveClock.stop();

        solveTimes.push(solveClock.getElapsedTime());
    }

    GetWaveTexture(waveSolver);
    material2.map.needsUpdate = true;

    // box.position.x = mouse.x;
    // box.position.y = mouse.y;
    // box.position.z = 0;

    renderer.render(scene, camera);
}

function onTouchStart(event): void {
    console.log("touch start");
    event.preventDefault();
    const e = {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
    }
    // onMouseClick(e);
    // onMouseDown(e);
}

function onTouchMove(event): void {
    // console.log("touch move");
    // // xxx: what does this do?
    // event.preventDefault();
    // const e = {
    //     clientX: event.touches[0].clientX,
    //     clientY: event.touches[0].clientY
    // }

    for (let touch of event.touches) {
        var screenPosition = pageToCamera(touch.clientX, touch.clientY);

        if (identifierToTouch.has(touch.identifier)) {
            identifierToTouch.get(touch.identifier).SetPos(screenPosition.x, screenPosition.y);
        }
        else {
            identifierToTouch.set(touch.identifier, new TouchTracker(screenPosition.x, screenPosition.y));
        }
    }

    for (let touchTracker of identifierToTouch.values()) {

        var force = 10000;

        var prevCellCoord = 
            worldToCellCoords(new THREE.Vector2(touchTracker.GetPrevPosX(), touchTracker.GetPrevPosY()));

        var cellCoord =
            worldToCellCoords(new THREE.Vector2(touchTracker.GetPosX(), touchTracker.GetPosY()));
            
        console.log(touchTracker, prevCellCoord, cellCoord);

        var callback = function(x: number, y: number) {
            var cellI = 
                THREE.MathUtils.clamp(x, 
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountX() - 1);
            var cellJ = 
                THREE.MathUtils.clamp(y,
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountY() - 1);
            
            waveSolver.AddVelocity(force, cellI, cellJ);
        }

        bresenham(
            prevCellCoord.x, prevCellCoord.y,
            cellCoord.x, cellCoord.y,
            callback);
    }

    console.log("touch tracker count", Array.from(identifierToTouch.keys()).length);

    // onMouseMove(e);
}
function onTouchEnd(event): void {
    // Remove any touches that no longer exist
    var identifiersToRemove = new Set();

    // Populate identifiersToRemove with all the touches we have first
    for (let identifier of identifierToTouch.keys()) {
        identifiersToRemove.add(identifier);
    }

    // Remove any identifiers from the list that are still around
    for (let touch of event.touches) {
        identifiersToRemove.delete(touch.identifier);
    }

    // Now remove the remaining touches from the master map
    for (let identifier of identifiersToRemove.keys()) {
        if (identifierToTouch.has(identifier)) {
            identifierToTouch.delete(identifier);
        }
    }
}
// function onTouchLeave(event): void {

// }


window.addEventListener( 'touchmove', onTouchMove, false );
window.addEventListener( 'touchstart', onTouchStart, false );
window.addEventListener( 'touchend', onTouchEnd, false );
// window.addEventListener( 'touchleave', onTouchLeave, false );

window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onMouseDown, false );
window.addEventListener( 'mouseup', onMouseUp, false );
window.addEventListener( 'resize', onWindowResize, false );




renderer.domElement.addEventListener("click", onMouseClick, true);

animate();
