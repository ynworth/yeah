const body = document.getElementById("body")
const c = document.getElementById("canvas")
const ctx = c.getContext("2d")

let paused = false
let score = 0
let plr = {
    pos: {x: 100, y: canvas.height/2},
    vel: {x: 0, y: 0},
    size: {x: 50, y: 50},
}

let sounds = {
    flap: new Audio('./flap.mp3'),
    die: new Audio('./death.mp3'),
    point: new Audio('./point.mp3'),
}
function playSnd(name){
    const snd = sounds[name]
     snd.pause();
    snd.currentTime = 0;
    snd.play();
}

const pipeGap = 60
const pipeWidth = 50
let pipes = []
function addPipe(y, flip){
    pipes.push({
        pos: vec.new(canvas.width, y),
        collected: false,
    })
}

const imgSources = [
    {
        name: "player",
        src: "./sprites/player.png",
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


function render(dt, elapsed){
    //if (paused == true){return}
    ctx.fillStyle = "green"
    //ctx.fillRect(plr.pos.x, plr.pos.y, plr.size.x, plr.size.y)

    //ctx.fillStyle = "yellow"
    //ctx.fillRect(coin.x, coin.y, 40, 40)

    const angleInDegrees = 0 + plr.vel.y*5;
    const angleInRadians = angleInDegrees * Math.PI / 180;

    ctx.save();

    ctx.translate(plr.pos.x, plr.pos.y);
    ctx.rotate(angleInRadians);

    ctx.drawImage(sprites.player, -plr.size.x/2, -plr.size.y/2, plr.size.x, plr.size.y)

    ctx.restore(); // Restore to the original state

    
    pipes.forEach(function(pipe, i){
        ctx.fillStyle = "green"
        const wd = 10
        ctx.fillRect(pipe.pos.x-wd/2, pipe.pos.y+pipeGap, pipeWidth+wd, 20)
        ctx.fillRect(pipe.pos.x-wd/2, pipe.pos.y-pipeGap-20, pipeWidth+wd, 20)

        ctx.fillRect(pipe.pos.x, pipe.pos.y+pipeGap, pipeWidth, canvas.height)
        ctx.fillRect(pipe.pos.x, pipe.pos.y-canvas.height-pipeGap, pipeWidth, canvas.height)
    })

    ctx.font = "50px cursive";
    ctx.fillStyle = 'black';

    ctx.fillText(score+" score", canvas.width/2, 60);
}
function tick(dt, elapsed){
    if (paused == true){return}
    plr.pos = vec.add(plr.pos, plr.vel)
    plr.vel.y += dt*24

    if (plr.pos.y > canvas.height || plr.pos.y < 0){
        die()
    }

    pipes.forEach(function(pipe, i){
        pipe.pos.x -= dt*200

        if (overlapRect(vec.add(pipe.pos, vec.new(0, pipeGap, 0)), vec.new(50, canvas.height), plr.pos )){
            die()
        }
        if (overlapRect(vec.add(pipe.pos, vec.new(0, -canvas.height-pipeGap, 0)), vec.new(pipeWidth, canvas.height), plr.pos )){
            die()
        }
        if (pipe.pos.x < plr.pos.x && pipe.collected == false){
            score ++
            pipe.collected = true
            playSnd("point")
        }
        if (pipe.pos.x < -pipeWidth){
            pipes.splice(i, i)
        }
    })

    
}

function die(){ 
    paused = true
    playSnd("die")
}

function restart(){
    score = 0
    plr.pos = vec.new(100, canvas.height/2)
    plr.vel = vec.new(0, 0)
}

function overlapRect(rectPos, rectSize, checkPos){
    if (rectPos.x < checkPos.x && rectPos.x+rectSize.x > checkPos.x){
        if (rectPos.y < checkPos.y && rectPos.y+rectSize.y > checkPos.y){
            return true
        }
    }
    return false
}


let lastElapsed = 0
function gameLoop(elapsed) {
    const dt = Math.min((elapsed-lastElapsed)/1000, 0.5)
    lastElapsed = elapsed

    tick(dt, elapsed)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    render(dt, elapsed)

    requestAnimationFrame(gameLoop)
}

gameLoop(performance.now())

function jump(){
    if (paused){ restart(); pipes = []; score = 0; paused = false }
    plr.vel.y = -8
    playSnd("flap")
}

document.addEventListener('mousedown', function(event) {
    jump()
})
document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === " ") {
        jump()
    }
})

function pipenate(){
    const y = canvas.height/2+getRandomInt(-canvas.height/3, canvas.height/3)
    addPipe(y)
}
setInterval(() => {
    if (paused){return}
    pipenate()
}, 1300);

