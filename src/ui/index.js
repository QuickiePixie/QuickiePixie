import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
  console.log("addOnUISdk is ready for use.");

  // Get the UI runtime.
  const { runtime } = addOnUISdk.instance;
  
  const sandboxProxy = await runtime.apiProxy("documentSandbox");

  /*
   ************************************************************
   */

  const canvas = document.getElementById("pixel-canvas");
  const context = canvas.getContext("2d");

  const overlayCanvas = document.getElementById("overlay-pixel-canvas");
  const overlayContext = overlayCanvas.getContext("2d");

  //define grid size and pixel size
  let gridSize = 128;
  const canvasWidth = canvas.getBoundingClientRect().width;
  const screenScaling = canvas.width / canvasWidth;
  let pixelSize = canvasWidth / gridSize;

  const canvasSettings = {
    brush: "free",
    brushStart: [0, 0],
    currentColor: document.getElementById("colorPicker").value,
    isDrawing: false,
    isErasing: false,
  };

  overlayCanvas.addEventListener("mousedown", (event) => {
    if (canvasSettings.brush == "line") {
      startLine(event);
      canvasSettings.isDrawing = true;
      return;
    } else if (canvasSettings.brush == "fill") {
      console.log("FILLING");
      const rect = canvas.getBoundingClientRect();
      console.log(rect);
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

  overlayCanvas.addEventListener("mousemove", (event) => {
    if (canvasSettings.brush == "free" || canvasSettings.brush === "erase") drawPixel(event);
    if (canvasSettings.brush == "line") drawLinePreview(event);
  });

  overlayCanvas.addEventListener("mouseup", (event) => {
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

  // const pixelArray = new Array(gridSize * gridSize);
  
  function colorPick(x, y) {
    // return pixelArray[y * gridSize + x]
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

  async function fill(x, y, prevColor) {
    console.log(`Filling at (${x}, ${y})`);

    let stack = [[x, y]];
    const visited = new Uint8Array(gridSize * gridSize);
    const newColor = canvasSettings.currentColor;
    const newColorRGBA = convertToRgba(newColor);
    if (colorMatch(prevColor, newColorRGBA)) return;
    console.log("Filling in new color");

    while(stack.length > 0){
        const [curX, curY] = stack.pop();
        if (visited[curY * gridSize + curX]===1) {
          console.log(`Already visited (${curX}, ${curY})`);
        }
        if (curX < 0 || curX >= gridSize || curY < 0 || curY >= gridSize || visited[curY * gridSize + curX]===1) continue;
        const currColor = colorPick(curX, curY);
        if (colorMatch(currColor, prevColor)) {
            context.fillStyle = newColor;
            context.fillRect(
                curX * pixelSize * screenScaling,
                curY * pixelSize * screenScaling,
                pixelSize * screenScaling,
                pixelSize * screenScaling
              );
            visited[curY * gridSize + curX] = 1;
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
    drawLine(startX, startY, x, y);
  }

  function drawLine(px1, py1, px2, py2) {

    const x0 = px1 + 0.5;
    const x1 = px2 + 0.5;
    const y0 = py1 + 0.5;
    const y1 = py2 + 0.5;
    
    const isVertical = Math.floor(x0) == Math.floor(x1);
    const slope = !isVertical ? (y1-y0)/(x1-x0) : 0;

    context.fillStyle = canvasSettings.currentColor;
    
    if (Math.abs(slope) <= 1 && !isVertical) {
      const idealPointFromX = (x) => {
        return slope * (x - x0) + y0;
      }
      const xStep = x0 > x1 ? -1 : 1;

      for (let i = x0; i*xStep <= x1*xStep; i+=xStep) {
        // use center of pixel for line intersection
        const idealY = idealPointFromX(i);
        const drawX = Math.floor(i);
        const drawY = Math.floor(idealY);
        context.fillRect(
          drawX * screenScaling * pixelSize,
          drawY * screenScaling * pixelSize,
          pixelSize * screenScaling,
          pixelSize * screenScaling
        );
      }
    } else {
      const idealPointFromY = (y) => {
        return !isVertical ? ((y - y0) / slope) + x0: x0 ;
      }
      const yStep = y0 < y1 ? 1 : -1;
      
      for (let i = y0; i*yStep <= y1*yStep ; i+= yStep) {
        const idealX = idealPointFromY(i);
        const drawX = Math.floor(idealX);
        const drawY = Math.floor(i);
        context.fillRect(
          drawX * screenScaling * pixelSize,
          drawY * screenScaling * pixelSize,
          pixelSize * screenScaling,
          pixelSize * screenScaling
        );
      }
    }
  }

  function drawLinePreview(event) {
    if (!canvasSettings.isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    overlayContext.clearRect(0, 0, canvas.width, canvas.height);
    const px2 = Math.floor((event.clientX - rect.left) / pixelSize);
    const py2 = Math.floor((event.clientY - rect.top) / pixelSize);
    const px1 = canvasSettings.brushStart[0];
    const py1 = canvasSettings.brushStart[1];


    const x0 = px1 + 0.5;
    const x1 = px2 + 0.5;
    const y0 = py1 + 0.5;
    const y1 = py2 + 0.5;
    
    
    const isVertical = Math.floor(x0) == Math.floor(x1);
    const slope = !isVertical ? (y1-y0)/(x1-x0) : 0;

    overlayContext.fillStyle = canvasSettings.currentColor;
    
    if (Math.abs(slope) <= 1 && !isVertical) {
      const idealPointFromX = (x) => {
        return slope * (x - x0) + y0;
      }
      const xStep = x0 > x1 ? -1 : 1;

      for (let i = x0; i*xStep <= x1*xStep; i+=xStep) {
        // use center of pixel for line intersection
        const idealY = idealPointFromX(i);
        const drawX = Math.floor(i);
        const drawY = Math.floor(idealY);
        overlayContext.fillRect(
          drawX * screenScaling * pixelSize,
          drawY * screenScaling * pixelSize,
          pixelSize * screenScaling,
          pixelSize * screenScaling
        );
      }
    } else {
      const idealPointFromY = (y) => {
        return !isVertical ? ((y - y0) / slope) + x0: x0 ;
      }
      const yStep = y0 < y1 ? 1 : -1;
      
      for (let i = y0; i*yStep <= y1*yStep ; i+= yStep) {
        const idealX = idealPointFromY(i);
        const drawX = Math.floor(idealX);
        const drawY = Math.floor(i);
        overlayContext.fillRect(
          drawX * screenScaling * pixelSize,
          drawY * screenScaling * pixelSize,
          pixelSize * screenScaling,
          pixelSize * screenScaling
        );
      }
    }
  }
  /*
   ************************************************************
   */

  const createDescriptionButton = document.getElementById("createDescription");
  const descriptionText = document.getElementById("descriptionText");
    createDescriptionButton.addEventListener("click", async event => {
        createDescriptionButton.disabled = true;
        canvas.toBlob(async (imageBlob) => {
            const formData = new FormData();
            formData.append("image", imageBlob);
            fetch(`https://imageanalyzer-be03.onrender.com/`, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    data = data.charAt(0).toUpperCase() + data.slice(1) + ".";
                    descriptionText.innerHTML = data;
                    descriptionText.hidden = false;
                }).finally(() => {
                  createDescriptionButton.disabled = false;
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

  const convertToRgba = (hex) => {
    const re = /^#[A-Fa-f0-9]{6}/;
    if (!re.test(hex)) {
      console.error(`Invalid Hex String: ${hex}`);
      throw new Error("Invalid Hex String");
    }
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const a = 255;
    return [r, g, b, a];
  }

    const createImageButton = document.getElementById("addToPage");
    createImageButton.addEventListener("click", async () => {
      const canvas = document.getElementById("pixel-canvas");
      canvas.toBlob(async (imageBlob) => {
        await sandboxProxy.createPixelImage(imageBlob);
      });
    });
    createImageButton.disabled = false;

    
    const downloadImageButton = document.getElementById("downloadImage");
    downloadImageButton.addEventListener("click", async () => {
      downloadImageButton.disabled=true;
      const canvas = document.getElementById("pixel-canvas");
      const link = document.createElement('a');
      link.download = 'quickiepixie.png';
      console.log("IN DOWNLOAD")
      const formData = new FormData();
      canvas.toBlob(async (imageBlob) => {
        formData.append("image", imageBlob)
        fetch(`https://imageanalyzer-be03.onrender.com/image`, {
          method: "POST",
          body: formData
        }).then(res => res.json())
        .then(data =>{
          const id = data.id;
          const elmt = document.getElementById("downloadText");
          elmt.hidden=false;
          downloadImageButton.classList.remove("visible");
          elmt.innerText = `External Link: https://quickie-pixie-docs.vercel.app/image/${id}`;
        }).finally(() => {
          downloadImageButton.disabled=false;
        })
      });
    });
    downloadImageButton.disabled = false;
    createDescriptionButton.disabled = false;
});
