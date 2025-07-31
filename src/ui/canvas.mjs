import { setInputStart, setInputMove, setInputEnd, setInputInterrupt, initToolSelect } from "./input.mjs";
import { Render } from "./render.mjs";
import { initTools } from "./tools.mjs";
import { PixelHistory } from "./pixelHistory.mjs";

class QPPixelGrid {

    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.gridSize = width * height;
        this.pixels = new Uint8ClampedArray(this.gridSize * 4);
    }

    isOutOfBounds(x, y) {
        return (x < 0 || x >= this.width || y < 0 || y >= this.width);
    }
    
    getIndex(x, y) {
        return (y * this.width + x) * 4;
    }
    
    getPixel(x, y) {
        if (this.isOutOfBounds(x,y)) return null;
        const idx = this.getIndex(x,y);
        return this.pixels.slice(idx, idx+4);
    }
    
    getPixels () {
        return this.pixels;
    }
    
    setPixel (x, y, r, g, b, a) {
        if (this.isOutOfBounds(x,y)) return;
        const idx = this.getIndex(x,y);
        this.pixels[idx] = r;
        this.pixels[idx + 1] = g;
        this.pixels[idx + 2] = b;
        this.pixels[idx + 3] = a;
    }

    setPixels (pixels, r, g, b, a) {
        pixels.forEach(([x, y]) => this.setPixel(x, y, r, g, b, a));
    }
    
    
    clearPixel (x, y) {
        !this.isOutOfBounds(x,y) && this.setPixel(x, y, 0, 0, 0, 0);
    }
    
    clearPixels (pixels) {
        pixels.forEach(([x, y]) => this.clearPixel(x, y)); 
    }

    clearAll() {
        this.pixels.fill(0);
    }

    resetPixels(pixels) {
        this.pixels = new Uint8ClampedArray(pixels);
    }
    
}

class QPPixelGridWithHistory extends QPPixelGrid {

    constructor (width, height) {
        super(width, height)
        this.pixelHistory = new PixelHistory(new Uint8ClampedArray(this.pixels));
    }

    getPixelHistory () {
        return this.pixelHistory;
    }
}

class QPCanvasLayer {

    constructor(id="layer", elmt, width, height, history) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.canvas = elmt;
        this.canvas.width = width;
        this.canvas.height = height;
        this.renderer = new Render(this.canvas);
        this.hasHistory = history;
        if (history) {
            this.pixels = new QPPixelGridWithHistory(width, height);
        } else {
            this.pixels = new QPPixelGrid(width, height);
        }
    }

    render () {
        return this.renderer.updateCanvas(this.getBitmap());
    }
    
    getBitmap () {
        return this.pixels.getPixels();
    }
    
    clearAll () {
        return this.pixels.clearAll();
    }

    getBlob () {
        return this.renderer.createBlob(this.getBitmap()); 
    }

    getHistory() {
        if (this.hasHistory) {
            return this.pixels.getPixelHistory()
        }
        return null;
    }

}


class QPCanvas {

    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.layers = []
    }

    renderLayer(id) {
        this.layers.find(l => l.id === id && !l.render());
    }

    renderAll() {
        this.layers.forEach(l => l.render());
    }

    addLayer (id, elmt, i = 0, pixelHistory) {
        const l = new QPCanvasLayer(id, elmt, this.width, this.height, pixelHistory);
        this.layers.splice(i, 0, l);
        return l;
    }

    removeLayer(id) {
        this.layers = this.layers.filter(l => l.id !== id);
    }
}

const QPSettings = Object.seal({
    colour: Object.seal([0,0,0,255]), // rgba
    size: 4,
    baseSize: 8,
    selectedTool: null,
});


export function QuickiePixie(){
    
    this.canvas = new QPCanvas(256, 256),
    this.settings = QPSettings,  
    this.setTool = function(t) {
        this.settings.selectedTool = t;
        this.settings.selectedTool.init();
    };
    this.setColour = function(t) {
        this.settings.colour = t;
    }
    this.setSize = function(t) {
        this.settings.size = t;
    };

    this.setBaseSize = function (t) {
        this.settings.baseSize = t;
    }

    this.getTool = function() {
        return this.settings.selectedTool;
    };
    this.getColour = function() {
        return this.settings.colour;
    }
    this.getSize = function() {
        return this.settings.size;
    };

    this.getRoundedPixel = function (p) {
        return Math.round(p/this.settings.baseSize) * this.settings.baseSize;
    }

    this.getSizedPixels = function(cx, cy) {
        const s = this.getSize();
        if (s < 0) s = -s;
        const xShift = this.getRoundedPixel(cx - Math.floor(s/2));
        const yShift = this.getRoundedPixel(cy - Math.floor(s/2));
        return Array.from({ length: s * s }, (val, i) => [Math.floor(i / s) + xShift, i % s + yShift]);
    }.bind(this);
}

QuickiePixie.prototype.init = function () {

    const inputLayer = this.canvas.addLayer("input", document.getElementById("overlay-pixel-canvas"), 0, false);
    const previewLayer = inputLayer;
    const mainLayer = this.canvas.addLayer("layer1", document.getElementById("pixel-canvas"), 1, true);
    this.curLayer = mainLayer;
    this.previewLayer = previewLayer;
    const exportLayer = this.canvas.addLayer("exportLayer", document.getElementById("base-pixel-canvas"), 2, false);
    this.exportLayer = exportLayer;

    this.tools = Object.freeze(initTools());

    this.settings.selectedTool = this.tools.FREE;

    this.createImage = (f) => {
        exportLayer.pixels = mainLayer.pixels;
        exportLayer.render();
        return exportLayer.getBlob();
    }

    /* Undo/Redo button functionality */
    const undoButton = document.getElementById("undo");
    const redoButton = document.getElementById("redo");

    this.undo = () => {
       const pixels =  this.curLayer.getHistory().undo();
       if (pixels != null) {
        this.curLayer.pixels.resetPixels(pixels);
        this.canvas.renderAll();
       }
       updateUndoRedoButtons();
    }

    this.redo = () => {
        const pixels = this.curLayer.getHistory().redo();
        if (pixels != null) {
        this.curLayer.pixels.resetPixels(pixels);
         this.canvas.renderAll();
        }
        updateUndoRedoButtons();
    }

    const updateUndoRedoButtons = () => {
        if (undoButton) undoButton.disabled = !this.enableUndoButton();
        if (redoButton) redoButton.disabled = !this.enableRedoButton();
    };

    this.enableUndoButton = () => {
        return this.curLayer.getHistory().undoStackEnabled();
    }
    this.enableRedoButton = () => {
        return this.curLayer.getHistory().redoStackEnabled();
    }

    // TODO: move this
    setInputStart(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.s(this, ...a);
        this.canvas.renderAll();
        updateUndoRedoButtons();
    }).bind(this));

    setInputMove(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.m(this,...a);
        this.canvas.renderAll();
        updateUndoRedoButtons();
    }).bind(this));

    setInputEnd(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.e(this,...a);
        this.canvas.renderAll();
        updateUndoRedoButtons();
    }).bind(this));

    setInputInterrupt(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.i(this, ...a);
        this.canvas.renderAll();
        updateUndoRedoButtons();
    }).bind(this));

    initToolSelect(this);

}



