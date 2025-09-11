let snakeTiles = [ //Pieces of the snok [X,Y],...
    [7, 5],[7, 6],[7, 7]
]
let apples = [
    [9, 9]
] //the apples!!!!!!!!!!!!!!
let tiles = [];

let oldTiles = [];

let gameOver = false;
const invincibilityTotal = 1;
let invincibility = invincibilityTotal;


const removableClasses = [
    "apple","snake",
    "snake-head","snake-body-vertical","snake-body-horizontal",
    "snake-body-top-right","snake-body-top-left","snake-body-bottom-right","snake-body-bottom-left",
    "snake-head-right","snake-head-left","snake-head-up","snake-head-down",
    "snake-tail-right","snake-tail-left","snake-tail-up","snake-tail-down",
];

let gameSizeX = 15;
let gameSizeY = 15;
let gameSizeTotal = gameSizeX * gameSizeY;

let tummy = 0;

let snakeDir = [1, 0];
let originalInput = [1, 0]

function findRandomPos(){//find a random empty tile for apple to spawn on
    if (snakeTiles.length >= tiles.length){//if snake covers the screen
        console.log("u win!!");
        //REFRESH PAGE HERE
        alert("victory")
        location.reload();
        return null;
    }

    while (true) { 
        let randomNum = Math.floor((Math.random()*tiles.length) + 1);
        let tile = tiles[randomNum];
        
        let vec2 = [tile.dataset.x, tile.dataset.y]
        let tileX = vec2[0];
        let tileY = vec2[1];
        
        

        if (tile != null && !tile.classList.contains("snake") && !tile.classList.contains("apple")){
            return vec2
        }
    }
}

function die(){
    if (invincibility > 0){
        invincibility--
    }else{
        gameOver = true
        
        setTimeout(1000);
        location.reload();
    }
}

function tick(){
    originalInput = snakeDir;

    let snakeHead = snakeTiles[0];//snakeTiles.length-1s

    let newVec2 = [
        (snakeHead[0]+snakeDir[0]),
        (snakeHead[1]+snakeDir[1])
    ];

    
    let tileX = newVec2[0];
    let tileY = newVec2[1];

    let tile = document.querySelector(`[data-x="${tileX}"][data-y="${tileY}"]`);

    let didDamage = false;

    if (tile == null){
        didDamage = true;
        die();
    }
    if (tile.classList.contains("snake")){
        didDamage = true;
        die();
    }

    if (tile.classList.contains("apple")){
        console.log("YUMMY!");
        apples.splice(apples.indexOf(newVec2), 1);
        apples.push(findRandomPos());
        tummy += 1;
    }

    if (didDamage == false){
        invincibility = invincibilityTotal;

        if (tummy > 0){
            tummy -= 1;
        }
        else {
            snakeTiles.pop();
        }

        snakeTiles.unshift(newVec2);
    }
    
}

document.addEventListener('keydown', (event) => {
    
    if (event.key.toLowerCase() === 'w' && !(originalInput[1] == 1)) {
        snakeDir = [0, -1];
    } else if (event.key.toLowerCase() === 's' && !(originalInput[1] == -1)) {
        snakeDir = [0, 1];
    } else if (event.key.toLowerCase() === 'a' && !(originalInput[0] == 1)) {
        snakeDir = [-1, 0];
    } else if (event.key.toLowerCase() === 'd' && !(originalInput[0] == -1)) {
        snakeDir = [1, 0];
    }
});

function displayThings(){

    //Return old snok and apples to normal tiles

    oldTiles.forEach(function(vec2){
        let tileX = vec2[0];
        let tileY = vec2[1];
        
        let tile = document.querySelector(`[data-x="${tileX}"][data-y="${tileY}"]`);

        removableClasses.forEach(function(string){
            if (tile.classList.contains(string)){
                tile.classList.remove(string);
            }
        })
        
        //turn tile back to normal
    });

    //DisplaySnok
    snakeTiles.forEach((vec2) =>{
        let tileX = vec2[0];
        let tileY = vec2[1];

        let id = tileX+(tileY*gameSizeY);
        let tile = document.querySelector(`[data-x="${tileX}"][data-y="${tileY}"]`);

        let i = snakeTiles.indexOf(vec2);

        let getSnakeTile = function(tilePos, useCorners){
            
            if (useCorners) {
                let tileTypeBack = getSnakeTile(snakeTiles[i+1], false);
                if ((tileTypeBack) === undefined){return getSnakeTile(snakeTiles[i-1])}
                let tileTypeFront = getSnakeTile(snakeTiles[i-1], false);
                if ((tileTypeFront) === undefined){return getSnakeTile(snakeTiles[i+1])}
                
                if ((tileTypeFront == 0 && tileTypeBack == 2) || (tileTypeBack == 0 && tileTypeFront == 2)) {
                    return 7;
                }
                else if ((tileTypeFront == 1 && tileTypeBack == 2) || (tileTypeBack == 1 && tileTypeFront == 2)) {
                    return 6;
                }
                else if ((tileTypeFront == 0 && tileTypeBack == 3) || (tileTypeBack == 0 && tileTypeFront == 3)) {
                    return 5;
                }
                else if ((tileTypeFront == 1 && tileTypeBack == 3) || (tileTypeBack == 1 && tileTypeFront == 3)) {
                    return 4;
                }
                else {
                    return tileTypeBack;
                }
            }
            else {
                if ((tilePos) === undefined){return undefined; }

                if (tileX-tilePos[0] > 0) {
                    return 0; // right
                }
                else if (tileX-tilePos[0] < 0) {
                    return 1; // left
                }
                else if (tileY-tilePos[1] < 0) {
                    return 2; // up
                }
                else if (tileY-tilePos[1] > 0) {
                    return 3; // down
                }
                
            }
        }

        tile.classList.add("snake");
        
        let tileType = 0;
        let icons

        if (i === 0) {// head
            tileType = getSnakeTile(snakeTiles[i+1], false);
            icons = [
                "snake-head-right", // right
                "snake-head-left", // left
                "snake-head-up", // up
                "snake-head-down", // down
            ];
        }
        else { // body
            tileType = getSnakeTile(snakeTiles[i], true);
            if (i === snakeTiles.length-1){
                icons = [
                    "snake-tail-left", // right
                    "snake-tail-right", // left
                    "snake-tail-down", // up
                    "snake-tail-up", // down
                ];
                
            }else{
                icons = [
                    "snake-body-horizontal", // right
                    "snake-body-horizontal", // left
                    "snake-body-vertical", // up
                    "snake-body-vertical", // down
                    "snake-body-top-right", // top-right
                    "snake-body-top-left", // top-left
                    "snake-body-bottom-right", // bottom-right
                    "snake-body-bottom-left", // bottom-left
                ];
            }
            
        }
        console.log(tileType)
        tile.classList.add(icons[tileType]);

        oldTiles.push([tileX, tileY]);
        //change the tile to a snake here!!
    });

    //Display apples
    apples.forEach(function(vec2){
        let tileX = vec2[0];
        let tileY = vec2[1];

        let id = tileX+(tileY*gameSizeY);
        let tile = document.querySelector(`[data-x="${tileX}"][data-y="${tileY}"]`);

        tile.classList.add("apple");

        oldTiles.push([tileX, tileY]);
        //change the tile to a apple.
    });
}


function spawnTiles(){
    const container = document.querySelector('.container');

    for (let x = 1, y = 1, loop = 1;  loop <= gameSizeTotal; loop++) {
        let tile = document.createElement('div');
       
        tile.classList.add("tile");
        tile.id = loop;
        tile.dataset.x = x;
        tile.dataset.y = y;
        container.appendChild(tile);
        tiles.push(tile);
        x++;
        x > gameSizeX ? (x = 1, y++) : null;
    }
}

spawnTiles();

function gameLoop() {
    if (gameOver == false){
        tick();
        displayThings();
    }
}
setInterval(gameLoop, 100);

console.log('hi');

console.log('bye');