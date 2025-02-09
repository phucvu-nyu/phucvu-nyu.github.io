const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');

// Game settings
canvas.width = 600;
canvas.height = 400;
let score = 0;
let gameLoop;
let pacman;
let dots = [];
let ghosts = [];

// Pacman object
class Pacman {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 15;
        this.speed = 5;  // Increased speed
        this.direction = 0;
        this.mouthOpen = 0;
        this.mouthSpeed = 0.15;
        this.currentDirection = null; // Track current movement
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.mouthOpen, Math.PI * 2 - this.mouthOpen);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = '#FFFF00';
        ctx.fill();
        
        ctx.restore();
    }

    update() {
        this.mouthOpen += this.mouthSpeed;
        if (this.mouthOpen > 0.5 || this.mouthOpen < 0) this.mouthSpeed *= -1;
    }

    move(direction) {
        this.currentDirection = direction;
        switch(direction) {
            case 'left':
                this.direction = Math.PI;
                this.x -= this.speed;
                break;
            case 'right':
                this.direction = 0;
                this.x += this.speed;
                break;
            case 'up':
                this.direction = -Math.PI/2;
                this.y -= this.speed;
                break;
            case 'down':
                this.direction = Math.PI/2;
                this.y += this.speed;
                break;
        }
        
        // Keep pacman within bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }
}

// Dot class
class Dot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();
    }
}

// Ghost class
class Ghost {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 1;  // Reduced speed
        this.color = color;
        this.moveCounter = 0;
        this.moveInterval = 30; // Frames between moves
        this.currentDirection = this.getRandomDirection();
    }

    getRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    update() {
        this.moveCounter++;
        if (this.moveCounter >= this.moveInterval) {
            this.moveCounter = 0;
            // 20% chance to change direction
            if (Math.random() < 0.2) {
                this.currentDirection = this.getRandomDirection();
            }
        }

        switch(this.currentDirection) {
            case 'left':
                this.x -= this.speed;
                break;
            case 'right':
                this.x += this.speed;
                break;
            case 'up':
                this.y -= this.speed;
                break;
            case 'down':
                this.y += this.speed;
                break;
        }

        // Keep ghost within bounds and bounce
        if (this.x <= this.radius || this.x >= canvas.width - this.radius) {
            this.currentDirection = this.x <= this.radius ? 'right' : 'left';
        }
        if (this.y <= this.radius || this.y >= canvas.height - this.radius) {
            this.currentDirection = this.y <= this.radius ? 'down' : 'up';
        }

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function initGame() {
    score = 0;
    scoreElement.textContent = score;
    pacman = new Pacman();
    dots = [];
    ghosts = [];

    // Create dots
    for (let i = 0; i < 50; i++) {
        dots.push(new Dot(
            Math.random() * (canvas.width - 40) + 20,
            Math.random() * (canvas.height - 40) + 20
        ));
    }

    // Create ghosts
    const ghostColors = ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'];
    for (let i = 0; i < 4; i++) {
        ghosts.push(new Ghost(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            ghostColors[i]
        ));
    }
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF0000';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
    startButton.style.display = 'block';
}

function update() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move pacman in current direction
    if (pacman.currentDirection) {
        pacman.move(pacman.currentDirection);
    }
    pacman.update();
    pacman.draw();

    // Update and draw dots
    dots.forEach((dot, index) => {
        dot.draw();
        const dx = pacman.x - dot.x;
        const dy = pacman.y - dot.y;
        if (Math.sqrt(dx * dx + dy * dy) < pacman.radius) {
            dots.splice(index, 1);
            score += 10;
            scoreElement.textContent = score;
        }
    });

    // Update and draw ghosts
    ghosts.forEach(ghost => {
        ghost.update();
        ghost.draw();
        
        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        if (Math.sqrt(dx * dx + dy * dy) < (pacman.radius + ghost.radius)) {
            gameOver();
            return;
        }
    });

    // Win condition
    if (dots.length === 0) {
        gameOver();
        return;
    }

    gameLoop = requestAnimationFrame(update);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (pacman) {
        switch(e.key) {
            case 'ArrowLeft':
                pacman.move('left');
                break;
            case 'ArrowRight':
                pacman.move('right');
                break;
            case 'ArrowUp':
                pacman.move('up');
                break;
            case 'ArrowDown':
                pacman.move('down');
                break;
        }
    }
});

startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    initGame();
    update();
});

// Initial setup
initGame();
