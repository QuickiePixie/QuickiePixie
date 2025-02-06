import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { QuickiePixie } from "./canvas.js";

addOnUISdk.ready.then(async () => {

    const { runtime } = addOnUISdk.instance;
  
    const sandboxProxy = await runtime.apiProxy("documentSandbox");
    
    const app = new QuickiePixie();
    app.init();

})

