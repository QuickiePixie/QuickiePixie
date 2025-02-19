export class Render {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.context = canvasElement.getContext("bitmaprenderer");
        this.context.imageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.msImageSmoothingEnabled = false;
        this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        this.offscreenContext = this.offscreenCanvas.getContext("bitmaprenderer");
    }

    async updateCanvas(pixels) {
        const imageData = new ImageData(pixels, this.canvas.width, this.canvas.height);
        const bitmap = await createImageBitmap(imageData);
        this.context.transferFromImageBitmap(bitmap);
    }

    async createBlob (pixels) {
        const imageData = new ImageData(pixels, this.canvas.width, this.canvas.height);
        const bitmap = await createImageBitmap(imageData);
        this.offscreenContext.transferFromImageBitmap(bitmap);
        return await this.offscreenCanvas.convertToBlob();
    }

}