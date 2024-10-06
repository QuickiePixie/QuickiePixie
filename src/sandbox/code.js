import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start() {
    // APIs to be exposed to the UI runtime
    const sandboxApi = {
        createPixelImage: async (blob) => {
            const bitmapImage = await editor.loadBitmapImage(blob)
            editor.queueAsyncEdit(() => {
                const imageContainer = editor.createImageContainer(bitmapImage)
                const insertionParent = editor.context.insertionParent;
                insertionParent.children.append(imageContainer);
            })
        }
    };

    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
