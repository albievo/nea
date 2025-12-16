import { Vector2 } from "../utils/Vector2";
import { RenderableKind } from "./Renderable";

interface RenderableSpecificPayload {
  renderableId: string;
}

export interface InitialGridRenderPayload extends RenderableSpecificPayload {
  size: Vector2;
  startingZoom: number;
  maxZoom: number;
  zoomCoefficient: number;
}

export interface InitialGridElementPayload extends RenderableSpecificPayload {
  color: "red" | "green" | "blue";
}

export interface GridElementMovePayload extends RenderableSpecificPayload {
  delta: Vector2;
}

export interface RenderPayload {
  camera?: boolean;
  resize?: boolean;
  initialGrid?: InitialGridRenderPayload;
  initialGridElements?: InitialGridElementMap; //  maps element ID to the payload
  gridElementsMovement?: GridElementMovementMap;
}

export interface RenderBuffer {
  kind: RenderableKind
  camera?: boolean,
  resize?: boolean,
}

export interface GridElementRenderBuffer extends RenderBuffer {
  kind: 'grid-element',
  initial?: InitialGridElementPayload,
  movement?: Vector2
}

export interface GridRenderBuffer extends RenderBuffer {
  kind: 'grid',
  initial?: InitialGridRenderPayload
}

type RenderPayloadBooleanMap = {
  [K in keyof RenderPayload]?: boolean;
};

export type AnyRenderBuffer = GridRenderBuffer | GridElementRenderBuffer;

export const PayloadRequiresFullRender: RenderPayloadBooleanMap = {
  camera: true,
  resize: true,
  initialGrid: true,
  initialGridElements: false,
  gridElementsMovement: true,
};

export type InitialGridElementMap = { [id: string]: InitialGridElementPayload };
export type GridElementMovementMap = { [id: string]: GridElementMovePayload };

export class RenderPayloadUtils {

  // public static mergePayloads(original: RenderPayload, toAdd: RenderPayload): RenderPayload {
  //   const newPayload: RenderPayload = {};

  //   if (toAdd.initialGrid) {
  //     if (original.initialGrid) console.error('grid\'s inital render already completed');
  //     newPayload.initialGrid = toAdd.initialGrid;
  //   }

  //   if (toAdd.initialGridElements) {
  //     newPayload.initialGridElements = original.initialGridElements
  //       ? this.mergeInitialGridElements(original.initialGridElements, toAdd.initialGridElements)
  //       : toAdd.initialGridElements;
  //   }

  //   if (toAdd.gridElementsMovement) {
  //     newPayload.gridElementsMovement = original.gridElementsMovement
  //       ? this.mergeGridElementsMovement(original.gridElementsMovement, toAdd.gridElementsMovement)
  //       : toAdd.gridElementsMovement;
  //   }

  //   newPayload.camera = original.camera || toAdd.camera;

  //   // if there is any resizing, new payload should include it
  //   newPayload.resize = original.resize || toAdd.resize;

  //   return newPayload;
  // }

  private static mergeInitialGridElements(
    original: InitialGridElementMap,
    toAdd: InitialGridElementMap
  ): InitialGridElementMap  {
    // copy original so that changing intialGridElements doesn't change original
    const initialGridElements: InitialGridElementMap = { ...original };

    for (const key in toAdd) {
      if (key in original) {
        console.error("grid element's initial render already completed");
      } else {
        initialGridElements.key = toAdd[key];
      }
    }

    return initialGridElements;
  }

  private static mergeGridElementsMovement(
    original: GridElementMovementMap,
    toAdd: GridElementMovementMap
  ): GridElementMovementMap  {
    // copy original so that changing intialGridElements doesn't change original
    const gridElementsMovement: GridElementMovementMap = { ...original };

    for (const key in toAdd) {
      if (key in original) {
        gridElementsMovement.key = {
          renderableId: key,
          delta: original.key.delta.add(toAdd.key.delta)
        }
      } else {
        gridElementsMovement.key = toAdd.key;
      }
    }

    return gridElementsMovement;
  }

  public static payloadRequiresFullRender(payload: RenderPayload): boolean {
    return (Object.keys(payload) as (keyof RenderPayload)[])  // get all keys of payload
      .some(key => PayloadRequiresFullRender[key]);           // check if any of the keys needs a full render
  }

  public static mergeRenderBuffers(
    original: AnyRenderBuffer, toAdd: AnyRenderBuffer
  ): AnyRenderBuffer | undefined {
    // can't merge buffers of different kinds
    if (original.kind !== toAdd.kind) {
      return;
    }

    // if either has a camera or resize, the new payload should have that
    original.camera ||= toAdd.camera;
    original.resize ||= toAdd.resize;

    switch (original.kind) {
      case 'grid': {
        const discriminatedToAdd = toAdd as GridRenderBuffer;
        return this.mergeGridRenderBuffers(original, discriminatedToAdd);
      }
      case 'grid-element': {
        const discriminatedToAdd = toAdd as GridElementRenderBuffer;
        return this.mergeGridElementRenderBuffers(original, discriminatedToAdd);
      }
    }
  }

  private static mergeGridRenderBuffers(
    original: GridRenderBuffer, toAdd: GridRenderBuffer
  ): GridRenderBuffer {
    const newPayload: GridRenderBuffer = { kind: 'grid' };
    
    // don't merge initials
    if (original.initial && toAdd.initial) {
      console.error('cannot merge 2 initial renders');
      newPayload.initial = original.initial;
    }

    return newPayload;
  }

  private static mergeGridElementRenderBuffers(
    original: GridElementRenderBuffer, toAdd: GridElementRenderBuffer
  ): GridElementRenderBuffer {
    const newPayload: GridElementRenderBuffer = { kind: 'grid-element' };
    
    // don't merge initials
    if (original.initial && toAdd.initial) {
      console.error('cannot merge 2 initial renders');
      newPayload.initial = original.initial;
    }

    // add if they both haVE a movement value, otherwise just use one (or neither)
    newPayload.movement =
      original.movement && toAdd.movement
        ? original.movement.add(toAdd.movement)
        : original.movement ?? toAdd.movement;


    return newPayload;
  }
}