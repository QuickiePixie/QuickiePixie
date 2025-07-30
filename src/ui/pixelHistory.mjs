
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
        // const pixelsCopy = new Uint8ClampedArray(pixels);
        // console.log("pixels to save to undo stack", pixels)
        // console.log("current undo stack", this.undoStack)
        // // if (this.undoStack.undoStack[this.undoStack.length - 1] != pixels) {
        // console.log("is this true?",  this.undoStack[this.undoStack.length - 1] !== pixels)
        //     // if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== pixels) {
        //     if(this.undoStack.length === 0 ) {
        // this.undoStack.push(pixels)
        // this.redoStack = []
        // // }
        // console.log("saved to undo stack", pixels)
        // // const imageData = pixels
        // // for (let i = 0; i < imageData.length; i += 4) {
        // //     console.log(`R: ${imageData[i]}, G: ${imageData[i + 1]}, B: ${imageData[i + 2]}, A: ${imageData[i + 3]}`);
        // //   }
        //     }
        //     console.log("after undo stack", this.undoStack)
        const pixelsCopy = new Uint8ClampedArray(pixels);
console.log("pixels copy", pixelsCopy)
        console.log("is this condition true??", !this.arraysEqual(this.undoStack[this.undoStack.length - 1], pixelsCopy))
        // Check if the last saved state is different from the current state
        if (
            this.undoStack.length === 0 || 
            !this.arraysEqual(this.undoStack[this.undoStack.length - 1], pixelsCopy)
        ) {
            this.undoStack.push(pixelsCopy);
            // this.redoStack = []; // Clear redo stack when a new state is saved
            this.clearRedoStack();
            console.log("redo stack cleared?", this.redoStack)
            console.log("saved to undo stack", pixelsCopy);
            console.log("inside hereeee???????")
        }
        console.log("length of redo stack", this.redoStack.length)
        console.log("length of undo stack", this.undoStack.length)
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
        console.log("saved to redo stack")
    }

    undo() {
        console.log("length of undo stack", this.undoStack.length)
        // pop
        if (this.undoStack.length >= 2) {
           const currentPixels = this.undoStack.pop()
           this.saveToRedoStack(currentPixels)
        //    if (this.undoStack.length == 0) {
        //     return null
        //     //need to set strting state
        //    }
           return this.undoStack[this.undoStack.length - 1]
                // return currentPixels;
        }
        return null

        //add to redo
    }

    redo() {
        console.log("length of redo stack", this.redoStack.length)
       //pop
       //if stack not empty
    //    return this.redoStack[0]
       //add to undo
    if (this.redoStack.length > 0) {
       const currentPixels = this.redoStack.pop()
       this.undoStack.push(currentPixels); // Push directly to undo stack
        console.log("Redo performed, current pixels:", currentPixels);
        return currentPixels;
    //    this.saveToUndoStack(currentPixels); // Use saveToUndoStack to ensure redo stack is cleared
    //     return currentPixels;
    //    this.saveToUndoStack(currentPixels)
    // this.undoStack.push(currentPixels)
    //    return currentPixels
    }
      return null

    }

    clearRedoStack() {
        this.redoStack = []
    }
}

