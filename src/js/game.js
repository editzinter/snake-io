// Import from auth and supabase
import { supabase } from './supabase.js';

// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard');
const highscoresDiv = document.getElementById('highscores');
const highscoresList = document.getElementById('highscores-list');
const showHighscoresButton = document.getElementById('show-highscores');
const closeHighscoresButton = document.getElementById('close-highscores');

// Variables that would be imported from auth.js
let currentUser = null;
async function saveHighScore(score) {
    if (!currentUser) return false;
    
    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('highscores')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
            console.error('Error fetching existing score:', fetchError);
            return false;
        }
        
        // Only update if new score is higher or no previous score exists
        if (!existingData || score > existingData.score) {
            const { error: upsertError } = await supabase
                .from('highscores')
                .upsert({ 
                    user_id: currentUser.id,
                    score: score,
                    username: document.getElementById('playerName').value || 'Anonymous'
                });
                
            if (upsertError) {
                console.error('Error saving score:', upsertError);
                return false;
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('High score save error:', error);
        return false;
    }
}

// Try to load auth module dynamically if needed
try {
    import('./auth.js').then(module => {
        console.log('Auth module loaded');
        currentUser = module.currentUser;
        // Replace the local save function with the imported one
        saveHighScore = module.saveHighScore;
    }).catch(err => {
        console.warn('Could not load auth module:', err);
    });
} catch (e) {
    console.warn('Dynamic import not supported, using fallback auth');
}

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let gameRunning = false;
let foodItems = [];
let player = null;
let aiSnakes = [];
let score = 0;
let lastTime = 0;
let frameCount = 0;
let cameraZoom = 1;
let mousePosition = { x: canvas.width / 2, y: canvas.height / 2 };

// Colors
const COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
    '#33FFF3', '#FF8C33', '#8CFF33', '#338CFF', '#FF338C'
];

// Event listeners
startButton.addEventListener('click', startGame);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', updateMousePosition);
showHighscoresButton.addEventListener('click', showHighscores);
closeHighscoresButton.addEventListener('click', closeHighscores);

// Helper functions
function getRandomPosition(minDistance = 100) {
    // Get position away from player if exists
    const x = Math.random() * (canvas.width * 3) - canvas.width;
    const y = Math.random() * (canvas.height * 3) - canvas.height;
    
    if (player) {
        const dx = player.segments[0].x - x;
        const dy = player.segments[0].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            return getRandomPosition(minDistance);
        }
    }
    
    return { x, y };
}

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function updateMousePosition(e) {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
}

// Snake class
class Snake {
    constructor(x, y, color, name, isPlayer = false) {
        this.segments = [{ x, y }];
        this.color = color;
        this.name = name;
        this.velocity = { x: 0, y: 0 };
        this.speed = 3;
        this.segmentSize = 15;
        this.segmentSpacing = 5;
        this.segmentTargets = 10; // Starting length
        this.isPlayer = isPlayer;
        this.angle = 0;
        this.targetAngle = 0;
        this.turnSpeed = 0.1;
        this.alive = true;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Update target angle
        if (this.isPlayer) {
            // Calculate angle to mouse
            const dx = mousePosition.x - canvas.width / 2;
            const dy = mousePosition.y - canvas.height / 2;
            this.targetAngle = Math.atan2(dy, dx);
        } else {
            // AI movement logic
            // Randomly change direction occasionally
            if (Math.random() < 0.02) {
                this.targetAngle += (Math.random() - 0.5) * Math.PI / 2;
            }
            
            // Avoid walls - simple boundary check
            const head = this.segments[0];
            const margin = 200;
            const worldSize = Math.max(canvas.width, canvas.height) * 2;
            
            if (head.x < -worldSize + margin) this.targetAngle = 0;
            if (head.x > worldSize - margin) this.targetAngle = Math.PI;
            if (head.y < -worldSize + margin) this.targetAngle = Math.PI / 2;
            if (head.y > worldSize - margin) this.targetAngle = -Math.PI / 2;
            
            // Move toward food if nearby
            let closestFood = null;
            let closestDistance = 200; // Detection radius
            
            for (const food of foodItems) {
                const dx = food.x - head.x;
                const dy = food.y - head.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestFood = food;
                    closestDistance = distance;
                }
            }
            
            if (closestFood) {
                const dx = closestFood.x - head.x;
                const dy = closestFood.y - head.y;
                this.targetAngle = Math.atan2(dy, dx);
            }
        }
        
        // Smooth angle change
        const angleDiff = (this.targetAngle - this.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        this.angle += angleDiff * this.turnSpeed;
        
        // Update velocity
        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;
        
        // Move head
        const newHead = {
            x: this.segments[0].x + this.velocity.x,
            y: this.segments[0].y + this.velocity.y
        };
        
        this.segments.unshift(newHead);
        
        // Remove excess segments if snake is longer than it should be
        if (this.segments.length > this.segmentTargets) {
            this.segments = this.segments.slice(0, this.segmentTargets);
        }
        
        // Check for food collision
        this.checkFoodCollision();
        
        // Check for collision with other snakes
        this.checkSnakeCollisions();
    }
    
    checkFoodCollision() {
        const head = this.segments[0];
        const eatDistance = this.segmentSize;
        
        for (let i = foodItems.length - 1; i >= 0; i--) {
            const food = foodItems[i];
            const dx = head.x - food.x;
            const dy = head.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < eatDistance) {
                // Eat food
                this.segmentTargets += food.value;
                if (this.isPlayer) {
                    score += food.value;
                    scoreDisplay.textContent = score;
                }
                
                // Remove food
                foodItems.splice(i, 1);
                
                // Spawn new food
                spawnFood();
            }
        }
    }
    
    checkSnakeCollisions() {
        if (!this.alive) return;
        
        const head = this.segments[0];
        
        // Check collision with other snakes
        const snakesToCheck = this.isPlayer ? aiSnakes : [player, ...aiSnakes.filter(s => s !== this)];
        
        for (const otherSnake of snakesToCheck) {
            if (!otherSnake || !otherSnake.alive) continue;
            
            // Start checking from segment 1 if it's the same snake
            const startSegment = otherSnake === this ? 1 : 0;
            
            for (let i = startSegment; i < otherSnake.segments.length; i++) {
                const segment = otherSnake.segments[i];
                const dx = head.x - segment.x;
                const dy = head.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.segmentSize * 0.8) {
                    this.die();
                    return;
                }
            }
        }
    }
    
    die() {
        this.alive = false;
        
        // Convert each segment to food
        for (let i = 0; i < this.segments.length; i += 3) {
            foodItems.push({
                x: this.segments[i].x,
                y: this.segments[i].y,
                color: this.color,
                size: 5,
                value: 1
            });
        }
        
        if (this.isPlayer) {
            // End game and save score
            saveScoreAndEndGame();
        } else {
            // Replace AI snake
            setTimeout(() => {
                const index = aiSnakes.indexOf(this);
                if (index !== -1) {
                    const pos = getRandomPosition(300);
                    aiSnakes[index] = createAISnake(pos.x, pos.y);
                }
            }, 5000);
        }
    }
    
    draw(ctx, offsetX, offsetY) {
        if (!this.alive) return;
        
        // Draw each segment
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            const size = this.segmentSize * (i === 0 ? 1.2 : 1); // Slightly bigger head
            
            // Calculate size based on position in snake body
            const sizeFactor = 0.8 + (1 - i / this.segments.length) * 0.4;
            const adjustedSize = size * sizeFactor;
            
            ctx.beginPath();
            ctx.arc(
                segment.x - offsetX,
                segment.y - offsetY,
                adjustedSize,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Add eyes to the head
            if (i === 0) {
                // Left eye
                const leftEyeX = segment.x - offsetX + Math.cos(this.angle - Math.PI/4) * (size * 0.5);
                const leftEyeY = segment.y - offsetY + Math.sin(this.angle - Math.PI/4) * (size * 0.5);
                
                // Right eye
                const rightEyeX = segment.x - offsetX + Math.cos(this.angle + Math.PI/4) * (size * 0.5);
                const rightEyeY = segment.y - offsetY + Math.sin(this.angle + Math.PI/4) * (size * 0.5);
                
                // Draw eyes
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, size * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(rightEyeX, rightEyeY, size * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                
                // Pupils
                ctx.beginPath();
                ctx.arc(leftEyeX + Math.cos(this.angle) * 2, leftEyeY + Math.sin(this.angle) * 2, size * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(rightEyeX + Math.cos(this.angle) * 2, rightEyeY + Math.sin(this.angle) * 2, size * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();
            }
        }
        
        // Draw name
        if (this.segments.length > 0) {
            const head = this.segments[0];
            ctx.font = '14px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, head.x - offsetX, head.y - offsetY - this.segmentSize - 10);
        }
    }
}

// Game functions
function startGame() {
    // Hide menu
    menu.classList.add('hidden');
    
    // Reset game state
    foodItems = [];
    aiSnakes = [];
    score = 0;
    scoreDisplay.textContent = score;
    gameRunning = true;
    
    // Create player
    const playerName = playerNameInput.value.trim() || 'Player';
    const playerColor = getRandomColor();
    player = new Snake(0, 0, playerColor, playerName, true);
    
    // Create AI snakes
    for (let i = 0; i < 10; i++) {
        const pos = getRandomPosition(300);
        aiSnakes.push(createAISnake(pos.x, pos.y));
    }
    
    // Spawn initial food
    for (let i = 0; i < 200; i++) {
        spawnFood();
    }
    
    // Update player profile if logged in
    if (currentUser) {
        updatePlayerProfile(playerName);
    }
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

async function updatePlayerProfile(username) {
    if (!currentUser) return;
    
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: currentUser.id,
                username: username,
                updated_at: new Date()
            });
            
        if (error) {
            console.error('Error updating profile:', error);
        }
    } catch (error) {
        console.error('Profile update error:', error);
    }
}

async function saveScoreAndEndGame() {
    // Save score to Supabase if user is logged in
    if (currentUser) {
        await saveHighScore(score);
    }
    
    // End game after short delay
    setTimeout(() => {
        gameRunning = false;
        menu.classList.remove('hidden');
    }, 2000);
}

function createAISnake(x, y) {
    const color = getRandomColor();
    const namePrefix = ['Hungry', 'Sneaky', 'Speedy', 'Slimy', 'Slithery', 'Wiggly'];
    const nameSuffix = ['Snake', 'Python', 'Cobra', 'Viper', 'Worm', 'Eel'];
    const name = `${namePrefix[Math.floor(Math.random() * namePrefix.length)]} ${nameSuffix[Math.floor(Math.random() * nameSuffix.length)]}`;
    
    return new Snake(x, y, color, name, false);
}

function spawnFood() {
    const pos = getRandomPosition();
    const size = Math.random() < 0.1 ? 10 : 5; // Occasionally spawn larger food
    const value = size === 10 ? 3 : 1;
    
    foodItems.push({
        x: pos.x,
        y: pos.y,
        color: getRandomColor(),
        size: size,
        value: value
    });
}

function updateLeaderboard() {
    // Clear current leaderboard
    leaderboardList.innerHTML = '';
    
    // Create array of all snakes
    const allSnakes = [player, ...aiSnakes].filter(snake => snake && snake.alive);
    
    // Sort by length
    allSnakes.sort((a, b) => b.segmentTargets - a.segmentTargets);
    
    // Display top 5
    for (let i = 0; i < Math.min(5, allSnakes.length); i++) {
        const snake = allSnakes[i];
        const listItem = document.createElement('li');
        listItem.style.color = snake.color;
        listItem.textContent = `${i + 1}. ${snake.name}: ${snake.segmentTargets}`;
        leaderboardList.appendChild(listItem);
    }
}

async function showHighscores() {
    highscoresDiv.classList.remove('hidden');
    await fetchHighscores();
}

function closeHighscores() {
    highscoresDiv.classList.add('hidden');
}

async function fetchHighscores() {
    try {
        highscoresList.innerHTML = '<li>Loading...</li>';
        
        const { data, error } = await supabase
            .from('highscores')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('Error fetching highscores:', error);
            highscoresList.innerHTML = '<li>Error loading highscores</li>';
            return;
        }
        
        if (data && data.length > 0) {
            highscoresList.innerHTML = '';
            
            data.forEach((entry, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${index + 1}. ${entry.username || 'Anonymous'}</span>
                    <span>${entry.score}</span>
                `;
                
                // Highlight current user's score
                if (currentUser && entry.user_id === currentUser.id) {
                    listItem.style.backgroundColor = '#e7fae7';
                    listItem.style.fontWeight = 'bold';
                }
                
                highscoresList.appendChild(listItem);
            });
        } else {
            highscoresList.innerHTML = '<li>No highscores yet</li>';
        }
    } catch (error) {
        console.error('Highscores fetch error:', error);
        highscoresList.innerHTML = '<li>Error loading highscores</li>';
    }
}

function drawBackground(ctx, offsetX, offsetY) {
    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const offsetXMod = offsetX % gridSize;
    const offsetYMod = offsetY % gridSize;
    
    // Horizontal lines
    for (let y = -offsetYMod; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Vertical lines
    for (let x = -offsetXMod; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update game state
    if (gameRunning) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate camera position (player centered)
        let cameraX = 0;
        let cameraY = 0;
        
        if (player && player.alive) {
            cameraX = player.segments[0].x - canvas.width / 2;
            cameraY = player.segments[0].y - canvas.height / 2;
            
            // Update player
            player.update(deltaTime);
        }
        
        // Draw background
        drawBackground(ctx, cameraX, cameraY);
        
        // Update and draw AI snakes
        for (const snake of aiSnakes) {
            if (snake.alive) {
                snake.update(deltaTime);
                snake.draw(ctx, cameraX, cameraY);
            }
        }
        
        // Draw food
        for (const food of foodItems) {
            ctx.beginPath();
            ctx.arc(
                food.x - cameraX,
                food.y - cameraY,
                food.size,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = food.color;
            ctx.fill();
        }
        
        // Draw player on top
        if (player && player.alive) {
            player.draw(ctx, cameraX, cameraY);
        }
        
        // Update leaderboard every 30 frames
        frameCount++;
        if (frameCount % 30 === 0) {
            updateLeaderboard();
            
            // Spawn new food occasionally
            if (foodItems.length < 300 && Math.random() < 0.3) {
                spawnFood();
            }
        }
        
        // Continue game loop
        requestAnimationFrame(gameLoop);
    }
}

// Initialize event listeners
window.addEventListener('load', () => {
    console.log('Game module loaded');
    // Adjust canvas to window size
    resizeCanvas();
}); 