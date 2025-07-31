
export class PixelHistory {
    constructor (initialPixels) {
        this.undoStack = [new Uint8ClampedArray(initialPixels)]
        this.redoStack = []
    }

    undoStackEnabled() {
        return this.undoStack.length > 1
    }

    redoStackEnabled() {
        return this.redoStack.length > 0
    }

    saveToUndoStack(pixels) {
        const pixelsCopy = new Uint8ClampedArray(pixels);
        // Check if the last saved state is different from the current state
        if (
            this.undoStack.length === 0 || 
            !this.arraysEqual(this.undoStack[this.undoStack.length - 1], pixelsCopy)
        ) {
            this.undoStack.push(pixelsCopy);
            this.clearRedoStack();
        }
    }

     // Helper function to compare two arrays
     arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
    
    saveToRedoStack(pixels)  {
        this.redoStack.push(new Uint8ClampedArray(pixels))
    }

    undo() {
        if (this.undoStack.length >= 2) {
           const currentPixels = this.undoStack.pop()
           this.saveToRedoStack(currentPixels)
           return this.undoStack[this.undoStack.length - 1]
        }
        return null
    }

    redo() {
    if (this.redoStack.length > 0) {
       const currentPixels = this.redoStack.pop()
       this.undoStack.push(currentPixels); // Push directly to undo stack
        return currentPixels;
    }
      return null

    }

    clearRedoStack() {
        this.redoStack = []
    }
}

