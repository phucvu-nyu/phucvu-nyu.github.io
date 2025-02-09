const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');

// Game settings
canvas.width = 800;  // Increased canvas size
canvas.height = 600;
let score = 0;
let gameLoop;
let pacman;
let dots = [];
let powerDots = [];
let ghosts = [];
let obstacles = [
    // Outer walls - made thinner and closer to edges
    {x: 20, y: 20, width: 760, height: 10},  // Top
    {x: 20, y: 570, width: 760, height: 10}, // Bottom
    {x: 20, y: 20, width: 10, height: 560},  // Left
    {x: 770, y: 20, width: 10, height: 560}, // Right
    
    // Inner maze structure - adjusted spacing
    // Vertical barriers
    {x: 150, y: 100, width: 20, height: 120},
    {x: 630, y: 100, width: 20, height: 120},
    {x: 250, y: 300, width: 20, height: 120},
    {x: 530, y: 300, width: 20, height: 120},
    
    // Horizontal barriers - widened gaps
    {x: 150, y: 100, width: 120, height: 20},
    {x: 530, y: 100, width: 120, height: 20},
    {x: 270, y: 250, width: 260, height: 20},
    {x: 150, y: 430, width: 120, height: 20},
    {x: 530, y: 430, width: 120, height: 20},
    
    // Center pieces - adjusted for better flow
    {x: 350, y: 150, width: 100, height: 20},
    {x: 350, y: 350, width: 100, height: 20}
];

const PACMAN_BASE_SPEED = 3;
const GHOST_SPEED_MULTIPLIER = 1.1;
const POWER_DURATION = 7000; // Reduced to 7 seconds
const GHOST_REVIVAL_TIME = 5000; // 5 seconds in milliseconds

class PowerDot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8; // Bigger than regular dots
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB8DE';
        ctx.fill();
        ctx.closePath();
    }
}

// Pacman object
class Pacman {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 15;
        this.speed = PACMAN_BASE_SPEED;
        this.direction = 0;
        this.mouthOpen = 0;
        this.mouthSpeed = 0.15;
        this.currentDirection = null; // Track current movement
        this.isPowered = false;
        this.powerTimer = null;
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
        let newX = this.x;
        let newY = this.y;
        
        switch(direction) {
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
        }

        // Check collision with obstacles
        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.direction = direction === 'left' ? Math.PI :
                           direction === 'right' ? 0 :
                           direction === 'up' ? -Math.PI/2 : Math.PI/2;
        }
        
        // Keep pacman within bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    checkCollision(x, y) {
        for (let obstacle of obstacles) {
            if (x + this.radius > obstacle.x &&
                x - this.radius < obstacle.x + obstacle.width &&
                y + this.radius > obstacle.y &&
                y - this.radius < obstacle.y + obstacle.height) {
                return true;
            }
        }
        return false;
    }

    powerUp() {
        this.isPowered = true;
        clearTimeout(this.powerTimer);
        this.powerTimer = setTimeout(() => {
            this.isPowered = false;
            ghosts.forEach(ghost => ghost.vulnerable = false);
        }, POWER_DURATION);
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
        this.speed = PACMAN_BASE_SPEED * GHOST_SPEED_MULTIPLIER;
        this.color = color;
        this.moveCounter = 0;
        this.moveInterval = 30; // Frames between moves
        this.currentDirection = this.getRandomDirection();
        this.vulnerable = false;  // Explicitly set to false
        this.eaten = false;
        this.reviveTimer = null;
        this.isInvulnerable = true;  // Add new property for initial invulnerability
    }

    getRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    update() {
        if (this.eaten) return;

        // Ensure ghost stays invulnerable for first second of game
        if (this.isInvulnerable && Date.now() - gameStartTime > 1000) {
            this.isInvulnerable = false;
        }

        this.moveCounter++;
        if (this.moveCounter >= this.moveInterval) {
            this.moveCounter = 0;
            
            // Calculate direction to/from Pacman based on vulnerable state
            const dx = pacman.x - this.x;
            const dy = pacman.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // If vulnerable, run away from Pacman
                if (this.vulnerable) {
                    this.currentDirection = 
                        Math.abs(dx) > Math.abs(dy) ?
                            (dx > 0 ? 'left' : 'right') :
                            (dy > 0 ? 'up' : 'down');
                } else {
                    // Chase Pacman
                    this.currentDirection = 
                        Math.abs(dx) > Math.abs(dy) ?
                            (dx > 0 ? 'right' : 'left') :
                            (dy > 0 ? 'down' : 'up');
                }
                
                // 10% chance to change direction randomly to avoid getting stuck
                if (Math.random() < 0.1) {
                    this.currentDirection = this.getRandomDirection();
                }
            }
        }

        let newX = this.x;
        let newY = this.y;
        const speed = this.vulnerable ? this.speed * 0.8 : this.speed;  // Slower when vulnerable
        
        switch(this.currentDirection) {
            case 'left': newX -= speed; break;
            case 'right': newX += speed; break;
            case 'up': newY -= speed; break;
            case 'down': newY += speed; break;
        }

        // Check collision with obstacles
        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // If hit obstacle, try alternate direction
            this.currentDirection = this.getRandomDirection();
        }

        // Keep ghost within bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    checkCollision(x, y) {
        for (let obstacle of obstacles) {
            if (x + this.radius > obstacle.x &&
                x - this.radius < obstacle.x + obstacle.width &&
                y + this.radius > obstacle.y &&
                y - this.radius < obstacle.y + obstacle.height) {
                return true;
            }
        }
        return false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Never start vulnerable
        ctx.fillStyle = this.isInvulnerable ? this.color :
                       this.vulnerable ? '#0000FF' : 
                       this.eaten ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.closePath();
    }

    die() {
        this.eaten = true;
        clearTimeout(this.reviveTimer);
        this.reviveTimer = setTimeout(() => {
            this.revive();
        }, GHOST_REVIVAL_TIME);
    }

    revive() {
        this.eaten = false;
        this.vulnerable = false;
        
        // Find a safe spawn position
        let safePosition = this.findSafePosition();
        this.x = safePosition.x;
        this.y = safePosition.y;
    }

    findSafePosition() {
        const padding = 40; // Minimum distance from obstacles
        let position;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            position = {
                x: Math.random() * (canvas.width - 2 * padding) + padding,
                y: Math.random() * (canvas.height - 2 * padding) + padding
            };
            attempts++;

            // Check if position is safe
            let isSafe = true;
            for (let obstacle of obstacles) {
                if (position.x > obstacle.x - padding && 
                    position.x < obstacle.x + obstacle.width + padding &&
                    position.y > obstacle.y - padding && 
                    position.y < obstacle.y + obstacle.height + padding) {
                    isSafe = false;
                    break;
                }
            }

            if (isSafe) return position;
        } while (attempts < maxAttempts);

        // Fallback to center if no safe position found
        return {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
    }
}

// Add game start time tracking
let gameStartTime;

function initGame() {
    score = 0;
    scoreElement.textContent = score;
    gameStartTime = Date.now();  // Set game start time
    pacman = new Pacman();
    dots = [];
    ghosts = [];

    // Create dots in a grid pattern, avoiding obstacles
    const gridSize = 30; // Smaller grid size for more dots
    for (let x = 40; x < canvas.width - 40; x += gridSize) {
        for (let y = 40; y < canvas.height - 40; y += gridSize) {
            // Check if position conflicts with obstacles
            let canPlace = true;
            for (let obstacle of obstacles) {
                if (x > obstacle.x - 15 && x < obstacle.x + obstacle.width + 15 &&
                    y > obstacle.y - 15 && y < obstacle.y + obstacle.height + 15) {
                    canPlace = false;
                    break;
                }
            }
            if (canPlace) {
                dots.push(new Dot(x, y));
            }
        }
    }

    // Add power dots in more accessible locations
    const powerDotPositions = [
        {x: 50, y: 50},                    // Top left
        {x: canvas.width - 50, y: 50},     // Top right
        {x: 50, y: canvas.height - 50},    // Bottom left
        {x: canvas.width - 50, y: canvas.height - 50}, // Bottom right
        {x: canvas.width/2, y: canvas.height/2}  // Center
    ];
    
    powerDots = powerDotPositions.map(pos => new PowerDot(pos.x, pos.y));

    // Create ghosts with safe starting positions
    const ghostColors = ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'];
    const safePositions = [
        {x: 100, y: 100},
        {x: canvas.width - 100, y: 100},
        {x: 100, y: canvas.height - 100},
        {x: canvas.width - 100, y: canvas.height - 100}
    ];

    for (let i = 0; i < 4; i++) {
        let ghost = new Ghost(
            safePositions[i].x,
            safePositions[i].y,
            ghostColors[i]
        );
        ghosts.push(ghost);
    }
}

function gameOver(isWin = false) {
    cancelAnimationFrame(gameLoop);
    
    // Stop all ghost and pacman movement
    pacman.currentDirection = null;
    ghosts.forEach(ghost => {
        ghost.currentDirection = null;
    });

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game over message
    ctx.fillStyle = isWin ? '#00FF00' : '#FF0000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    const message = isWin ? 'You Win!' : 'Game Over!';
    ctx.fillText(message, canvas.width/2, canvas.height/2 - 50);
    
    // Show final score
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2);
    
    // Show restart button
    startButton.textContent = 'Play Again';
    startButton.style.display = 'block';
}

function update() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    ctx.fillStyle = '#0000FF';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Move pacman in current direction
    if (pacman.currentDirection) {
        pacman.move(pacman.currentDirection);
    }
    pacman.update();
    pacman.draw();

    // Draw power dots
    powerDots.forEach((dot, index) => {
        dot.draw();
        const dx = pacman.x - dot.x;
        const dy = pacman.y - dot.y;
        if (Math.sqrt(dx * dx + dy * dy) < pacman.radius + dot.radius) {
            powerDots.splice(index, 1);
            pacman.powerUp();
            ghosts.forEach(ghost => ghost.vulnerable = true);
            score += 50;
            scoreElement.textContent = score;
        }
    });

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
        if (!ghost.eaten) {
            ghost.update();
            ghost.draw();
            
            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            if (Math.sqrt(dx * dx + dy * dy) < (pacman.radius + ghost.radius)) {
                if (ghost.vulnerable) {
                    ghost.die();
                    score += 200;
                    scoreElement.textContent = score;
                } else if (!ghost.eaten) {
                    gameOver();
                    return;
                }
            }
        }
    });

    // Win condition
    if (dots.length === 0) {
        gameOver(true);  // Pass true to indicate win
        return;
    }

    gameLoop = requestAnimationFrame(update);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameLoop) {
        startButton.click();  // Simulate button click
    } else if (pacman) {
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
    startButton.textContent = 'Play Again';  // Reset button text
    initGame();
    update();
});

// Initial setup
initGame();
