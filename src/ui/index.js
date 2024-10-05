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
  const gridSize = 32;
  const canvasWidth = canvas.getBoundingClientRect().width;
  const screenScaling = canvas.width / canvasWidth;
  const pixelSize = canvasWidth / gridSize;
  console.log(`Pixel size: ${pixelSize}, Canvas width: ${canvasWidth}`);

  const canvasSettings = {
    brush: "line",
    brushStart: [0,0],
    currentColor: "black",
    isDrawing: false,
  }
  
  document.getElementById('pen-tool').addEventListener('click', () => {
    canvasSettings.brush = 'free';
  });

  document.getElementById('eraser-tool').addEventListener('click', () => {
    canvasSettings.brush = 'free';
    canvasSettings.currentColor = "rgba(0, 0, 0, 1)";
    console.log("Eraser selected");
  });
  
  document.getElementById('fill-tool').addEventListener('click', () => {
    canvasSettings.brush = 'fill';
  });
  
  document.getElementById('line-tool').addEventListener('click', () => {
    canvasSettings.brush = 'line';
  });

  canvas.addEventListener("mousedown", (event) => {
    if (canvasSettings.brush == "line") {
      startLine(event);
    }
    else if (canvasSettings.brush == "fill") {
        
      fill(x, y, prevColor);
    }
    canvasSettings.isDrawing = true;
    drawPixel(event);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (canvasSettings.brush == "free")
      drawPixel(event);
  });

  canvas.addEventListener("mouseup", () => {
    if (canvasSettings.brush == "line") {
      console.log("ENDING LINE")
      endLine(event);
    }
    canvasSettings.isDrawing = false;
    context.beginPath();
  });

  function drawPixel(event) {
    if (!canvasSettings.isDrawing) {     
      return;
    }
    const rect = canvas.getBoundingClientRect();
    console.log(rect)
    const x = Math.floor((event.clientX - rect.left)/pixelSize) * screenScaling;
    const y = Math.floor((event.clientY - rect.top)/pixelSize) * screenScaling;

    console.log(`Drawing at (${x}, ${y})`);

    context.fillStyle = canvasSettings.currentColor;
    context.fillRect(x*pixelSize, y*pixelSize, pixelSize * screenScaling, pixelSize * screenScaling);

  }

  function fill(event) {
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((event.clientX - rect.left)/pixelSize) * screenScaling;
    const y = Math.floor((event.clientY - rect.top)/pixelSize) * screenScaling;
    
  }

  function startLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left)/pixelSize) * screenScaling;
    const y = Math.floor((event.clientY - rect.top)/pixelSize) * screenScaling;
    canvasSettings.brushStart = [x,y];
  }

  function endLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left)/pixelSize) * screenScaling;
    const y = Math.floor((event.clientY - rect.top)/pixelSize) * screenScaling;
    const startX = canvasSettings.brushStart[0];
    const startY = canvasSettings.brushStart[1];

    let curX = startX;
    let curY = startY;
    
    while (curX !== x || curY !== y) {
      console.log(`Curx: ${curX}, Cury: ${curY}`)
      const maxDist = Math.max(Math.abs(curX - x), Math.abs(curY - y));
      const xStep = ((x - curX)/maxDist)
      const yStep = ((y - curY)/maxDist)
  
      if (curX != x)
        curX += xStep;
      if (curY != y)
        curY += yStep;
      console.log( `xStep: ${xStep} yStep: ${yStep}`)

      curX = Math.floor(curX);
      curY = Math.floor(curY);
      
      context.fillStyle = canvasSettings.currentColor;
      context.fillRect(curX*pixelSize, curY*pixelSize, pixelSize * screenScaling, pixelSize * screenScaling);
    }
  }

  /*
   ************************************************************
   */

  const createRectangleButton = document.getElementById("createRectangle");
  createRectangleButton.addEventListener("click", async (event) => {
    await sandboxProxy.createRectangle();
  });

  // Enable the button only when:
  // 1. `addOnUISdk` is ready,
  // 2. `sandboxProxy` is available, and
  // 3. `click` event listener is registered.
  createRectangleButton.disabled = false;
});
