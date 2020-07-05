import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { TouchPos } from './touchPos'
import { bresenham } from './bresenham'

/**
 * Handle user interactions.
 */
export class Controller {
    private readonly waveSolver : WaveSolver;
    
    // Keep a map of touch identifiers to "TouchPos"es. We need this just so we 
    // can keep track of the "previous" positions of each touch.
    private readonly identifierToTouchPos: Map<any, TouchPos>;

    private mousePos : THREE.Vector2;
    private prevMousePos : THREE.Vector2;
    private mouseDown : boolean;

    constructor(waveSolver : WaveSolver) {
        this.waveSolver = waveSolver;

        this.identifierToTouchPos = new Map<any, TouchPos>();

        this.mousePos = new THREE.Vector2();
        this.prevMousePos = new THREE.Vector2();
        this.mouseDown = false;
    }

    HandleTouchStart(event) : void {
        // Find new touches and add a little force at that spot.

        let force = 250000;

        let knownIdentifiers = new Set();

        // Populate knownIdentifiers with all the touches we have first
        for (let identifier of this.identifierToTouchPos.keys()) {
            knownIdentifiers.add(identifier);
        }

        // For any new identifier, add some velocity at that spot.
        for (let touch of event.touches) {
            if (!knownIdentifiers.has(touch.identifier)) {
                let screenPosition = 
                    this._PageToScreen(touch.pageX, touch.pageY);
                
                let cellCoord = this._ScreenToCellCoords(screenPosition);
                
                this.waveSolver.AddVelocity(force, cellCoord.x, cellCoord.y);
            }
        }
    }

    HandleTouchMove(event) : void {
        event.preventDefault();
        
        // Update our mappings and their positions given the event positions.
        for (let touch of event.touches) {
            let screenPosition = this._PageToScreen(touch.pageX, touch.pageY);

            if (this.identifierToTouchPos.has(touch.identifier)) {
                this.identifierToTouchPos.get(touch.identifier).SetPos(
                    screenPosition.x, screenPosition.y);
            }
            else {
                this.identifierToTouchPos.set(
                    touch.identifier, 
                    new TouchPos(screenPosition.x, screenPosition.y));
            }
        }

        // Apply force along the segment between each touch's prior and current
        // positions.
        let force = 10000;
        for (let TouchPos of this.identifierToTouchPos.values()) {

            let prevCellCoord = 
                this._ScreenToCellCoords(
                    new THREE.Vector2(
                        TouchPos.GetPrevPosX(), TouchPos.GetPrevPosY()));

            let cellCoord =
                this._ScreenToCellCoords(
                    new THREE.Vector2(TouchPos.GetPosX(), TouchPos.GetPosY()));

            bresenham(
                prevCellCoord.x, prevCellCoord.y,
                cellCoord.x, cellCoord.y,
                this._ClampedAddVelocity.bind(this, force));
        }
    }

    HandleTouchEnd(event) : void {
        // On touch end events, remove any identifier from the identifierToTouchPos 
        // map so it doesn't grow indefinitely.
        // This is kind of a roundabout way of doing it. First we create a set,
        // populate it with every touch identifier we know about, then remove 
        // from that every identifier that's still around, and then we remove 
        // whatever is remaining from the map.

        let identifiersToRemove = new Set();

        // Populate identifiersToRemove with all the touches we have first
        for (let identifier of this.identifierToTouchPos.keys()) {
            identifiersToRemove.add(identifier);
        }

        // Remove any identifiers from the list that are still around
        for (let touch of event.touches) {
            identifiersToRemove.delete(touch.identifier);
        }

        // Now remove the remaining touches from the master map
        for (let identifier of identifiersToRemove.keys()) {
            if (this.identifierToTouchPos.has(identifier)) {
                this.identifierToTouchPos.delete(identifier);
            }
        }
    }

    HandleMouseDown(event) : void {
        this.mouseDown = true;
        this._UpdateMousePos(this._PageToScreen(event.pageX, event.pageY));
    }

    HandleMouseUp(event) : void {
        this.mouseDown = false;
        this._UpdateMousePos(this._PageToScreen(event.pageX, event.pageY));
    }

    HandleMouseMove(event) : void {
        this._UpdateMousePos(this._PageToScreen(event.pageX, event.pageY));

        // If the mouse is down, add some force along the segment between
        // the previous and current mouse positions.
        if (this.mouseDown) {
            let force = 10000;

            let prevCellCoord = this._ScreenToCellCoords(this.mousePos);
            let cellCoord = this._ScreenToCellCoords(this.prevMousePos);

            bresenham(
                prevCellCoord.x, prevCellCoord.y,
                cellCoord.x, cellCoord.y,
                this._ClampedAddVelocity.bind(this, force));
        }
    }

    HandleMouseClick(event) : void {
        this._UpdateMousePos(this._PageToScreen(event.pageX, event.pageY));

        let force = 250000;
        let cellCoord = this._ScreenToCellCoords(this.mousePos);
        this.waveSolver.AddVelocity(force, cellCoord.x, cellCoord.y);
    }

    /**
     * Given a force, adds that amount to the velocity at the x y coordinates
     * given. This first clamps the x and y coords.
     */
    private _ClampedAddVelocity(force: number, x: number, y: number) : void {
        let cellI = 
            THREE.MathUtils.clamp(x, 
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountX() - 1);
        let cellJ = 
            THREE.MathUtils.clamp(y,
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountY() - 1);
        
        this.waveSolver.AddVelocity(force, cellI, cellJ);
    }

    private _UpdateMousePos(pos : THREE.Vector2) : void {
        this.prevMousePos.copy(this.mousePos);
        this.mousePos = pos;
    }

    /** 
     * Convert coordinates from page space to screen space.
     */
    private _PageToScreen(pageX, pageY) : THREE.Vector2 {
        return new THREE.Vector2(
            ((pageX / window.innerWidth) * 2 - 1) * 50,
            (-(pageY / window.innerHeight) * 2 + 1) * -50);
    }

    /** 
     * Convert coordinates from screen space to wave solver integer coordinates.
     */
    private _ScreenToCellCoords(vec) : THREE.Vector2 {
        let result = new THREE.Vector2();
        
        result.addVectors(vec, new THREE.Vector2(50,50));
        result.divideScalar(100.0);

        result.x = 
            THREE.MathUtils.clamp(
                Math.floor(result.x * (this.waveSolver.GetCellCountX()-1)), 
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountX() - 1);
        result.y = 
            THREE.MathUtils.clamp(
                Math.floor(result.y * (this.waveSolver.GetCellCountY()-1)),
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountY() - 1);

        return result;
    }
}