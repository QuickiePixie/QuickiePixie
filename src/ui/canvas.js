import { setInputStart, setInputMove, setInputEnd, initToolSelect } from "./input.js";
import { Render } from "./render.js";
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
        if (this.isOutOfBounds(x,y)) return;
        const idx = this.getIndex(x,y);
        return ({
            r: this.pixels[idx],
            g: this.pixels[idx + 1],
            b: this.pixels[idx + 2],
            a: this.pixels[idx + 3],
        })
    }
    
    getPixels () {
        return this.pixels;
    }
    
    setPixel (x, y, r, g, b, a) {
        console.log("????")
        if (this.isOutOfBounds(x,y)) return;
        const idx = this.getIndex(x,y);
        console.log(`Setting pixel at idx=${idx} to col=${r},${g},${b}, ${a}`)
        this.pixels[idx] = r;
        this.pixels[idx + 1] = g;
        this.pixels[idx + 2] = b;
        this.pixels[idx + 3] = a;
    }
    
    clearPixel (x, y) {
        this.setPixel(x, y, 0, 0, 0, 0);
    }
    
    clearAll() {
        this.pixels.fill(0);
    }
    
}

function QPCanvasLayer (id="layer", elmt, width, height) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.canvas = elmt;
    this.canvas.width = width;
    this.canvas.height = height;
    this.pixels = new QPPixelGrid(width, height);
    this.renderer = new Render(this.canvas);
}

QPCanvasLayer.prototype.render = function () {
    return this.renderer.updateCanvas(this.getBitmap());
}

QPCanvasLayer.prototype.getBitmap = function () {
    return this.pixels.getPixels();
}

//QPCanvasLayer.prototype.render = Render;

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

    addLayer (id, elmt, i = 0) {
        const l = new QPCanvasLayer(id, elmt, this.width, this.height);
        this.layers.splice(i, 0, l);
        return l;
    }

    removeLayer(id) {
        this.layers = this.layers.filter(l => l.id !== id);
    }
}

const QPSettings = Object.seal({
    colour: Object.seal([0,0,0,255]), // rgba
    size: 12,
    selectedTool: null,
});


export function QuickiePixie(){
    
    this.canvas = new QPCanvas(20, 20),
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

    this.getTool = function() {
        return this.settings.selectedTool;
    };
    this.getColour = function() {
        return this.settings.colour;
    }
    this.getSize = function() {
        return this.settings.size;
    };
}

class QPMode {
    constructor(d, s, m, e, init) {
        this.d = Object.seal(d);
        this.s = s.bind(this);
        this.m = m.bind(this);
        this.e = e.bind(this);
        this.o = init;
    }
};

const free = (c) => new QPMode(
    {
        isDrawing: false
    },
    function (x, y) {
        c.curLayer.pixels.setPixel(x, y, ...c.settings.colour);
        this.isDrawing = true;
    },
    function (x, y) {
        this.isDrawing && c.curLayer.pixels.setPixel(x, y, ...c.settings.colour)
    },
    function () {
        this.isDrawing = false;
    },
    function () {
        this.isDrawing = false;
    }
);

const erase = (c) => new QPMode(
    {
        isDrawing: false

    },
    function (x, y) {
        c.curLayer.pixels.clearPixel(x, y);
        this.isDrawing = true;
    },
    function (x, y) {
        c.curLayer.pixels.clearPixel(x, y)
        this.isDrawing = true;
    },
    function () {
        this.isDrawing = false;
    },
    function () {
        this.isDrawing = false;
    }
);

QuickiePixie.prototype.init = function () {

    const inputLayer = this.canvas.addLayer("input", document.getElementById("overlay-pixel-canvas"), 0);
    const previewLayer = inputLayer;//this.canvas.addLayer("preview", document.getElementById("overlay-pixel-canvas"), 1);
    const mainLayer = this.canvas.addLayer("layer1", document.getElementById("pixel-canvas"), 1);
    this.curLayer = mainLayer;
    
    this.tools = Object.freeze({
        FREE: free(this),
        ERASE: erase(this),
        LINE: {
            
        },
    })

    this.settings.selectedTool = this.tools.FREE;

    // TODO: move this
    setInputStart(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.s(...a);
        this.canvas.renderAll();
    }).bind(this));

    setInputMove(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.m(...a);
        this.canvas.renderAll();
    }).bind(this));

    setInputEnd(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.e(...a);
        this.canvas.renderAll();
    }).bind(this));

    initToolSelect(this);

}

