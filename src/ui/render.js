export class Render {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.context = canvasElement.getContext("bitmaprenderer");
    }

    async updateCanvas(pixels) {
        const imageData = new ImageData(pixels, this.canvas.width, this.canvas.height);
        const bitmap = await createImageBitmap(imageData);
        this.context.transferFromImageBitmap(bitmap);
    }
}