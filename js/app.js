// Game Constants
const BOARD_SIZE = 8;
const COMBO_MULTIPLIER = 1.5;
const POINTS_PER_BLOCK = 1;
const POINTS_PER_LINE = 10;

const SHAPES = [
    { shape: [[1]], color: 'var(--color-1)' },
    { shape: [[1], [1]], color: 'var(--color-2)' },
    { shape: [[1, 1]], color: 'var(--color-2)' },
    { shape: [[1], [1], [1]], color: 'var(--color-3)' },
    { shape: [[1, 1, 1]], color: 'var(--color-3)' },
    { shape: [[1], [1], [1], [1]], color: 'var(--color-4)' },
    { shape: [[1, 1, 1, 1]], color: 'var(--color-4)' },
    { shape: [[1, 1], [1, 1]], color: 'var(--color-5)' },
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'var(--color-6)' },
    { shape: [[1, 0], [1, 0], [1, 1]], color: 'var(--color-7)' },
    { shape: [[0, 1], [0, 1], [1, 1]], color: 'var(--color-7)' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'var(--color-1)' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'var(--color-2)' }
];

class Game {
    constructor() {
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
        this.currentScore = 0;
        this.highScore = parseInt(localStorage.getItem('block-blaster-high-score')) || 0;
        this.availablePieces = [null, null, null];
        this.draggingPiece = null;
        this.draggingElement = null;
        this.dragOffset = { x: 0, y: 0 };

        this.initUI();
        this.startNewGame();
    }

    initUI() {
        this.boardElement = document.getElementById('game-board');
        this.piecesContainer = document.getElementById('pieces-container');
        this.scoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreElement = document.getElementById('final-score');

        document.getElementById('restart-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('reset-game').addEventListener('click', () => {
            if (confirm('Deseja reiniciar a partida?')) this.startNewGame();
        });

        this.updateScoreUI();
        this.createBoardUI();
    }

    startNewGame() {
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
        this.currentScore = 0;
        this.gameOverModal.classList.add('hidden');
        this.updateScoreUI();
        this.createBoardUI();
        this.generateNewPieces();
    }

    createBoardUI() {
        this.boardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (this.board[r][c]) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = this.board[r][c];
                }
                this.boardElement.appendChild(cell);
            }
        }
    }

    generateNewPieces() {
        this.availablePieces = this.availablePieces.map(() => {
            const randomIndex = Math.floor(Math.random() * SHAPES.length);
            return { ...SHAPES[randomIndex], id: Math.random().toString(36).substr(2, 9) };
        });
        this.renderPiecesTray();
        this.checkGameOver();
    }

    renderPiecesTray() {
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`slot-${i}`);
            slot.innerHTML = '';

            if (this.availablePieces[i]) {
                const pieceObj = this.availablePieces[i];
                const pieceEl = this.createPieceElement(pieceObj, i);
                slot.appendChild(pieceEl);
            }
        }
    }

    createPieceElement(pieceObj, slotIndex) {
        const pieceEl = document.createElement('div');
        pieceEl.classList.add('piece');
        pieceEl.dataset.slotIndex = slotIndex;

        const rows = pieceObj.shape.length;
        const cols = pieceObj.shape[0].length;

        pieceEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        pieceEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        pieceObj.shape.forEach((row, ri) => {
            row.forEach((cell, ci) => {
                const block = document.createElement('div');
                block.classList.add('block');
                if (cell === 1) {
                    block.style.backgroundColor = pieceObj.color;
                } else {
                    block.style.visibility = 'hidden';
                }
                pieceEl.appendChild(block);
            });
        });

        pieceEl.addEventListener('pointerdown', (e) => this.handleDragStart(e, pieceObj, pieceEl));

        return pieceEl;
    }

    handleDragStart(e, pieceObj, pieceEl) {
        this.draggingPiece = pieceObj;
        this.draggingElement = pieceEl.cloneNode(true);
        this.draggingElement.classList.add('dragging');

        const boardCell = document.querySelector('.cell');
        const blockSize = boardCell.offsetWidth;
        this.draggingElement.style.width = (pieceObj.shape[0].length * (blockSize + 4)) + 'px';
        this.draggingElement.style.height = (pieceObj.shape.length * (blockSize + 4)) + 'px';

        this.draggingElement.querySelectorAll('.block').forEach(b => {
            b.style.width = blockSize + 'px';
            b.style.height = blockSize + 'px';
        });

        document.body.appendChild(this.draggingElement);

        const rect = pieceEl.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.updateDragPosition(e);

        const onPointerMove = (moveEvent) => this.handleDragMove(moveEvent);
        const onPointerUp = (upEvent) => {
            this.handleDragEnd(upEvent);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        pieceEl.style.opacity = '0.3';
        this.sourcePieceElement = pieceEl;
    }

    handleDragMove(e) {
        this.updateDragPosition(e);
        this.showPlacementPreview(e);
    }

    updateDragPosition(e) {
        if (!this.draggingElement) return;
        this.draggingElement.style.left = (e.clientX - this.dragOffset.x) + 'px';
        this.draggingElement.style.top = (e.clientY - this.dragOffset.y - 100) + 'px';
    }

    showPlacementPreview(e) {
        document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));

        const rect = this.draggingElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.draggingElement.style.display = 'none';
        const elementUnder = document.elementFromPoint(centerX, centerY);
        this.draggingElement.style.display = 'grid';

        const cell = elementUnder?.closest('.cell');

        if (cell) {
            const startRow = parseInt(cell.dataset.row);
            const startCol = parseInt(cell.dataset.col);

            if (this.canPlacePiece(this.draggingPiece, startRow, startCol)) {
                this.draggingPiece.shape.forEach((row, ri) => {
                    row.forEach((v, ci) => {
                        if (v === 1) {
                            const target = this.boardElement.querySelector(`[data-row="${startRow + ri}"][data-col="${startCol + ci}"]`);
                            if (target) target.classList.add('preview');
                        }
                    });
                });
            }
        }
    }

    handleDragEnd(e) {
        // Find center of current drag position
        const rect = this.draggingElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Hide temporarily to find what's underneath
        this.draggingElement.style.display = 'none';
        const elementUnder = document.elementFromPoint(centerX, centerY);
        this.draggingElement.style.display = 'grid';

        const cell = elementUnder?.closest('.cell');
        let placed = false;

        if (cell) {
            const startRow = parseInt(cell.dataset.row);
            const startCol = parseInt(cell.dataset.col);

            if (this.canPlacePiece(this.draggingPiece, startRow, startCol)) {
                this.placePiece(this.draggingPiece, startRow, startCol);

                // Get the slot index from the original source element
                const slotIndex = parseInt(this.sourcePieceElement.dataset.slotIndex);

                // Replace the used piece with a new one
                const randomIndex = Math.floor(Math.random() * SHAPES.length);
                this.availablePieces[slotIndex] = {
                    ...SHAPES[randomIndex],
                    id: Math.random().toString(36).substr(2, 9)
                };

                placed = true;
                this.renderPiecesTray();
            }
        }

        if (this.draggingElement) {
            this.draggingElement.remove();
            this.draggingElement = null;
        }

        if (!placed && this.sourcePieceElement) {
            this.sourcePieceElement.style.opacity = '1';
        }

        document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
    }

    getBoardCoordsUnderDrag(e) {
        const blockSize = document.querySelector('.cell').offsetWidth + 4;
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y - 100;

        const boardRect = this.boardElement.getBoundingClientRect();

        const relativeX = x - boardRect.left;
        const relativeY = y - boardRect.top;

        const col = Math.round(relativeX / blockSize);
        const row = Math.round(relativeY / blockSize);

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            return { row, col };
        }
        return null;
    }

    canPlacePiece(piece, startRow, startCol) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    const targetRow = startRow + r;
                    const targetCol = startCol + c;

                    if (targetRow >= BOARD_SIZE || targetCol >= BOARD_SIZE ||
                        targetRow < 0 || targetCol < 0 ||
                        this.board[targetRow][targetCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(piece, startRow, startCol) {
        let blocksPlaced = 0;
        piece.shape.forEach((row, ri) => {
            row.forEach((val, ci) => {
                if (val === 1) {
                    const r = startRow + ri;
                    const c = startCol + ci;
                    this.board[r][c] = piece.color;
                    blocksPlaced++;
                }
            });
        });

        this.currentScore += blocksPlaced * POINTS_PER_BLOCK;
        this.checkLines();
        this.createBoardUI();
        this.updateScoreUI();
    }

    checkLines() {
        let rowsToClear = [];
        let colsToClear = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            if (this.board[r].every(cell => cell !== null)) {
                rowsToClear.push(r);
            }
        }

        for (let c = 0; c < BOARD_SIZE; c++) {
            let fullColumn = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (this.board[r][c] === null) {
                    fullColumn = false;
                    break;
                }
            }
            if (fullColumn) colsToClear.push(c);
        }

        const linesCleared = rowsToClear.length + colsToClear.length;
        if (linesCleared > 0) {
            rowsToClear.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    cell.classList.add('clearing');
                    this.board[r][c] = null;
                }
            });
            colsToClear.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) {
                    const cell = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    cell.classList.add('clearing');
                    this.board[r][c] = null;
                }
            });

            const basePoints = linesCleared * POINTS_PER_LINE;
            const multiplier = linesCleared > 1 ? COMBO_MULTIPLIER : 1;
            this.currentScore += Math.floor(basePoints * multiplier);

            setTimeout(() => {
                this.createBoardUI();
                this.updateScoreUI();
                this.checkGameOver();
            }, 400);
        } else {
            this.checkGameOver();
        }
    }

    checkGameOver() {
        const canPlaceAny = this.availablePieces.some(piece => {
            if (!piece) return false;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (this.canPlacePiece(piece, r, c)) return true;
                }
            }
            return false;
        });

        const hasPiecesLeft = this.availablePieces.some(p => p !== null);

        if (!canPlaceAny && hasPiecesLeft) {
            this.handleGameOver();
        }
    }

    handleGameOver() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            localStorage.setItem('block-blaster-high-score', this.highScore);
        }

        this.finalScoreElement.innerText = this.currentScore;
        this.gameOverModal.classList.remove('hidden');
        this.updateScoreUI();
    }

    updateScoreUI() {
        this.scoreElement.innerText = this.currentScore.toString().padStart(4, '0');
        this.highScoreElement.innerText = this.highScore.toString().padStart(4, '0');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
