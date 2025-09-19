const body = document.getElementById("body")
const c = document.getElementById("canvas")
const ctx = c.getContext("2d")

let sounds = {
    music_carefree: new Audio('./audio/music/carefree.mp3'),
    music_pixelpeekerpolka:  new Audio('./audio/music/pixelpeekerpolka.mp3'),
    music_cipher:  new Audio('./audio/music/cipher.mp3'),
    jump: new Audio('./audio/jump.mp3'),
    die: new Audio('./audio/death.mp3'),
}

let unlockedLevels = localStorage.getItem("unlockedLevels") || 0
let deaths = 0
let currentLevel = 0
let winX = 0
let currentMusic = "music_pixelpeekerpolka"
let soundsLoaded = 0;
const totalSounds = Object.keys(sounds).length;

function playSnd(name) {
    const snd = sounds[name];
    snd.pause();
    snd.currentTime = 0;
    snd.play();
}
function stopSnd(name) {
    const snd = sounds[name];
    snd.pause();
    snd.currentTime = 0;
}

let mouseX = 0
let mouseY = 0
function getMousePosition(event) {

    const rect = c.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseX = x
    mouseY = y
    
}
document.addEventListener("mousemove", getMousePosition);

const tileSize = 50
const tileColor = "#111010ff"

let scene = "menu"

let renderFuncs = {}
let tickFuncs = {}
let initFuncs = {}

const floorHeight = canvas.height*0.75
let score = 0
let obstacles = [
    
]

function addObj(type, pos, size){
    obstacles.push(
        {
        type: type,
        pos: {x: pos.x*tileSize, y: floorHeight - pos.y*tileSize - size.y*tileSize},
        size: {x: size.x*tileSize, y: size.y*tileSize},
        },
    )
}
let plr = {
    pos: {x: 100, y: 100},
    vel: {x: 0, y: 0},
    size: {x: tileSize, y: tileSize},
    dir: 0,
    targetDir: 0,
    inputs: {jump: false},
    grounded: false,
    explodeTime: 0,
}

const imgSources = [
    {
        name: "player",
        src: "./sprites/player.png",
    },
    {
        name: "boom0",
        src: "./sprites/boomers/boom0.png",
    },
    {
        name: "boom1",
        src: "./sprites/boomers/boom1.png",
    },
    {
        name: "boom2",
        src: "./sprites/boomers/boom2.png",
    },
    {
        name: "boom3",
        src: "./sprites/boomers/boom3.png",
    },
    {
        name: "boom4",
        src: "./sprites/boomers/boom4.png",
    },
    {
        name: "boom5",
        src: "./sprites/boomers/boom5.png",
    },
    {
        name: "boom6",
        src: "./sprites/boomers/boom6.png",
    },
    {
        name: "boom7",
        src: "./sprites/boomers/boom7.png",
    },
    {
        name: "spike",
        src: "./sprites/spike.png",
    },
]
const sprites = {}
imgSources.forEach(function(item){
    const img = new Image();
    img.src = item.src
    sprites[item.name] = img
})


//FUNCTIONS

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function lerp(a, b, t) {
    return a + (b - a) * t
}

let vec = {}
vec.magnitude = function(vec){
    return (Math.abs(vec.x)+Math.abs(vec.y))/2
}
vec.normalize = function(vec) {
    const length = Math.hypot(vec.x, vec.y); // same as sqrt(x*x + y*y)

    if (length === 0) return { x: 0, y: 0 }; // avoid division by zero
    return {
        x: vec.x / length,
        y: vec.y / length
    };
}
vec.lerp = function(vec, targetVec, t) {
    return {
        x: lerp(vec.x, targetVec.x, t), 
        y: lerp(vec.y, targetVec.y, t)
    }
}
vec.dot = function(vec1, vec2) {
  return vec1.x * vec2.x + vec1.y * vec2.y;
}
vec.add = function(vec1, vec2){
    return {
        x: vec1.x + vec2.x,
        y: vec1.y + vec2.y
    }
}
vec.sub = function(vec1, vec2){
    return {
        x: vec1.x - vec2.x,
        y: vec1.y - vec2.y
    }
}
vec.mulNum = function(vec1, num){
    return {
        x: vec1.x * num,
        y: vec1.y * num
    }
}
vec.divNum = function(vec1, num){
    return {
        x: vec1.x / num,
        y: vec1.y / num
    }
}
vec.normalToDeg = function(normal) {
  const rad = Math.atan2(normal.y, normal.x);  // returns angle in radians between -π and π
  let deg = rad * 180 / Math.PI;
  if (deg < 0) deg += 360;  // optional: normalize angle to [0, 360)
  return deg;
}
vec.new = function(x, y){
    return {x: x, y: y}
}

let deg = {}
deg.rotate = function(degree, amount) {
    let result = degree + amount
    if (result >= 360) result -= 360
    return result
}
deg.getNormalVec = function(degree) {
    const rad = degree * (Math.PI / 180)
    return {
        x: Math.cos(rad), 
        y: Math.sin(rad)
    }
}
deg.slerp = function(a, b, t) {
  // Normalize angles to [0, 360)
  a = ((a % 360) + 360) % 360;
  b = ((b % 360) + 360) % 360;

  // Calculate difference, wrapped to [-180, 180]
  let diff = b - a;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  // Interpolate and wrap result to [0, 360)
  let result = a + diff * t;
  return ((result % 360) + 360) % 360;
}
deg.getDegreePointing = function(vec, target) {
  const dx = target.x - vec.x;
  const dy = target.y - vec.y;

  const angleRad = Math.atan2(dy, dx);

  let angleDeg = angleRad * (180 / Math.PI);

  if (angleDeg < 0) {
    angleDeg += 360;
  }

  return angleDeg;
}
deg.getRelation = function(dir1, dir2) {
  // Normalize both to 0-360
  dir1 = ((dir1 % 360) + 360) % 360;
  dir2 = ((dir2 % 360) + 360) % 360;

  // Calculate the difference from dir2 to dir1
  let diff = dir1 - dir2;

  // Normalize difference to -180 to +180
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return diff
}
deg.rad = function(degree, offset){
    return (degree+(offset || 0)) * (Math.PI / 180)
}
deg.radToVec = function(radians){
    return {
            x: Math.cos(radians),
            y: Math.sin(radians)
        }
}
deg.dist = function(a, b) {
  let diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function changeScene(newScene){
    buttons = []
    scene = newScene
    initFuncs[newScene]()
}

let buttons = []
function createButton(text, pos, fontSize, clickFunc){
    buttons.push({
        text: text,
        pos: pos,
        fontSize: fontSize||70,
        isHovering: false,
        hoverNum: 0,
        onClick: clickFunc,
    })
}

renderFuncs.menu = function(dt, elapsed){

    ctx.font = "80px cursive";
    ctx.fillStyle = 'white';


    ctx.fillText("Geothermal Bash", 50, 100);


}
tickFuncs.menu = function(dt, elapsed){

}
initFuncs.menu = function(){
    let levelMusic = [
        "music_pixelpeekerpolka",
        "music_carefree",
        "music_cipher",
    ]
    for (let i in levelMusic){
        if (unlockedLevels >= i){
            let next = (Number(i)+1)//why the fuck does i become a string?????????
            createButton("level "+next, vec.new(canvas.width/2-200, 150+i*90), 80, function(){
                currentLevel = i
                currentMusic = levelMusic[i]
                changeScene("game")
            })
        }else{
            createButton("LOCKED", vec.new(canvas.width/2-200, 150+i*90), 80, function(){
            })
        }
    }
    deaths = 0
    console.log(unlockedLevels)
}

renderFuncs.win = function(){
    ctx.font = "70px cursive";
    ctx.fillStyle = 'black';

    ctx.fillText("you won!!!", 50, 100);

    ctx.font = "45px cursive";
    ctx.fillStyle = 'yellow';

    ctx.fillText("deaths: "+deaths, 50, 160);
}
tickFuncs.win = function(){
    
}
initFuncs.win = function(){
    stopSnd(currentMusic)
    unlockedLevels = Math.max(Number(currentLevel)+1, Number(unlockedLevels))
    localStorage.setItem("unlockedLevels", unlockedLevels);
    createButton("back!!!!!!!!!!", vec.new(50, 300), 80, function(){
        changeScene("menu")
    })
}

function playerCollides(){
    for (let i = 0; obstacles.length > i; i++){
        const obj = obstacles[i]
        if (obj.type == "wall" && rectOverlappingRect(plr.pos, plr.size, obj.pos, obj.size)){
            return vec.new(plr.pos.x+plr.size.x -obj.pos.x,  obj.pos.y-plr.pos.y-plr.size.y)
        }
    }
    return false
}

renderFuncs.game = function(dt, elapsed){
    const cam = vec.sub(vec.new(plr.pos.x, canvas.height/2), vec.new(canvas.width/2, canvas.height/2))

    obstacles.forEach(function(obj){
        if (obj.type == "spike"){
            ctx.drawImage(sprites.spike, obj.pos.x - cam.x -obj.size.x, obj.pos.y - cam.y -obj.size.y, obj.size.x*2, obj.size.y*2)
        }
        if (obj.type == "launcher"){
            ctx.fillStyle = "blue"
            ctx.fillRect(obj.pos.x - cam.x, obj.pos.y - cam.y, obj.size.x, obj.size.y)
        }
        if (obj.type == "bouncer"){
            ctx.beginPath();
            ctx.arc(obj.pos.x - cam.x +obj.size.x/2, obj.pos.y - cam.y +obj.size.y/2, obj.size.x/2+Math.sin(elapsed*0.02)*2, 0, 2 * Math.PI); // x, y, radius, startAngle, endAngle
            ctx.fillStyle = 'yellow';
            ctx.fill();
            //ctx.drawImage(sprites.player, obj.pos.x - cam.x, obj.pos.y - cam.y, obj.size.x, obj.size.y)
        }
        if (obj.type == "wall"){
            ctx.fillStyle = tileColor
            ctx.fillRect(obj.pos.x - cam.x, obj.pos.y - cam.y, obj.size.x, obj.size.y)
        }
    })
    ctx.fillStyle = tileColor
    ctx.fillRect(0, floorHeight - cam.y, canvas.width, canvas.height)

    //ctx.fillRect(plr.pos.x - cam.x, plr.pos.y, plr.size.x, plr.size.y - cam.y)

    if (plr.explodeTime > 0){
        const p = 1-(plr.explodeTime)
        const sprite = sprites["boom"+(Math.round(p*7))] || sprites.spike
        
        ctx.drawImage(sprite, plr.pos.x-plr.size.x/2 - cam.x, plr.pos.y-plr.size.y/2 - cam.y, plr.size.x*2, plr.size.y*2)
    }else{
        const angleInDegrees = 0 + plr.dir;
        const angleInRadians = angleInDegrees * Math.PI / 180;

        ctx.save();

        ctx.translate(plr.pos.x + plr.size.x/2 - cam.x, plr.pos.y + plr.size.y/2 - cam.y);
        ctx.rotate(angleInRadians);

        ctx.fillStyle = "white"
        ctx.filter = "blur(50px)"
        ctx.fillRect(-plr.size.x/2, -plr.size.y/2, plr.size.x, plr.size.y)
        ctx.filter = "none"

        ctx.drawImage(sprites.player, -plr.size.x/2, -plr.size.y/2, plr.size.x, plr.size.y)

        ctx.restore(); // Restore to the original state
    }

    


    ctx.font = "50px cursive";
    ctx.fillStyle = 'white';

    ctx.fillText(Math.ceil(score*10)/10, canvas.width/2, 50);
}
function die(){
    deaths ++
    stopSnd(currentMusic)
    console.log("deadass")
    playSnd("die")
    plr.explodeTime = 1
    //changeScene("game")
}

function jump(){
    playSnd("jump")
    plr.vel.y = -600
}

tickFuncs.game = function(dt, elapsed){
    if (plr.explodeTime > 0){
        plr.explodeTime -= dt
        if (plr.explodeTime <= 0){
            changeScene("game")
        }
        return
    }

    if (plr.pos.x > winX){
        changeScene("win")
    }

    plr.vel.y += 2500*dt

    if (plr.inputs.jump && plr.grounded){
        jump()
    }
    if (plr.grounded == false){
        plr.targetDir += dt*350
    }else{
        plr.targetDir = Math.round(plr.dir/90)*90
    }
    plr.dir = deg.slerp(plr.dir, plr.targetDir, Math.pow(0.0000000000000001, dt))

    plr.grounded = false

    obstacles.forEach(function(obj){
        if (obj.type == "spike" && rectOverlappingRect(plr.pos, plr.size, obj.pos, obj.size)){
            die()
            return
        }
        if (obj.type == "launcher" && rectOverlappingRect(plr.pos, plr.size, obj.pos, obj.size)){
            plr.vel.y = -1000
            return
        }
    })

    plr.pos.x += plr.vel.x * dt
    const overlapX = playerCollides()
    if (overlapX){
        die()
        return
    }
    plr.pos.y += plr.vel.y * dt
    const overlapY = playerCollides()
    if (overlapY){
        plr.pos.y += overlapY.y
        plr.vel.y = 0; plr.grounded = true 
    }

    const yClamped = clamp(plr.pos.y, -canvas.height, floorHeight-plr.size.y)
    if (plr.pos.y != yClamped){ plr.vel.y = 0; plr.grounded = true }
    plr.pos.y = yClamped
    
    score += dt

    
}
initFuncs.game = function(){
    score = 0
    plr.explodeTime = 0
    timer = 10
    plr.pos = vec.new(canvas.width/2, floorHeight-plr.size.y)
    plr.vel = vec.new(390, 0)
    plr.dir = 0
    plr.targetDir = 0
    coin = vec.new(canvas.width/2, 20)

    playSnd(currentMusic)


    createButton("quit", vec.new(0, 0), 80, function(){
        stopSnd(currentMusic)
        changeScene("menu")
    })

    obstacles = []
    const levels = [
        [
        ["wall", vec.new(27, 0), vec.new(18, 1)],
       
        ["spike", vec.new(32+0.5, 1), vec.new(0.5, 0.5)],
        ["spike", vec.new(35+0.5, 1), vec.new(0.5, 0.5)],

        ["wall", vec.new(45, 0), vec.new(1, 2)],

        ["wall", vec.new(48, 0), vec.new(5, 3)],
        ["spike", vec.new(61+0.5, 0), vec.new(0.5, 0.5)],
        ["spike", vec.new(71+0.5, 0), vec.new(0.5, 0.5)],
        ["spike", vec.new(74+0.5, 0), vec.new(0.5, 0.5)],

        ["wall", vec.new(85, 0), vec.new(1, 1)],
        ["wall", vec.new(88, 0), vec.new(1, 2)],
        ["wall", vec.new(91, 0), vec.new(1, 3)],
        ["wall", vec.new(94, 0), vec.new(1, 4)],
        ],
        [
        ["bouncer", vec.new(22, 1.5), vec.new(1, 1)], 
       
        ["spike", vec.new(21+0.5, 0), vec.new(0.5, 0.5)],
        ["spike", vec.new(22+0.5, 0), vec.new(0.5, 0.5)],
        ["spike", vec.new(23+0.5, 0), vec.new(0.5, 0.5)],

        ["spike", vec.new(32+0.5, 0), vec.new(0.5, 0.5)],

        ["bouncer", vec.new(42, 1.5), vec.new(1, 1)], 
        ["wall", vec.new(46, 0), vec.new(2, 2)],

        ["bouncer", vec.new(59, 1.5), vec.new(1, 1)], 
        ["bouncer", vec.new(63, 2), vec.new(1, 1)], 
        ["bouncer", vec.new(66, 2), vec.new(1, 1)], 

        ["wall", vec.new(68, 0), vec.new(4, 3)],
        ["bouncer", vec.new(74, 1.5), vec.new(1, 1)], 
        ["spike", vec.new(74+0.5, 0), vec.new(0.5, 0.5)],
        ["wall", vec.new(76, 0), vec.new(3, 3)],

        ["bouncer", vec.new(100, 1), vec.new(1, 1)], 
        ["wall", vec.new(103, 0), vec.new(20, 2)],
        ],
        [
        ["launcher", vec.new(18, 0), vec.new(1, 0.25)], 
        ["wall", vec.new(21, 0), vec.new(3, 4)],
        ["wall", vec.new(27, 0), vec.new(1, 1)],
        ["launcher", vec.new(27, 1), vec.new(1, 0.25)], 
        ["wall", vec.new(32, 0), vec.new(7, 3)],
        ["launcher", vec.new(36, 3), vec.new(1, 0.25)], 
        ["spike", vec.new(36, 7), vec.new(0.5, 0.5)],
        ["spike", vec.new(37, 7), vec.new(0.5, 0.5)],
        ["spike", vec.new(38, 7), vec.new(0.5, 0.5)],
        ["launcher", vec.new(44, 0), vec.new(1, 0.25)], 
        ["wall", vec.new(48, 0), vec.new(1, 2)],
        ["spike", vec.new(48+0.5, 2), vec.new(0.5, 0.5)],
        ["bouncer", vec.new(48, 3), vec.new(1, 1)], 
        ["bouncer", vec.new(51.5, 2.5), vec.new(1, 1)], 
        ["spike", vec.new(53+0.5, 0), vec.new(0.5, 0.5)],
        ["launcher", vec.new(61, 0), vec.new(1, 0.25)], 
        ["bouncer", vec.new(62, 3), vec.new(1, 1)], 
        ["bouncer", vec.new(63, 5), vec.new(1, 1)], 
        ["wall", vec.new(66, 0), vec.new(7, 6)],
        ["bouncer", vec.new(76+0.5, 2.5), vec.new(1, 1)], 
        ["spike", vec.new(78+0.5, 0), vec.new(0.5, 0.5)],
        ["launcher", vec.new(83+0.5, 0), vec.new(1, 0.25)], 
        ["wall", vec.new(87, 0), vec.new(25, 4)],
        ["wall", vec.new(93, 0), vec.new(25, 4)],
        ],
    ]
    const level = levels[currentLevel]
    winX = (level[level.length-1][1].x + 8)*tileSize
    for (let i in level){
        const obj = level[i]
        addObj(obj[0], obj[1], obj[2])
    }
    
}



renderFuncs.loading = function(){
    ctx.font = "40px cursive";
    ctx.fillStyle = 'black';

    ctx.fillText("Loading audio: "+soundsLoaded+" / "+totalSounds, canvas.width/2-100, canvas.height/2);
}
tickFuncs.loading = function(){
    
}
initFuncs.loading = function(){
    
}


function pointOverlappingRect(rectPos, rectSize, checkPos){
    if (rectPos.x < checkPos.x && rectPos.x+rectSize.x > checkPos.x){
        if (rectPos.y < checkPos.y && rectPos.y+rectSize.y > checkPos.y){
            return true
        }
    }
    return false
}

function rectOverlappingRect(rect1Pos, rect1Size, rect2Pos, rect2Size){

    return ((rect1Pos.x < rect2Pos.x+rect2Size.x) &&
   (rect1Pos.x+rect1Size.x > rect2Pos.x) &&
   (rect1Pos.y < rect2Pos.y+rect2Size.y) &&
   (rect1Pos.y+rect1Size.y > rect2Pos.y))
}

document.addEventListener('click', function(event) {
    buttons.forEach(function(btn){
        if (btn.isHovering){
            btn.onClick()
        }
    })
})


let lastElapsed = 0
function gameLoop(elapsed) {
    const dt = Math.min((elapsed-lastElapsed)/1000, 0.5)
    lastElapsed = elapsed

    tickFuncs[scene](dt, elapsed)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderFuncs[scene](dt, elapsed)

    buttons.forEach(function(btn){
        const metrics = ctx.measureText(btn.text);
        const pad = 0
        const off = btn.hoverNum*10
        if (pointOverlappingRect(vec.new(btn.pos.x, btn.pos.y), vec.new(metrics.width, btn.fontSize), vec.new(mouseX, mouseY))){
            btn.isHovering = true
            ctx.fillStyle = "rgb(255, 80, 80)"
            btn.hoverNum = lerp(btn.hoverNum, 1, Math.pow(0.0000000000000001, dt))
        }else{
            btn.isHovering = false
            ctx.fillStyle = "rgb(220, 20, 20)"
            btn.hoverNum = lerp(btn.hoverNum, 0, Math.pow(0.0000000000000001, dt))
        }
        ctx.fillRect(btn.pos.x-pad/2 - off/2, btn.pos.y+15 -pad/2 - off/2, metrics.width+pad + off, btn.fontSize+pad + off)

        ctx.fillStyle = "black"
        ctx.fillRect(mouseX, mouseY, 5, 5)

        ctx.font = btn.fontSize+"px cursive";
        ctx.fillStyle = 'white';

        ctx.fillText(btn.text || "text", btn.pos.x, btn.pos.y+btn.fontSize);
    })

    requestAnimationFrame(gameLoop)
}

gameLoop(performance.now())

function attemptJump(){
    plr.inputs.jump = true
    obstacles.forEach(function(obj){
        if (obj.type == "bouncer" && rectOverlappingRect(plr.pos, plr.size, obj.pos, obj.size)){
            if (obj.used == null){
                obj.used = true
                jump()
            }
        }
    })
}

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === " ") {
        attemptJump()
    }
})
document.addEventListener("keyup", function(event) {
    if (event.key.toLowerCase() === " ") {
        plr.inputs.jump = false
    }
})

document.addEventListener('mousedown', function(event) {
    if (scene == "game"){
        attemptJump()
    }
})
document.addEventListener('mouseup', function(event) {
    if (scene == "game"){
        plr.inputs.jump = false
    }
})

changeScene("loading")

//loading

function checkAllSoundsLoaded() {
    soundsLoaded++;
    if (soundsLoaded === totalSounds) {
        console.log('All sounds loaded!');
        changeScene("menu")
        // You can now enable gameplay or UI
    }
}

// Attach event listeners to check when each sound is ready
for (let key in sounds) {
    const audio = sounds[key];
    audio.addEventListener('canplaythrough', checkAllSoundsLoaded, { once: true });
    audio.load(); // Trigger loading
}

