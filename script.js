const board = document.querySelector('.board');
const startBtn = document.querySelector('.btn-start');  
const blockHeight = 50;
const blockWidth = 50;
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const restartBtn = document.querySelector('.btn-restart');
const scoreDisplay = document.querySelector('#Score');
const highScoreDisplay = document.querySelector('#High-score');
const timeDisplay = document.querySelector('#time');

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocks = {};
let direction = 'right';
let intervalid = null;
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') ? parseInt(localStorage.getItem('snakeHighScore')) : 0;
let gameStartTime = 0;
let timeIntervalId = null;

// Initialize high score display
highScoreDisplay.textContent = highScore;

let food = {x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols)};

const centerX = Math.floor(rows / 2);
const centerY = Math.floor(cols / 2);

let snake = [
    {
        x: centerX,
        y: centerY + 2
    },
    {
        x: centerX,
        y: centerY + 1
    },
    {
        x: centerX,
        y: centerY
    }
];

// debug info
console.log('board size', board.clientWidth, board.clientHeight, 'cols,rows', cols, rows);

// ensure we have a usable grid
if (cols <= 0 || rows <= 0) {
    console.error('Board has zero cols or rows. Ensure .board has visible size in CSS.');
}

// ensure snake initial position is inside bounds and oriented by direction
for (let i = 0; i < snake.length; i++) {
    // clamp within bounds
    if (snake[i].x < 0) snake[i].x = 0;
    if (snake[i].x >= rows) snake[i].x = rows - 1;
    if (snake[i].y < 0) snake[i].y = 0;
    if (snake[i].y >= cols) snake[i].y = cols - 1;
}

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {

        const block = document.createElement('div');

        block.classList.add('block');

        board.appendChild(block);

        blocks[`${row}-${col}`] = block;
    }
}

// render the board: snake and food
function render() {
    // clear fills
    Object.values(blocks).forEach(b => {
        b.classList.remove('fill', 'food');
    });

    // draw snake
    snake.forEach(segment => {
        const key = `${segment.x}-${segment.y}`;
        if (blocks[key]) blocks[key].classList.add('fill');
    });

    // draw food
    const foodKey = `${food.x}-${food.y}`;
    if (blocks[foodKey]) blocks[foodKey].classList.add('food');
}

function step() {
    if (!gameRunning) return;
    
    let head = { x: snake[0].x, y: snake[0].y };
    if (direction === 'left') head.y -= 1;
    else if (direction === 'right') head.y += 1;
    else if (direction === 'down') head.x += 1;
    else if (direction === 'up') head.x -= 1;

    // check out-of-bounds
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        endGame();
        return;
    }

    // check self-collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        endGame();
        return;
    }

    // move: eat food or move forward
    if (head.x === food.x && head.y === food.y) {
        snake.unshift(head);
        score += 10;
        scoreDisplay.textContent = score;
        
        // place new food (avoid spawning on snake)
        do {
            food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };
        } while (snake.some(s => s.x === food.x && s.y === food.y));
    } else {
        snake.unshift(head);
        snake.pop();
    }

    render();
}

function endGame() {
    gameRunning = false;
    clearInterval(intervalid);
    clearInterval(timeIntervalId);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    gameOverModal.style.display = 'flex';
    modal.style.display = 'flex';
}

function updateTimer() {
    const currentTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}-${String(seconds).padStart(2, '0')}`;
}


// draw initial snake immediately (only if grid exists)
if (cols > 0 && rows > 0) {
    render();
    console.log('Board ready, waiting for player to start game');
} else {
    console.error('Game loop not started due to invalid board size.');
}

startBtn.addEventListener('click', () => {
    // Reset game state
    score = 0;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = '00-00';
    
    // Hide modals
    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    modal.style.display = 'none';
    
    // Start game
    gameRunning = true;
    gameStartTime = Date.now();
    intervalid = setInterval(step, 400);
    timeIntervalId = setInterval(updateTimer, 100);
});

restartBtn.addEventListener('click', () => {
    // Reset snake to center
    snake.length = 0;
    snake.push({x: centerX, y: centerY + 2});
    snake.push({x: centerX, y: centerY + 1});
    snake.push({x: centerX, y: centerY});
    
    // Reset food
    food = {x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols)};
    
    // Reset direction
    direction = 'right';
    
    // Reset game state
    score = 0;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = '00-00';
    
    // Hide modals
    gameOverModal.style.display = 'none';
    modal.style.display = 'none';
    
    render();
    
    // Start new game
    gameRunning = true;
    gameStartTime = Date.now();
    intervalid = setInterval(step, 400);
    timeIntervalId = setInterval(updateTimer, 100);
});

// prevent reversing direction directly
addEventListener('keydown', (event) => {
    const key = event.key;
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    let newDir = null;
    if (key === 'ArrowUp') newDir = 'up';
    else if (key === 'ArrowRight') newDir = 'right';
    else if (key === 'ArrowLeft') newDir = 'left';
    else if (key === 'ArrowDown') newDir = 'down';

    if (newDir && opposites[newDir] !== direction) {
        direction = newDir;
    }
});
