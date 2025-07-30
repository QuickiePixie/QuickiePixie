class QPMode {
    
    constructor({ d={}, s=()=>{}, m=()=>{}, e=()=>{}, i=()=>{}, init=()=>{}}) {
        console.log("Initing tool")
        console.log(d);
        console.log(s)
        this.d = Object.seal(d);
        this.s = s.bind(this);
        this.m = m.bind(this);
        this.e = e.bind(this);        
        this.i = i.bind(this);
        this.init = init;
    }

    setAction(a, f) {
        if (a in ["s", "m", "e", "i", "init"])
            this[a] = f.bind(this);
    }

};

const colorMatch = (a, b) => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

const createLine = (c, sX, sY, eX, eY) => {

    const x0 = sX + 0.5;
    const x1 = eX + 0.5;
    const y0 = sY + 0.5;
    const y1 = eY + 0.5;
    
    
    const isVertical = Math.floor(x0) == Math.floor(x1);
    const slope = !isVertical ? (y1-y0)/(x1-x0) : 0;
    const step = Math.max(c.settings.size / 2, c.settings.baseSize);

    let pixels = c.getSizedPixels(x1, y1)
    if (Math.abs(slope) <= 1 && !isVertical) {
        const idealPointFromX = (x) => {
            return slope * (x - x0) + y0;
        }
        const xStep = x0 > x1 ? -1 : 1;

        for (let i = x0; i*xStep <= x1*xStep; i+=step*xStep) {
            // use center of pixel for line intersection
            const idealY = idealPointFromX(i);
            const lineX = Math.floor(i);
            const lineY = Math.floor(idealY);
            pixels = pixels.concat(c.getSizedPixels(lineX, lineY))
        }
    } else {
        const idealPointFromY = (y) => {
            return !isVertical ? ((y - y0) / slope) + x0: x0 ;
        }
        const yStep = y0 < y1 ? 1 : -1;
        
        for (let i = y0; i*yStep <= y1*yStep; i+= step*yStep) {
            const idealX = idealPointFromY(i);
            const lineX = Math.floor(idealX);
            const lineY = Math.floor(i);
            pixels = pixels.concat(c.getSizedPixels(lineX, lineY))
        }
    }
    return new Set(pixels);
}

const drawLine = (c, context, sX, sY, eX, eY, ...rgb) => {
    context.pixels.setPixels(createLine(c, sX, sY, eX, eY), ...rgb);
}

const eraseLine = (c, context, sX, sY, eX, eY) => {
    context.pixels.clearPixels(createLine(c, sX, sY, eX, eY));
}

const drawLinePreview = (c, ...args) => {
    c.previewLayer.clearAll();
    drawLine(c, c.previewLayer, ...args)
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


const tools = {
    free: {
        d: { isDrawing: false, latestPoint: null, pixelsedited: [] },
        s: function (c, x, y) {
            c.curLayer.pixels.setPixels(c.getSizedPixels(x, y), ...c.settings.colour);
            this.d.isDrawing = true;
            this.d.latestPoint = [x, y]
        },
        m: function (c, x, y) {
            this.d.isDrawing && ((this.d.latestPoint && drawLine(
                c,
                c.curLayer, 
                ...this.d.latestPoint, 
                x, 
                y, 
                ...c.settings.colour
            )) || c.curLayer.pixels.setPixels(c.getSizedPixels(x, y), ...c.settings.colour));//c.curLayer.pixels.setPixels(c.getSizedPixels(x, y), ...c.settings.colour) && 
            this.d.latestPoint = [x, y];
        },
        e: function (c) {
            this.d.isDrawing = false;
            this.d.latestPoint = null;
            c.curLayer.pixels.getPixelHistory().saveToUndoStack(c.curLayer.pixels.getPixels());
        },
        i: function () {
            this.d.latestPoint = null;
        },
        init: function () {
            this.d.isDrawing = false;
            this.d.latestPoint = null;
        }

    },
    line: {
        d: {
            lineStart: [null, null],
            lineEnd: [],
            isDrawing: false
        },
        s: function (c, x, y) {
            this.d.isDrawing = true;
            this.d.lineStart = [x,y];
        },
        m: function (c, x, y) {
            this.d.isDrawing && drawLinePreview(
                c,
                ...this.d.lineStart,
                x,
                y,
                ...c.settings.colour
            );
        },
        e: function (c, x, y) {
            this.d.isDrawing && drawLine(
                c,
                c.curLayer, 
                ...this.d.lineStart, 
                x, 
                y, 
                ...c.settings.colour
            );
            c.previewLayer.clearAll();
            this.d.isDrawing = false;
            c.curLayer.pixels.getPixelHistory().saveToUndoStack(c.curLayer.pixels.getPixels())
        },
        init: function () {
            this.d.isDrawing = false;
        }
    },
    erase: {
        d: {
            isDrawing: false,
            latestPoint: null
        },
        s: function (c, x, y) {
            c.curLayer.pixels.clearPixels(c.getSizedPixels(x,y));
            this.d.isDrawing = true;
            this.d.latestPoint = [x, y]
        },
        m: function (c, x, y) {
            this.d.isDrawing && ((this.d.latestPoint && eraseLine(
                c,
                c.curLayer, 
                ...this.d.latestPoint, 
                x, 
                y
            )) || c.curLayer.pixels.clearPixels(c.getSizedPixels(x,y)));
            this.d.latestPoint = [x, y];
        },
        e: function (c) {
            this.d.isDrawing = false;
            this.d.latestPoint = null;
            c.curLayer.pixels.getPixelHistory().saveToUndoStack(c.curLayer.pixels.getPixels())
        },
        init: function () {
            this.d.isDrawing = false;
            this.d.latestPoint = null;
        },
        i: function () {
            this.d.latestPoint = null;
        }
    },
    fill: {
        s: function(c,x,y) {
            createFill(c.curLayer, x, y, c.settings.colour);
        },
        e: function (c) {
            c.curLayer.pixels.getPixelHistory().saveToUndoStack(c.curLayer.pixels.getPixels())
        }
    }
}



export const initTools = () => ({

    FREE: new QPMode(tools.free),
    LINE: new QPMode(tools.line),
    FILL: new QPMode(tools.fill),
    ERASE: new QPMode(tools.erase),

})