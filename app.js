// Global selections and variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const adjustButton = document.querySelectorAll('.adjust');
const lockButton = document.querySelectorAll('.lock');
const closeAdjustments = document.querySelectorAll('.close-adjustment');
const sliderContainers = document.querySelectorAll('.sliders');
let initialColors;
//for local storage
let savedPalettes = [];

/*========================
== Add Event Listeners ===
==========================*/

generateBtn.addEventListener('click', randomColors);

sliders.forEach(slider => {
    slider.addEventListener("input", hslControls);
});

colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index);
    })
})

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    })
})

popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popup.classList.remove('active');
    popupBox.classList.remove('active');
})

adjustButton.forEach((button, index) => {
    button.addEventListener('click', ()=> {
        openAdjustmentPanel(index);
    })
})

closeAdjustments.forEach((button, index) => {
    button.addEventListener('click', ()=> {
        closeAdjustmentPanel(index);
    })
})

lockButton.forEach((button, index) => {
    button.addEventListener('click', ()=> {
        lockColor(index);
    })
})


/*=====================
=====FUNCTIONS ========
=======================*/

/* 
* Color Generator using chroma.js library
*/
function generateHex() {
    const hexColor = chroma.random();
    return hexColor;
}

/* 
* set lock btn class if toggled
*/
function lockColor(index) {
    colorDivs[index].classList.toggle('locked');
    lockButton[index].children[0].classList.toggle('fa-lock-open');
    lockButton[index].children[0].classList.toggle('fa-lock');
}

// Generate random colors
function randomColors() {
    //initial 
    initialColors = [];
    colorDivs.forEach((div, index) => {
        // console.log(div.children);
        const hexText = div.children[0];
        const randomColor = generateHex();
        //add it to array
        if(div.classList.contains('locked')){
            initialColors.push(hexText.innerText);
            return;
        } else {
            initialColors.push(chroma(randomColor).hex());
        }
        // add color to background
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;
        // check for contrast
        checkHexContrast(randomColor, hexText);

        // inital color sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        // console.log(sliders);
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation);
    });
    // reset inputs
    resetInputs();
    //check for button contrast
    adjustButton.forEach((button, index) => {
        checkHexContrast(initialColors[index], button);
        checkHexContrast(initialColors[index], lockButton[index]);
    });
}

/*
* Using Chroma.js to check the contrast
*/
function checkHexContrast(color, text) {
    const luminance = chroma(color).luminance();
    if(luminance > 0.5) {
        text.style.color = "black";
    } else {
        text.style.color = "white";
    }
}

/* 
* Using Chroma.js to update the color of the sliders
*/
function colorizeSliders(color, hue, brightness, saturation) {
    //scale saturation
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);
    //scale brightness
    const midBright = color.set('hsl.l', 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);

    //update input colors
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`;
}

/*
* Using chroma.js to update the controls to change the color of the background main pallete
*/
function hslControls(e) {
    const index =   
        e.target.getAttribute('data-bright') || 
        e.target.getAttribute('data-sat') || 
        e.target.getAttribute('data-hue');
    
    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    // to always keep the initial color
    const bgColor = initialColors[index];

    let color = chroma(bgColor)
        .set('hsl.s', saturation.value)
        .set('hsl.l', brightness.value)
        .set('hsl.h', hue.value);
    colorDivs[index].style.backgroundColor = color;

    //colorize sliders
    colorizeSliders(color, hue, brightness, saturation);
}

/*
* updating the text to the new color when using sliders, and setting the contrast
*/
function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor)
    const textHex = activeDiv.querySelector('h2');
    const icons = activeDiv.querySelectorAll('.controls button');
    textHex.innerText = color.hex();
    // check contrast
    checkHexContrast(color, textHex);
    for(icon of icons) {
        checkHexContrast(color, icon);
    }

}

/*
* reseting the slider to the correct color
*/
function resetInputs() {
    const sliders = document.querySelectorAll('.sliders input');
    sliders.forEach(slider => {
        if(slider.name === 'hue'){
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }
        if(slider.name === 'brightness'){
            const brightColor = initialColors[slider.getAttribute('data-bright')];
            const brightValue = chroma(brightColor).hsl()[1];
            slider.value = Math.floor(brightValue * 100) / 100;
        }
        if(slider.name === 'saturation'){
            const satColor = initialColors[slider.getAttribute('data-sat')];
            const satValue = chroma(satColor).hsl()[2];
            slider.value = Math.floor(satValue * 100) / 100;
        }
    })
}

/*
* Copy hex color to clipboard
*/
function copyToClipboard(hex) {
    //create textarea
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    //select text
    el.select();
    //copy
    document.execCommand('copy');
    //remove textarea
    document.body.removeChild(el);
    //popup animation
    const popupBox = popup.children[0];
    popup.classList.add('active');
    popupBox.classList.add('active');

}

/*
* toggle the sliders to appear
*/
function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle("active");
}
function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove("active");
}


/*
==============================================
* inplement save to palette and Local storage
==============================================
*/
const saveBtn = document.querySelector('.save');
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryBtn = document.querySelector('.library');
const closeLibraryBtn = document.querySelector('.close-library');

//Event listeners
saveBtn.addEventListener('click', openPalette);
closeSave.addEventListener('click', closePalette);
submitSave.addEventListener('click', savePalette);
libraryBtn.addEventListener('click', openLibrary);
closeLibraryBtn.addEventListener('click', closeLibrary);

//functions
function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}
function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}

function savePalette(e) {
    saveContainer.classList.remove("active");
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    })

    //generate object
    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    if (paletteObjects) {
      paletteNr = paletteObjects.length;
    } else {
      paletteNr = savedPalettes.length;
    }

    const paletteObj = { name, colors, nr: paletteNr };
    savedPalettes.push(paletteObj);
    // save to local storage
    saveToLocal(paletteObj);
    saveInput.value = "";
    // generate the palette for the library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObj.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    });
    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-btn');
    paletteBtn.classList.add(paletteObj.nr);
    paletteBtn.innerText = 'Select';

    // attach event to the btn
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkHexContrast(color, text);
            updateTextUI(index);
        });
        resetInputs();
    })

    //append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

/*
* Save colors to local storage
*/
function saveToLocal(paletteObj) {
    let localPalettes;
    //check if have palettes
    if(localStorage.getItem('palettes') === null){
        localPalettes = [];
    }else {
    // get the storage back
        localPalettes = JSON.parse(localStorage.getItem('palettes'));
    }
    // adding new saves to it
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function openLibrary () {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}
function closeLibrary () {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}
/*
* Fetch local storage and create custom palette
*/
function getLocal() {
    if(localStorage.getItem('palettes') === null) {
        localPalettes = [];
    }else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            // generate the palette for the library
            const palette = document.createElement('div');
            palette.classList.add('custom-palette');
            const title = document.createElement('h4');
            title.innerText = paletteObj.name;
            const preview = document.createElement('div');
            preview.classList.add('small-preview');

            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement('div');
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            });

            const paletteBtn = document.createElement('button');
            paletteBtn.classList.add('pick-palette-btn');
            paletteBtn.classList.add(paletteObj.nr);
            paletteBtn.innerText = 'Select';

            // attach event to the btn
            paletteBtn.addEventListener('click', e => {
            closeLibrary();
            const paletteIndex = e.target.classList[1];
            initialColors = [];

            paletteObjects[paletteIndex].colors.forEach((color, index) => {
                initialColors.push(color);
                colorDivs[index].style.backgroundColor = color;
                const text = colorDivs[index].children[0];
                checkHexContrast(color, text);
                updateTextUI(index);
            });

            resetInputs();
            });

            //append to library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        });
    }
}

// localStorage.clear();
getLocal();
randomColors();