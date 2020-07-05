// add styles
import './style.css';
// three.js
import * as THREE from 'three';

import { WaveSolver } from './waveSolver'

// create the scene
const scene = new THREE.Scene();

// create the camera
// const camera = new THREE.PerspectiveCamera(
//     /* fov */ 60, 
//     /* aspect? */ window.innerWidth / window.innerHeight, 
//     /* near */ 0.1, 
//     /* far? */ 7000);
const camera = new THREE.OrthographicCamera(
    /* left */ -50,
    /* right */ 50,
    /* top */ -50,
    /* bottom */ 50,
    /* near */ 0.1, 
    /* far */ 7000);

const renderer = new THREE.WebGLRenderer();

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

// // add axis to the scene
// const axis = new THREE.AxesHelper(10);

// scene.add(axis);

// // add lights
// const light = new THREE.DirectionalLight(0xffffff, 1.0);

// light.position.set(100, 100, 100);

// scene.add(light);

// const light2 = new THREE.DirectionalLight(0xffffff, 1.0);

// light2.position.set(-100, 100, -100);

// scene.add(light2);

// var grid = new THREE.GridHelper(/* size */ 100,  /* divisions */ 100);
// scene.add(grid);

const material = new THREE.MeshPhongMaterial({
  color: 0x888888,
  wireframe: true,
});

// create a box and add it to the scene
// const box = new THREE.Mesh(
//        new THREE.BoxGeometry(10, 10, 10), 
//        material);

// scene.add(box);

var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();

var mouseDown = false;

function onMouseDown(event) {
    mouseDown = true;
}
function onMouseUp(event) {
    mouseDown = false;
}
function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    prevMouse.copy(mouse);

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // We don't need to do any fancy projection math
    // since the camera is orthographic and facing perpendicularly down
    // instead, we just need to remap it to the frustum
    mouse.x = mouse.x * 50;
    mouse.y = -mouse.y * 50;

    // console.log("prevmouse", prevMouse, "mouse", mouse);

    if (mouseDown) {
        // console.log("mouse drag");
        // var force = prevMouse.distanceTo(mouse) * 255;
        var force = 10000;

        var prevCellCoord = worldToCellCoords(mouse);
        var cellCoord = worldToCellCoords(prevMouse);

        // console.log("b", prevCellCoord, cellCoord);

        // console.log(force);

        var dx = Math.abs(cellCoord.x - prevCellCoord.x);
        var dy = Math.abs(cellCoord.y - prevCellCoord.y);
        var sx;
        var sy;
        if (prevCellCoord.x < cellCoord.x)
            sx = 1;
        else
            sx = -1;
        if (prevCellCoord.y < cellCoord.y)
            sy = 1;
        else
            sy = -1;
        var err = dx - dy;
        var x0 = prevCellCoord.x;
        var y0 = prevCellCoord.y;
        var x1 = cellCoord.x;
        var y1 = cellCoord.y;
        var i = 0;
        while ( (x0 != x1) || (y0 != y1)) {
            i++;
            if (i > 50) {
                break;
            }
            // Make sure the coordinate is within the window
            // if (((int)(x0 / grid.cellSize) < grid.density.length) && ((int)(y0 / grid.cellSize) < grid.density[0].length) &&
            //   ((int)(x0 / grid.cellSize) > 0) && ((int)(y0 / grid.cellSize) > 0))
            //   grid.velocity[(int)(x0 / grid.cellSize)][(int)(y0 / grid.cellSize)] += force;
            // var xNorm = (x0+50)/100;
            // var yNorm = (y0+50)/100;

            // console.log("b", xNorm, yNorm);

            var cellI = 
                THREE.MathUtils.clamp(x0, 
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountX() - 1);
            var cellJ = 
                THREE.MathUtils.clamp(y0,
                    /* min */ 0, 
                    /* max */ waveSolver.GetCellCountY() - 1);
            
            waveSolver.AddVelocity(force, cellI, cellJ);

            var e2 = 2 * err;
            if (e2 > -dy) {
              err -= dy;
              x0 = x0 + sx;
            }
            if (e2 < dx) {
              err = err + dx;
              y0 = y0 + sy;
            }
        }
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



// for ( var i = 0; i < size; i ++ ) {

//     var stride = i * 3;

//     data[ stride ] = r;
//     data[ stride + 1 ] = g;
//     data[ stride + 2 ] = b;

//     g += 1;

// }

// used the buffer to create a DataTexture

// var texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat );

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


window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onMouseDown, false );
window.addEventListener( 'mouseup', onMouseUp, false );
window.addEventListener( 'resize', onWindowResize, false );
renderer.domElement.addEventListener("click", onMouseClick, true);

animate();
