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

})

