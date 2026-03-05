export const BOARD_SIZE = 8;
export const COMBO_MULTIPLIER = 1.5;
export const POINTS_PER_BLOCK = 1;
export const POINTS_PER_LINE = 10;

export const SHAPES = [
    // 1x1
    { shape: [[1]], color: 'var(--color-1)' },
    // 1x2 Vertical
    { shape: [[1], [1]], color: 'var(--color-2)' },
    // 1x2 Horizontal
    { shape: [[1, 1]], color: 'var(--color-2)' },
    // 1x3 Vertical
    { shape: [[1], [1], [1]], color: 'var(--color-3)' },
    // 1x3 Horizontal
    { shape: [[1, 1, 1]], color: 'var(--color-3)' },
    // 1x4 Vertical
    { shape: [[1], [1], [1], [1]], color: 'var(--color-4)' },
    // 1x4 Horizontal
    { shape: [[1, 1, 1, 1]], color: 'var(--color-4)' },
    // 2x2 Square
    { shape: [[1, 1], [1, 1]], color: 'var(--color-5)' },
    // 3x3 Square (rare)
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'var(--color-6)' },
    // L-shape
    { shape: [[1, 0], [1, 0], [1, 1]], color: 'var(--color-7)' },
    // L-shape mirrored
    { shape: [[0, 1], [0, 1], [1, 1]], color: 'var(--color-7)' },
    // T-shape
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'var(--color-1)' },
    // Z-shape
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'var(--color-2)' }
];
