const body = document.getElementById("body")
const c = document.getElementById("canvas")
const ctx = c.getContext("2d")

const paddleSpeed = 40
let paused = false

let plr1 = {
    pos: {x: 80, y: canvas.height/2},
    vel: {x: 0, y: 0},
    size: {x: 20, y: 100},
    score: 0,
    inputs: {
        up: false,
        down: false,
    }
}
let plr2 = {
    pos: {x: canvas.width-80, y: 2},
    vel: {x: 0, y: 0},
    size: {x: 20, y: 100},
    score: 0,
    inputs: {
        up: false,
        down: false,
    }
}

let ball = {
    pos: {x: canvas.width/2, y: canvas.height/2},
    vel: {x: -9, y: 7},
    size: {x: 25, y: 25},
}

let sounds = {
    pling: new Audio('./pling.mp3'),
    plong: new Audio('./plong.mp3'),
}
function playSnd(name){
    const snd = sounds[name]
     snd.pause();
    snd.currentTime = 0;
    snd.play();
}


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
    
    
    
    
    ctx.font = '50px Arial';
    ctx.fillStyle = 'rgb(204, 80, 241)';
    ctx.fillText(plr1.score, 20, canvas.height/2);
    ctx.fillText(plr2.score, canvas.width-40, canvas.height/2);

    if (paused){
        ctx.font = '90px Arial';
        ctx.fillText("fucking loser lmao", canvas.width/2-150, canvas.height/2);
    }


    function spawnshit(){
        ctx.fillRect(plr1.pos.x, plr1.pos.y, plr1.size.x, plr1.size.y)
        ctx.fillRect(plr2.pos.x, plr2.pos.y, plr2.size.x, plr2.size.y)

        ctx.fillRect(ball.pos.x, ball.pos.y, ball.size.x, ball.size.y)
    }

    ctx.filter = "blur(30px)"
    spawnshit()

    ctx.filter = "none"
    spawnshit()
    
    
}
let plingerling = false
function tick(dt, elapsed){
    if (paused == true){return}

    plr1.pos = vec.add(plr1.pos, plr1.vel)
    plr2.pos = vec.add(plr2.pos, plr2.vel)
    ball.pos = vec.add(ball.pos, ball.vel)

    const plrs = [plr1, plr2]
    plrs.forEach(function(plr){
        if (plr.inputs.up){
            plr.vel.y -= dt*paddleSpeed
        }
        if (plr.inputs.down){
            plr.vel.y += dt*paddleSpeed
        }
        plr.vel = vec.mulNum(plr.vel, Math.pow(0.01, dt))
        
        const clampedPos = clamp(plr.pos.y, 0, canvas.height-plr.size.y)
        if (clampedPos != plr.pos.y){plr.vel.y *= -0.5}
        plr.pos.y = clampedPos

        if (overlapRect(plr.pos, plr.size, vec.add(ball.pos, vec.divNum(ball.size, 2) ))){
            ball.vel.x *= -1
            plr.score++
            ball.pos.x = clamp(ball.pos.x, plr1.pos.x-plr1.size.x+ball.size.x, plr2.pos.x-ball.size.x)
            plingerling = !plingerling
            playSnd((plingerling && "pling") || "plong")
            //ball.vel.y += plr.vel.y/2
        }
    })

    plr2.inputs.up = false
    plr2.inputs.down = false

    ctx.fillStyle = "rgba(255, 0, 0, 0.05)"

    let tempPos = vec.new(ball.pos.x, ball.pos.y)
    let tempVel = vec.new(ball.vel.x, ball.vel.y)
    while (tempPos.x < plr2.pos.x) {
        tempPos = vec.add(tempPos, tempVel)
        const clampedPos = clamp(tempPos.y, 0, canvas.height-ball.size.y)
        if (clampedPos != tempPos.y){tempVel.y *= -1}
        tempPos.y = clampedPos

        if (tempPos.x < plr1.pos.x){tempVel.x *= -1; tempPos.x = plr1.pos.x}

        //ctx.fillRect(tempPos.x, tempPos.y, ball.size.x, ball.size.y)
    }
    ctx.fillRect(tempPos.x, tempPos.y, ball.size.x, ball.size.y)
    

    //let target = ((ball.pos.x - plr2.pos.x)/ball.vel.x)*ball.vel.y
    //if (target > canvas.height || target < 0) {target *= -1}

    let diff = (plr2.pos.y+plr2.size.y/2) - tempPos.y
    //if (ball.vel.x < 0){diff = (plr2.pos.y+plr2.size.y/2) - canvas.height/2}

    if (diff > (plr2.size.y/2-5)){
        plr2.inputs.up = true
    }
    if (diff < -(plr2.size.y/2-5)){
        plr2.inputs.down = true
    }

    const clampedPos = clamp(ball.pos.y, 0, canvas.height-ball.size.y)
    if (clampedPos != ball.pos.y){ball.vel.y *= -1}
    ball.pos.y = clampedPos

    if (ball.pos.x > canvas.width || ball.pos.x < 0){paused = true}
    
}

function die(){ 
    paused = true
}

function restart(){
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

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    tick(dt, elapsed)
    
    render(dt, elapsed)

    requestAnimationFrame(gameLoop)
}

gameLoop(performance.now())


document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "w") {
        plr1.inputs.up = true
    }
    if (event.key.toLowerCase() === "s") {
        plr1.inputs.down = true
    }
})

document.addEventListener("keyup", function(event) {
    if (event.key.toLowerCase() === "w") {
        plr1.inputs.up = false
    }
    if (event.key.toLowerCase() === "s") {
        plr1.inputs.down = false
    }
})

