const getEventCoordinates = (b, f) => ((e) => {
    const rect = b.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * b.width/rect.width);
    const y = Math.floor((e.clientY - rect.top) * b.height/rect.height);
    f(x, y);
})


const setInputStart = (b, f) => {
    b.addEventListener("mousedown", getEventCoordinates(b, f));
}

const setInputMove = (b, f) => {
    b.addEventListener("mousemove", getEventCoordinates(b, f));
}

const setInputEnd = (b, f) => {
    document.addEventListener("mouseup", getEventCoordinates(b, f));
    b.addEventListener("mouseup", getEventCoordinates(b, f));
}

const setInputInterrupt = (b, f) => {
    b.addEventListener("mouseleave", getEventCoordinates(b, f));
}

const setActive = (e) => {
    const toolBtns = Array.from(document.getElementsByClassName("tool-btn"));
    toolBtns.forEach((element) => {
    console.log(element.id);
    if (
        element.id != e.id &&
        element.classList.contains("active-btn")
    ) {
        element.classList.remove("active-btn");
    }
    });
    e.classList.add("active-btn");
}

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

const initToolSelect = (b) => {

    const penButton = document.getElementById("penBtn");
    penButton.addEventListener("click", async (e) => {
      setActive(penButton);
      // call pen tool
      b.setTool(b.tools.FREE);
    });
  
  
    const eraseButton = document.getElementById("eraseBtn");
    eraseButton.addEventListener("click", async (e) => {
        setActive(eraseButton);
        // call erase tool
        b.setTool(b.tools.ERASE);
    });

      
    const lineButton = document.getElementById("lineBtn");
    lineButton.addEventListener("click", async (e) => {
        setActive(lineButton);
        // call erase tool
        b.setTool(b.tools.LINE);
    });

    const bucketButton = document.getElementById("bucketBtn");
    bucketButton.addEventListener("click", async (e) => {
        setActive(bucketButton);
        // call erase tool
        b.setTool(b.tools.FILL);
    });
    
    
    const colorPicker = document.getElementById("colorPicker");
    colorPicker.addEventListener("change", async (e) => {
        console.log(e.target.value);
        //call colour function
        b.setColour(convertToRgba(e.target.value));
    });

    const sizeDropDown = document.getElementById("gridSize");
    b.setSize(parseInt(sizeDropDown.value) ?? 8);
    sizeDropDown.addEventListener("change", (event) => {
      b.setSize(parseInt(event.target.value) ?? 8);
    });
    
}

export {
    setInputEnd,
    setInputMove,
    setInputStart,
    setInputInterrupt,
    initToolSelect
}