import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
  console.log("addOnUISdk is ready for use.");

  // Get the UI runtime.
  const { runtime } = addOnUISdk.instance;

  // Get the proxy object, which is required
  // to call the APIs defined in the Document Sandbox runtime
  // i.e., in the `code.js` file of this add-on.
  const sandboxProxy = await runtime.apiProxy("documentSandbox");

  /*
   ************************************************************
   */

  const canvas = document.getElementById("pixel-canvas");
  const context = canvas.getContext("2d");

  //define grid size and pixel size
  let gridSize = 128;
  const canvasWidth = canvas.getBoundingClientRect().width;
  const screenScaling = canvas.width / canvasWidth;
  let pixelSize = canvasWidth / gridSize;

  const canvasSettings = {
    brush: "free",
    brushStart: [0, 0],
    currentColor: "black",
    isDrawing: false,
    isErasing: false,
  };

  canvas.addEventListener("mousedown", (event) => {
    if (canvasSettings.brush == "line") {
      startLine(event);
      return;
    } else if (canvasSettings.brush == "fill") {
      console.log("FILLING");
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / pixelSize);
      const y = Math.floor((event.clientY - rect.top) / pixelSize);
      const prevColor = colorPick(x, y);
      console.log(prevColor);
      fill(x, y, prevColor);
      return;
    } else if (canvasSettings.brush == "erase") {
      canvasSettings.isErasing = true;
    }
      canvasSettings.isDrawing = true;
      drawPixel(event);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (canvasSettings.brush == "free" || canvasSettings.brush === "erase") drawPixel(event);
  });

  canvas.addEventListener("mouseup", (event) => {
    if (canvasSettings.brush == "line") {
      endLine(event);
    }
    canvasSettings.isErasing = false;
    canvasSettings.isDrawing = false;
    context.beginPath();
  });

  let gridDropDown = document.getElementById("gridSize");
  gridDropDown.addEventListener("change", (event) => {
    gridSize = parseInt(event.target.value);
    pixelSize = canvasWidth / gridSize;
    console.log(gridSize);
  });

  function drawPixel(event) {
    if (!canvasSettings.isDrawing) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    console.log(rect);
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);

    console.log(`Drawing at (${x}, ${y})`);

    context.fillStyle = canvasSettings.currentColor;
    if (canvasSettings.isErasing) {
      context.clearRect(
        x * pixelSize * screenScaling,
        y * pixelSize * screenScaling,
        pixelSize * screenScaling,
        pixelSize * screenScaling
      );
      console.log("Erasing");
    } else {
      context.fillRect(
        x * pixelSize * screenScaling,
        y * pixelSize * screenScaling,
        pixelSize * screenScaling,
        pixelSize * screenScaling
      );
    }
  }

  function colorPick(x, y) {
    const pixelData = context.getImageData(
      x * pixelSize * screenScaling + 1,
      y * pixelSize * screenScaling + 1,
      1,
      1
    ).data;
    return pixelData;
  }

  function colorMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  function fill(x, y, prevColor) {
    console.log(`Filling at (${x}, ${y})`);

    let stack = [[x, y]];
    console.log("stack", JSON.stringify(stack));
    const newColor = canvasSettings.currentColor;

    while(stack.length > 0){
        const [curX, curY] = stack.pop();
        if (curX < 0 || curX >= gridSize || curY < 0 || curY >= gridSize) continue;
        const currColor = colorPick(curX, curY);
        if (colorMatch(currColor, prevColor)) {
            context.fillStyle = newColor;
            context.fillRect(
                curX * pixelSize * screenScaling,
                curY * pixelSize * screenScaling,
                pixelSize * screenScaling,
                pixelSize * screenScaling
              );
            stack.push([curX+1, curY]);
            stack.push([curX-1, curY]);
            stack.push([curX, curY+1]);
            stack.push([curX, curY-1]);
        }
    }
  }

  function startLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    canvasSettings.brushStart = [x, y];
  }

  function endLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    const startX = canvasSettings.brushStart[0];
    const startY = canvasSettings.brushStart[1];

    let curX;
    let curY;

    let fullSlope = 0;
    if (x != startX && y != startY) fullSlope = (y - startY) / (x - startX);
    else if (x == startX) fullSlope = y - startY;
    else fullSlope = 0;
    const x0 = Math.min(startX, x);
    const x1 = Math.max(startX, x);
    curY = (x0 == startX ? startY : y) + 0.5;
    for (let i = x0; i <= x1; i += 1) {
      curX = i;
      curY += x0 == startX ? fullSlope : fullSlope;
      context.fillStyle = canvasSettings.currentColor;
      const drawX = curX * screenScaling;
      for (let j = 0; j <= Math.abs(fullSlope); j++) {
        const drawY = Math.floor(curY - j * Math.sign(fullSlope));
        if (drawY >= Math.min(startY, y) && drawY <= Math.max(y, startY))
          context.fillRect(
            drawX * pixelSize,
            drawY * screenScaling * pixelSize,
            pixelSize * screenScaling,
            pixelSize * screenScaling
          );
        else break;
      }
    }
  }

  /*
   ************************************************************
   */

  const createDescriptionButton = document.getElementById("createDescription");
  const descriptionText = document.getElementById("descriptionText");
    createDescriptionButton.addEventListener("click", async event => {
        canvas.toBlob(async (imageBlob) => {
            const formData = new FormData();
            formData.append("image", imageBlob);
            fetch(`http://localhost:3000/`, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    descriptionText.innerHTML = data;
                    descriptionText.hidden = false;
                })        
        }); 
    });

  const penButton = document.getElementById("penBtn");
  penButton.addEventListener("click", async (e) => {
    let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
    toolBtns.forEach((element) => {
      console.log(element.id);
      if (
        element.id != e.target.id &&
        element.classList.contains("active-btn")
      ) {
        element.classList.remove("active-btn");
      }
    });
    penButton.classList.add("active-btn");

    // call pen tool
    canvasSettings.brush = "free";
  });

  const lineButton = document.getElementById("lineBtn");
  lineButton.addEventListener("click", async (e) => {
    let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
    toolBtns.forEach((element) => {
      console.log(element.id);
      if (
        element.id != e.target.id &&
        element.classList.contains("active-btn")
      ) {
        element.classList.remove("active-btn");
      }
    });
    lineButton.classList.add("active-btn");

    // call pen tool
    canvasSettings.brush = "line";
  });

  const eraseButton = document.getElementById("eraseBtn");
  eraseButton.addEventListener("click", async (e) => {
    let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
    toolBtns.forEach((element) => {
      console.log(element.id);
      if (
        element.id != e.target.id &&
        element.classList.contains("active-btn")
      ) {
        element.classList.remove("active-btn");
      }
    });
    eraseButton.classList.add("active-btn");

    // call erase tool
    canvasSettings.brush = "erase";
  });

  const bucketButton = document.getElementById("bucketBtn");
  bucketButton.addEventListener("click", async (e) => {
    let toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
    toolBtns.forEach((element) => {
      console.log(element.id);
      if (
        element.id != e.target.id &&
        element.classList.contains("active-btn")
      ) {
        element.classList.remove("active-btn");
      }
    });
    bucketButton.classList.add("active-btn");

    // call bucket tool
    canvasSettings.brush = "fill";
  });

  const colorPicker = document.getElementById("colorPicker");
  colorPicker.addEventListener("change", async (e) => {
    console.log(e.target.value);
    //call colour function
    canvasSettings.currentColor = e.target.value;
  });

    // Enable the button only when:
    // 1. `addOnUISdk` is ready,
    // 2. `sandboxProxy` is available, and
    // 3. `click` event listener is registered.
    const createImageButton = document.getElementById("addToPage");
    createImageButton.addEventListener("click", async () => {
      const canvas = document.getElementById("pixel-canvas");
      canvas.toBlob(async (imageBlob) => {
        await sandboxProxy.createPixelImage(imageBlob);
      });
    });
    createImageButton.disabled = false;

    /**
    const downloadImageButton = document.getElementById("downloadImage");
    downloadImageButton.addEventListener("click", async () => {
      const canvas = document.getElementById("pixel-canvas");
      const link = document.createElement('a');
      link.download = 'quickiepixie.png';
      console.log("IN DOWNLOAD")
      canvas.toBlob(async (imageBlob) => {
        link.href = canvas.toDataURL();
        console.log("DOWNLOADING")
        link.click();
        console.log("DOWNLOADED")
      });
    });
    downloadImageButton.disabled = false;**/
    createDescriptionButton.disabled = false;
});
