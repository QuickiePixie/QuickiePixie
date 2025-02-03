function QPPixelGrid (width, height) {
    this.width = width;
    this.height = height;
    this.gridSize = width * height;
    this.pixels = new Uint8Array(this.gridSize * 4);
}

QPPixelGrid.prototype.getIndex = function(x, y) {
    return (x * this.width + y) * 4;
}

QPPixelGrid.prototype.getPixel = function(x, y) {
    const idx = this.getIndex(x,y);
    return {
        r: this.pixels[idx],
        g: this.pixels[idx + 1],
        b: this.pixels[idx + 2],
        a: this.pixels[idx + 3]
    }
}

QPPixelGrid.prototype.getPixels = function() {
    return this.pixels;
}

QPPixelGrid.prototype.setPixel = function (x, y, r, g, b, a) {
    const idx = this.getIndex(x,y);
    this.pixels[idx] = r;
    this.pixels[idx + 1] = g;
    this.pixels[idx + 2] = b;
    this.pixels[idx + 3] = a;
}

QPPixelGrid.prototype.clearAll() = function() {
    this.pixels.fill(0);
}

/*
function QPCanvasContext (canvas, scale = 1) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.scale = 1; // scale is canvas screen width / canvas width
}

QPCanvasContext.prototype.clearAll = function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
} 

QPCanvasContext.prototype.drawPixel =  function (x, y, style) {
    this.context.fillStyle = style;
    this.context.fillRect(
        x * scale,
        y * scale,
        scale,
        scale
    )
}

QPCanvasContext.prototype.clearPixel =  function (x, y) {
    this.context.clearRect(
        x * scale,
        y * scale,
        scale,
        scale
    )
}*/

function QPCanvasLayer (width, height) {
    this.width = width;
    this.height = height;
    this.pixelGrid = new QPPixelGrid(width, height);
}

QPCanvasLayer.prototype.getBitmap = function () {
    return this.pixelGrid.getPixels();
}

QPCanvasLayer.prototype.render = Render;

/*
QPCanvasLayer.prototype.clearAll = function () {
    this.pixelGrid.clearAll();
    this.canvas.clearAll();
}
*/

function QPCanvas (name) {
    this.name = name;
}