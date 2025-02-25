import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { QuickiePixie } from "./canvas.mjs";

addOnUISdk.ready.then(async () => {

    const { runtime } = addOnUISdk.instance;

    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const app = new QuickiePixie();

    app.init();

    const createImageButton = document.getElementById("addToPage");
    createImageButton.addEventListener("click", async () => {
        app.createImage()
            .then(async blob => await sandboxProxy.createPixelImage(blob));
    });
    createImageButton.disabled = false;

    const downloadImageButton = document.getElementById("downloadImage");
    downloadImageButton.addEventListener("click", async () => {
        const canvas = document.getElementById("pixel-canvas");
        const link = document.createElement('a');
        link.download = 'quickiepixie.png';
        canvas.toBlob(async (imageBlob) => {
            const displaylink = document.createElement('a');
            const url = URL.createObjectURL(imageBlob);
            displaylink.href = url;
            displaylink.download = "quickiepixie.png"
            displaylink.click()
        }, 'image/png');
    });
    downloadImageButton.disabled = false;

})

