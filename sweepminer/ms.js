const btns = [];

let gameSizeX = 25;
document.documentElement.style.setProperty('--game_size_x', gameSizeX);
let gameSizeY = 25;
let gameSizeTotal = gameSizeX*gameSizeY;
let currentClicked = null;
let flagStartCell = null;
let firstClick = true;

const audio = new Audio('./swag.mp3');

function updateSize() {
    const swag = document.getElementById('swag').value;
    gameSizeX = parseInt(swag, 10) || 25;    
    gameSizeY = gameSizeX;
    gameSizeTotal = gameSizeX * gameSizeY;

    document.documentElement.style.setProperty('--game_size_x', gameSizeX);
    resetGame();
}
// updateSize();
document.getElementById('swag').addEventListener('input', (bomb) => {
    updateSize();
});

document.getElementById('swagger').addEventListener('input', (bomb) => {
    updateSize();
});

document.getElementById('swaggiest').addEventListener('mousedown', (event) => {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
    animateText();
    firstClick = true;
    resetGame();
});

function animateText() {
    const text = document.getElementById("animatedText");
    
    text.style.fontSize = "20px";
    text.style.opacity = "1";
    
    setTimeout(() => {
        text.style.transition = "none";
        text.style.fontSize = "20px";
        text.style.opacity = "1";

        setTimeout(() => {
            text.style.transition = "font-size 1s ease, opacity 1s ease";
            text.style.fontSize = "500px"; // change size here
            text.style.opacity = "0";
        }, 50);
    }, 50);
}

function resetGame() {
    const mines = document.getElementById('swagger').value;
    clearTiles();
    spawnTiles();
    placeMines(mines/100);
}


function clearTiles() {
    const getBtns = document.querySelectorAll('.btn');
    for (let btn of getBtns) {
        btn.remove();
    }
}

function showMines(){
    const getBtns = document.querySelectorAll('.btn');
    for (let btn of getBtns) {
        if (btn.dataset.isMine === 'true') {
            btn.classList.add('boom');
            btn.disabled = true;
        }
    }
}

document.addEventListener('mouseup', (event) =>{
    if (currentClicked && !currentClicked.disabled) {
        currentClicked.classList.remove('clicked');
        currentClicked = null;
    }
});

function mobileLongPress(btn) {
}

function spawnTiles() {
    const container = document.querySelector('.container');
    for (let x = 1, y = 1, loop = 1; loop <= gameSizeTotal; loop++) {
        const btn = document.createElement('button');
        btn.dataset.x = x;
        btn.dataset.y = y;
        btn.classList.add('btn', 'btnClosed');
        btn.id = loop;
     
        const duration = 200;
        let longPress;
        btn.addEventListener('touchstart', (event) => {
            longPress = setTimeout(() => {
                btn.classList.toggle('flag');
            }, duration);
        });
        btn.addEventListener('touchend', () => clearTimeout(longPress));
        btn.addEventListener('touchmove', () => clearTimeout(longPress));
        btn.addEventListener('touchcancel', () => clearTimeout(longPress));

        btn.addEventListener('contextmenu', (event) => { 
            event.preventDefault();
            if (!btn.disabled && event.button === 2 && flagStartCell === btn) {
                btn.classList.toggle('flag');
                btn.classList.remove('clicked');
            }
        });
        
        btn.addEventListener('mousedown', (event) =>{
            if (!btn.disabled && (event.button === 0 || event.button === 2)) {
                flagStartCell = btn;
                btn.classList.add('clicked');
                currentClicked = btn;
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (currentClicked === btn) {
                btn.classList.remove('clicked');
                currentClicked = null;
            }
        })
        
        btn.addEventListener('click', (event) => { 
            console.log(event.button);
            if (btn.classList.contains('flag')) {
                return;
            }

            if (firstClick === true){
                firstClick = false;
                if (btn.dataset.isMine === 'true'){
                    delete btn.dataset.isMine;
                }
            }

            if (countAdjMines(btn) === 0) {
                console.log("YES IT IS EMPTY!");
                clearAdj(btn);
             }

            btn.disabled = true;

            if (btn.dataset.isMine === 'true') {
                showMines();
                setTimeout(() => alert('You lost! You should swag yourself now!'), 1000);
            }
            else {
                const mineCount =  countAdjMines(btn);
                const classToAdd = getClassMineCount(mineCount);
                if (classToAdd) {
                    btn.classList.add(classToAdd);
                }
            }
            checkWin();
        });

        container.appendChild(btn);
        btns.push(btn);
        x++;
        // if (x === 10) { x = 1; y++; } // fuck this line!!
        x > gameSizeX ? (x = 1, y++) : null;
    }
}

function placeMines(minePercent) {
    const mines = Math.round(gameSizeTotal*minePercent); // this was math.floor first, i don't know why it bothered me so much to change it to math.round
    const selectedButtons = new Set();

    while (selectedButtons.size < mines) {
        const randMineId = Math.floor((Math.random() * gameSizeTotal) + 1);
        const randBtn = document.getElementById(randMineId);
        if (!selectedButtons.has(randMineId)) {
            selectedButtons.add(randBtn);
            // selectedButtons.add(numUnderBtn);
            // numUnderBtn.dataset.isMine = 'true';
            randBtn.dataset.isMine = 'true';
            // if(numUnderBtn) {
            //     numUnderBtn.classList.add('one');
            // }
        }
        // console.log(randBtn);
        // console.log(randMine.dataset.x, randMine.dataset.y);
        // console.log(document.querySelector(`[data-x="${randMine.dataset.x}"][data-y="${randMine.dataset.y}"][data-is-bomb="true"]`));
    }
}

updateSize();


function isOnScreen(x, y) {
    return x >= 1 && x <= gameSizeX && y >= 1 && y <= gameSizeY;
}

function getAdj(btn) {
    const x = Number(btn.dataset.x);
    const y = Number(btn.dataset.y);

    const adj = [
        [x, y],            // middle
        [x + 1, y],        // right
        [x - 1, y],        // left
        [x, y + 1],        // bottom
        [x, y - 1],        // top
        [x + 1, y + 1],    // bottom right
        [x - 1, y - 1],    // top left
        [x + 1, y - 1],    // top right
        [x - 1, y + 1]     // bottom left
    ];
    return adj // connected with the code below
        .filter(([x, y]) => isOnScreen(x, y))
        .map(([x, y]) => document.querySelector(`[data-x="${x}"][data-y="${y}"]`))  // get every element
        .filter(cell => cell !== null); // that the cell isn't nothing
}
function clearAdj(btn) {
    const adj = getAdj(btn);
    for (let item of adj) {
        if (!item.disabled){
            item.disabled = true;
            item.classList.add("empty");
        
            const mineCount =  countAdjMines(item);
            const classToAdd = getClassMineCount(mineCount);
            if (classToAdd) {
                item.classList.add(classToAdd);
            }
            
            if (mineCount === 0) {
                clearAdj(item);
            }
        }
    }
}

function countAdjMines(btn) {
    const adj = getAdj(btn);
    return adj.filter(adj => adj.dataset.isMine === 'true').length;
}

function getClassMineCount(count) {
    switch (count) {
        case 1: return 'one';
        case 2: return 'two';
        case 3: return 'three';
        case 4: return 'four';
        case 5: return 'five';
        case 6: return 'six';
        case 7: return 'seven';
        case 8: return 'eight';
        default: return '';
    }
}

function checkWin() {
    const btns = document.querySelectorAll('.btn');
    let hasWon = true;
    for (let btn of btns) {
        if (!btn.disabled && btn.dataset.isMine !== 'true') {
            hasWon = false;
            break;
        }
    }
    if (hasWon) {
        setTimeout(() => alert('You won! (Swagging yourself still recommended)'), 1000);
    }
}

// function revealCell(btn) {
//     btn.disabled = true;
//     const mineCount = coundAdjMines(btn);
//     const classToAdd 
// }
// function getAdj(btn) {
//     const id = Number(btn.id);
//     const x = Number(btn.dataset.x);
//     const y = Number(btn.dataset.y);
//     const adj = [
//         btn,
//         x < 9 ? document.querySelector(`[data-x="${x+1}"][data-y="${y}"]`) : null, // right
//         x > 1 ? document.querySelector(`[data-x="${x-1}"][data-y="${y}"]`) : null, // left
//         y < 9 ? document.querySelector(`[data-x="${x}"][data-y="${y+1}"]`) : null, // bottom
//         x > 1 ?document.querySelector(`[data-x="${x}"][data-y="${y-1}"]`) : null, // top
//         x < 9 && y < 9 ? document.querySelector(`[data-x="${x+1}"][data-y="${y+1}"]`) : null, // bottom left
//         x < 1 && y < 1 ? document.querySelector(`[data-x="${x-1}"][data-y="${y-1}"]`) : null, // top right
//         x < 1 && y < 9 ? document.querySelector(`[data-x="${x-1}"][data-y="${y+1}"]`) : null, // bottom right 
//         x < 9 && y < 1 ? document.querySelector(`[data-x="${x+1}"][data-y="${y-1}"]`) : null // top left
//     ]
//     return adj.filter(adj => adj !== null);
//     }