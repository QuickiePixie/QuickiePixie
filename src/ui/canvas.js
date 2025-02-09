import { setInputStart, setInputMove, setInputEnd, setInputInterrupt, initToolSelect } from "./input.js";
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
        if (this.isOutOfBounds(x,y)) return null;
        const idx = this.getIndex(x,y);
        return this.pixels.slice(idx, idx+4);/*({
            r: this.pixels[idx],
            g: this.pixels[idx + 1],
            b: this.pixels[idx + 2],
            a: this.pixels[idx + 3],
        })*/
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

QPCanvasLayer.prototype.clearAll = function () {
    return this.pixels.clearAll();
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
    constructor(d={}, s=()=>{}, m=()=>{}, e=()=>{}, i=()=>{}, init=()=>{}) {
        this.d = Object.seal(d);
        this.s = s.bind(this);
        this.m = m.bind(this);
        this.e = e.bind(this);        
        this.i = i.bind(this);
        this.init = init;
    }
};

const free = (c) => new QPMode(
    {
        isDrawing: false
    },
    function (x, y) {
        c.curLayer.pixels.setPixel(x, y, ...c.settings.colour);
        this.d.isDrawing = true;
    },
    function (x, y) {
        this.d.isDrawing && c.curLayer.pixels.setPixel(x, y, ...c.settings.colour)
    },
    function () {
        this.d.isDrawing = false;
    },
    () => {},
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
        this.d.isDrawing = true;
    },
    function (x, y) {
        this.d.isDrawing && c.curLayer.pixels.clearPixel(x, y)
    },
    function () {
        this.d.isDrawing = false;
    },
    () => {},
    function () {
        this.d.isDrawing = false;
    }
);

const createLine = (context, sX, sY, eX, eY, ...rgb) => {

    const x0 = sX + 0.5;
    const x1 = eX + 0.5;
    const y0 = sY + 0.5;
    const y1 = eY + 0.5;
    
    
    const isVertical = Math.floor(x0) == Math.floor(x1);
    const slope = !isVertical ? (y1-y0)/(x1-x0) : 0;
    
    if (Math.abs(slope) <= 1 && !isVertical) {
        const idealPointFromX = (x) => {
            return slope * (x - x0) + y0;
        }
        const xStep = x0 > x1 ? -1 : 1;

        for (let i = x0; i*xStep <= x1*xStep; i+=xStep) {
            // use center of pixel for line intersection
            const idealY = idealPointFromX(i);
            const lineX = Math.floor(i);
            const lineY = Math.floor(idealY);
            context.pixels.setPixel(lineX, lineY, ...rgb);
        }
    } else {
        const idealPointFromY = (y) => {
            return !isVertical ? ((y - y0) / slope) + x0: x0 ;
        }
        const yStep = y0 < y1 ? 1 : -1;
        
        for (let i = y0; i*yStep <= y1*yStep ; i+= yStep) {
            const idealX = idealPointFromY(i);
            const lineX = Math.floor(idealX);
            const lineY = Math.floor(i);
            context.pixels.setPixel(lineX, lineY, ...rgb);
        }
    }
}

const drawLinePreview = (c, ...args) => {
    c.previewLayer.clearAll();
    createLine(c.previewLayer, ...args)
}

const line = (c) => { 
    
    return new QPMode(
        {
            lineStart: [null, null],
            lineEnd: [],
            isDrawing: false
        },
        function (x, y) {
            this.d.isDrawing = true;
            this.d.lineStart = [x,y];
        },
        function (x, y) {
            this.d.isDrawing && drawLinePreview(
                c, 
                ...this.d.lineStart,
                x,
                y,
                ...c.settings.colour
            );
        },
        function (x, y) {
            this.d.isDrawing && createLine(
                c.curLayer, 
                ...this.d.lineStart, 
                x, 
                y, 
                ...c.settings.colour
            );
            c.previewLayer.clearAll();
            this.d.isDrawing = false;
        },
        undefined,
        function () {
            this.d.isDrawing = false;
        }
    )
}

function colorMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

const createFill = (context, x, y, rgb) => {

    const prevColor = context.pixels.getPixel(x, y);

    console.log(`Filling at (${x}, ${y})`);

    let stack = [[x, y]];
    const visited = new Uint8Array(context.width * context.height);
    const newColor = rgb;

    if (colorMatch(prevColor, newColor)) return;

    console.log("Filling in new color");
    console.log(prevColor);
    console.log(newColor)

    const w = context.width;
    const h = context.height;

    while(stack.length > 0){
        const [curX, curY] = stack.pop();
        if (curX < 0 || curX >= w || curY < 0 || curY >= h || visited[curY * w + curX]===1) continue;
        if (visited[curY * w + curX]===1) {
            console.log(`Already visited (${curX}, ${curY})`);
        }
        const currColor = context.pixels.getPixel(curX, curY);

        if (currColor && colorMatch(currColor, prevColor)) {
            context.pixels.setPixel(curX, curY, ...newColor);
            visited[curY * w + curX] = 1;
            stack.push([curX+1, curY]);
            stack.push([curX-1, curY]);
            stack.push([curX, curY+1]);
            stack.push([curX, curY-1]);
        }

    }
      
}

const fill = (c) => { 
    
    return new QPMode(
        {},
        function(x,y) {
            createFill(c.curLayer, x, y, c.settings.colour);
        },
        undefined,
        undefined,
        undefined,
        undefined
    )
}

QuickiePixie.prototype.init = function () {

    const inputLayer = this.canvas.addLayer("input", document.getElementById("overlay-pixel-canvas"), 0);
    const previewLayer = inputLayer;//this.canvas.addLayer("preview", document.getElementById("overlay-pixel-canvas"), 1);
    const mainLayer = this.canvas.addLayer("layer1", document.getElementById("pixel-canvas"), 1);
    this.curLayer = mainLayer;
    this.previewLayer = previewLayer;

    this.tools = Object.freeze({
        FREE: free(this),
        ERASE: erase(this),
        LINE: line(this),
        FILL: fill(this)
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

    setInputInterrupt(inputLayer.canvas, ((...a) => {
        this.settings.selectedTool.i(...a);
        this.canvas.renderAll();
    }).bind(this));

    initToolSelect(this);

}

