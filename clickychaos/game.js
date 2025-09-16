const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameState = {
    score: 0,
    timeLeft: 30,
    gameRunning: false,
    gameOver: false,
    targets: [],
    clicks: 0,
    missed: 0
};

const colors = ['#ff4757', '#2ed573', '#3742fa', '#ffa502', '#f1c40f', '#e74c3c'];
const failureMessages = [
    'bruh moment detected',
    'skill issue fr',
    'certified noob behavior',
    'my grandma clicks faster',
    'absolutely maidenless',
    'touch some grass maybe?',
    'git gud scrub',
    'embarrassing honestly'
];

class Target {
    constructor() {
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = Math.random() * (canvas.height - 60) + 30;
        this.radius = 20 + Math.random() * 15;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.lifetime = 2 + Math.random() * 2; // 2-4 seconds
        this.age = 0;
        this.clicked = false;
    }

    update(deltaTime) {
        this.age += deltaTime;
        return this.age < this.lifetime && !this.clicked;
    }

    draw() {
        const alpha = 1 - (this.age / this.lifetime);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Pulsing effect
        const pulse = Math.sin(this.age * 8) * 0.1 + 1;
        const drawRadius = this.radius * pulse;
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Main target
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.restore();
    }

    isClicked(mouseX, mouseY) {
        const distance = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
        return distance <= this.radius;
    }
}

function spawnTarget() {
    if (gameState.gameRunning) {
        gameState.targets.push(new Target());
    }
}

function startGame() {
    gameState = {
        score: 0,
        timeLeft: 30,
        gameRunning: true,
        gameOver: false,
        targets: [],
        clicks: 0,
        missed: 0
    };
    
    // Spawn targets periodically
    setInterval(() => {
        if (gameState.gameRunning && gameState.targets.length < 8) {
            spawnTarget();
        }
    }, 800);
}

function endGame() {
    gameState.gameRunning = false;
    gameState.gameOver = true;
}

function drawUI() {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // Score
    ctx.strokeText(`Score: ${gameState.score}`, 20, 40);
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
    
    // Time
    ctx.strokeText(`Time: ${Math.ceil(gameState.timeLeft)}`, 20, 70);
    ctx.fillText(`Time: ${Math.ceil(gameState.timeLeft)}`, 20, 70);
    
    if (gameState.gameOver) {
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        
        // Game over message
        const message = failureMessages[Math.floor(Math.random() * failureMessages.length)];
        ctx.strokeText(message, canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = 'bold 32px Arial';
        ctx.strokeText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
        
        if (gameState.clicks > 0) {
            const accuracy = Math.round((gameState.score / gameState.clicks) * 100);
            ctx.font = 'bold 24px Arial';
            ctx.strokeText(`Accuracy: ${accuracy}%`, canvas.width / 2, canvas.height / 2 + 60);
            ctx.fillText(`Accuracy: ${accuracy}%`, canvas.width / 2, canvas.height / 2 + 60);
        }
        
        ctx.font = 'bold 20px Arial';
        ctx.strokeText('Click to play again', canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 100);
    } else if (!gameState.gameRunning) {
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText('Clicky Chaos', canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText('Clicky Chaos', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = 'bold 24px Arial';
        ctx.strokeText('Click targets before they disappear!', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Click targets before they disappear!', canvas.width / 2, canvas.height / 2);
        
        ctx.strokeText('Click to start', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    ctx.textAlign = 'left';
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.gameRunning) {
        // Update time
        gameState.timeLeft -= 1/60;
        if (gameState.timeLeft <= 0) {
            endGame();
        }
        
        // Update targets
        gameState.targets = gameState.targets.filter(target => {
            const alive = target.update(1/60);
            if (alive) {
                target.draw();
            } else if (!target.clicked) {
                gameState.missed++;
            }
            return alive;
        });
    }
    
    drawUI();
    requestAnimationFrame(gameLoop);
}

// Mouse click handling
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (!gameState.gameRunning) {
        startGame();
        return;
    }
    
    gameState.clicks++;
    
    // Check if any target was clicked
    let hit = false;
    for (let i = gameState.targets.length - 1; i >= 0; i--) {
        const target = gameState.targets[i];
        if (!target.clicked && target.isClicked(mouseX, mouseY)) {
            target.clicked = true;
            gameState.score++;
            hit = true;
            
            // Visual feedback - could add particle effect here
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+1', target.x, target.y - 30);
            ctx.restore();
            
            break;
        }
    }
});

// Start the game loop
requestAnimationFrame(gameLoop);