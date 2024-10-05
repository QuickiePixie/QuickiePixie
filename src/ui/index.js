import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    // Get the UI runtime.
    const { runtime } = addOnUISdk.instance;

    // Get the proxy object, which is required
    // to call the APIs defined in the Document Sandbox runtime
    // i.e., in the `code.js` file of this add-on.
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const createRectangleButton = document.getElementById("createRectangle");
    createRectangleButton.addEventListener("click", async event => {
        await sandboxProxy.createRectangle();
    });
    
    const penButton = document.getElementById("penBtn");
    penButton.addEventListener("click", async (e) => {
        let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
        toolBtns.forEach(element => {
            console.log(element.id)
            if (element.id != e.target.id && element.classList.contains("active-btn")) {
                element.classList.remove("active-btn");
            }
        });
        penButton.classList.add("active-btn");

        // call pen tool
    })

    const eraseButton = document.getElementById("eraseBtn");
    eraseButton.addEventListener("click", async (e) => {
        let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
        toolBtns.forEach(element => {
            console.log(element.id)
            if (element.id != e.target.id && element.classList.contains("active-btn")) {
                element.classList.remove("active-btn");
            }
        });
        eraseButton.classList.add("active-btn");

        // call erase tool
    })

    const bucketButton = document.getElementById("bucketBtn");
    bucketButton.addEventListener("click", async (e) => {
        let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
        toolBtns.forEach(element => {
            console.log(element.id)
            if (element.id != e.target.id && element.classList.contains("active-btn")) {
                element.classList.remove("active-btn");
            }
        });
        bucketButton.classList.add("active-btn");

        // call bucket tool
    })

    const colorPicker = document.getElementById("colorPicker");
    colorPicker.addEventListener("change", async (e) => {
        console.log(e.target.value);
        //call colour function
    })

    // Enable the button only when:
    // 1. `addOnUISdk` is ready,
    // 2. `sandboxProxy` is available, and
    // 3. `click` event listener is registered.
    createRectangleButton.disabled = false;
});
