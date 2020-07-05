import * as THREE from 'three';

import { WaveSolver } from './waveSolver'
import { TouchPos } from './touchPos'
import { bresenham } from './bresenham'

import * as Util from './util'

export class Controller {
    
    private waveSolver : WaveSolver;
    private identifierToTouch: Map<any, TouchPos>;

    private mousePos : THREE.Vector2;
    private prevMousePos : THREE.Vector2;
    private mouseDown : boolean;

    constructor(waveSolver : WaveSolver) {
        this.waveSolver = waveSolver;

        this.identifierToTouch = new Map<any, TouchPos>();

        this.mousePos = new THREE.Vector2();
        this.prevMousePos = new THREE.Vector2();
        this.mouseDown = false;
    }

    HandleTouchStart(event) : void {
        // Find new touches
        var force = 250000;

        var knownIdentifiers = new Set();

        // Populate identifiersToRemove with all the touches we have first
        for (let identifier of this.identifierToTouch.keys()) {
            knownIdentifiers.add(identifier);
        }

        // Remove any identifiers from the list that are still around
        for (let touch of event.touches) {
            if (!knownIdentifiers.has(touch.identifier)) {
                var screenPosition = Util.pageToCamera(touch.clientX, touch.clientY);
                var cellCoord = 
                    Util.worldToCellCoords(this.waveSolver, screenPosition);
                this.waveSolver.AddVelocity(force, cellCoord.x, cellCoord.y);
            }
        }
    }
    HandleTouchMove(event) : void {
        event.preventDefault();
        for (let touch of event.touches) {
            var screenPosition = Util.pageToCamera(touch.clientX, touch.clientY);

            if (this.identifierToTouch.has(touch.identifier)) {
                this.identifierToTouch.get(touch.identifier).SetPos(screenPosition.x, screenPosition.y);
            }
            else {
                this.identifierToTouch.set(touch.identifier, new TouchPos(screenPosition.x, screenPosition.y));
            }
        }

        var force = 10000;
        for (let TouchPos of this.identifierToTouch.values()) {

            var prevCellCoord = 
                Util.worldToCellCoords(
                    this.waveSolver, 
                    new THREE.Vector2(TouchPos.GetPrevPosX(), TouchPos.GetPrevPosY()));

            var cellCoord =
                Util.worldToCellCoords(
                    this.waveSolver, 
                    new THREE.Vector2(TouchPos.GetPosX(), TouchPos.GetPosY()));

            bresenham(
                prevCellCoord.x, prevCellCoord.y,
                cellCoord.x, cellCoord.y,
                this._ClampedAddVelocity.bind(this, force));
        }
    }

    HandleTouchEnd(event) : void {
        // On touch end events, remove any identifier from the identifierToTouch map
        // (so it doesn't grow indefinitely).
        // This is kind of a roundabout way of doing it. First we create a set,
        // populate it with every touch identifier we know about, then remove from that
        // every identifier that's still around, and then we remove whatever is remaining
        // from the map.

        var identifiersToRemove = new Set();

        // Populate identifiersToRemove with all the touches we have first
        for (let identifier of this.identifierToTouch.keys()) {
            identifiersToRemove.add(identifier);
        }

        // Remove any identifiers from the list that are still around
        for (let touch of event.touches) {
            identifiersToRemove.delete(touch.identifier);
        }

        // Now remove the remaining touches from the master map
        for (let identifier of identifiersToRemove.keys()) {
            if (this.identifierToTouch.has(identifier)) {
                this.identifierToTouch.delete(identifier);
            }
        }
    }

    HandleMouseDown(event) : void {
        this.mouseDown = true;
        this._UpdateMousePos(Util.pageToCamera(event.clientX, event.clientY));
    }

    HandleMouseUp(event) : void {
        this.mouseDown = false;
        this._UpdateMousePos(Util.pageToCamera(event.clientX, event.clientY));
    }

    HandleMouseMove(event) : void {
        this._UpdateMousePos(Util.pageToCamera(event.clientX, event.clientY));

        if (this.mouseDown) {
            var force = 10000;

            var prevCellCoord = 
                Util.worldToCellCoords(this.waveSolver, this.mousePos);
            var cellCoord = 
                Util.worldToCellCoords(this.waveSolver, this.prevMousePos);

            bresenham(
                prevCellCoord.x, prevCellCoord.y,
                cellCoord.x, cellCoord.y,
                this._ClampedAddVelocity.bind(this, force));
        }
    }

    HandleMouseClick(event) : void {
        this._UpdateMousePos(Util.pageToCamera(event.clientX, event.clientY));

        var force = 250000;
        var cellCoord = 
            Util.worldToCellCoords(this.waveSolver, this.mousePos);
        this.waveSolver.AddVelocity(force, cellCoord.x, cellCoord.y);
    }

    private _ClampedAddVelocity(force: number, x: number, y: number) : void {
        var cellI = 
            THREE.MathUtils.clamp(x, 
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountX() - 1);
        var cellJ = 
            THREE.MathUtils.clamp(y,
                /* min */ 0, 
                /* max */ this.waveSolver.GetCellCountY() - 1);
        
        this.waveSolver.AddVelocity(force, cellI, cellJ);
    }

    private _UpdateMousePos(pos : THREE.Vector2) : void {
        this.prevMousePos.copy(this.mousePos);
        this.mousePos = pos;
    }
}