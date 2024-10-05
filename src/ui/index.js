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
  const canvasHeight = canvas.getBoundingClientRect().height;
  const screenScaling = canvas.width / canvasWidth;
  const pixelSize = canvasWidth / gridSize;

  const canvasSettings = {
    brush: "line",
    brushStart: [0, 0],
    currentColor: "black",
    isDrawing: false,
  };

  document.getElementById("pen-tool").addEventListener("click", () => {
    canvasSettings.brush = "free";
  });

  document.getElementById("eraser-tool").addEventListener("click", () => {
    canvasSettings.brush = "free";
    canvasSettings.currentColor = "rgba(0, 0, 0, 1)";
    console.log("Eraser selected");
  });

  document.getElementById("fill-tool").addEventListener("click", () => {
    canvasSettings.brush = "fill";
    console.log("Fill selected");
  });

  document.getElementById("line-tool").addEventListener("click", () => {
    canvasSettings.brush = "line";
  });

  canvas.addEventListener("mousedown", (event) => {
    if (canvasSettings.brush == "line") {
      startLine(event);
    } else if (canvasSettings.brush == "fill") {
        console.log("FILLING");
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / pixelSize);
      const y = Math.floor((event.clientY - rect.top) / pixelSize);
      const prevColor = colorPick(x, y);
      console.log(prevColor);
      fill(x, y, prevColor);
    }else{
        canvasSettings.isDrawing = true;
        drawPixel(event);
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (canvasSettings.brush == "free") drawPixel(event);
  });

  canvas.addEventListener("mouseup", () => {
    if (canvasSettings.brush == "line") {
      console.log("ENDING LINE");
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
    console.log(rect);
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);

    console.log(`Drawing at (${x}, ${y})`);

    context.fillStyle = canvasSettings.currentColor;
    context.fillRect(
      x * pixelSize * screenScaling,
      y * pixelSize * screenScaling,
      pixelSize * screenScaling,
      pixelSize * screenScaling
    );
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

    let stack = [[x,y]];
    console.log("stack", JSON.stringify(stack));
    const newColor = canvasSettings.currentColor;

    while(stack.length > 0){
        console.log("stack entering the loop", JSON.stringify(stack));
        const [curX, curY] = stack.pop();
        if (curX < 0 || curX >= gridSize || curY < 0 || curY >= gridSize) continue;
        const currColor = colorPick(curX, curY);
        console.log(`Current color: ${currColor}, Previous color: ${prevColor}`);
        console.log(typeof currColor, typeof prevColor);
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
        console.log("stack leaving the loop", JSON.stringify(stack));
    }
  }

  function startLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x =
      Math.floor((event.clientX - rect.left) / pixelSize) * screenScaling;
    const y =
      Math.floor((event.clientY - rect.top) / pixelSize) * screenScaling;
    canvasSettings.brushStart = [x, y];
  }

  function endLine(event) {
    const rect = canvas.getBoundingClientRect();
    const x =
      Math.floor((event.clientX - rect.left) / pixelSize) * screenScaling;
    const y =
      Math.floor((event.clientY - rect.top) / pixelSize) * screenScaling;
    const startX = canvasSettings.brushStart[0];
    const startY = canvasSettings.brushStart[1];

    let curX = startX;
    let curY = startY;

    while (curX !== x || curY !== y) {
      console.log(`Curx: ${curX}, Cury: ${curY}`);
      const maxDist = Math.max(Math.abs(curX - x), Math.abs(curY - y));
      const xStep = (x - curX) / maxDist;
      const yStep = (y - curY) / maxDist;

      if (curX != x) curX += xStep;
      if (curY != y) curY += yStep;
      console.log(`xStep: ${xStep} yStep: ${yStep}`);

      curX = Math.floor(curX);
      curY = Math.floor(curY);

      context.fillStyle = canvasSettings.currentColor;
      context.fillRect(
        curX * pixelSize,
        curY * pixelSize,
        pixelSize * screenScaling,
        pixelSize * screenScaling
      );
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
