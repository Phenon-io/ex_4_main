export type Mark = 'X' | 'O';
// The board is represented as a 16-element array, mapping to a 4x4 grid.
export type BoardArray = (Mark | null)[];

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Columns
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12]
];

/**
 * Checks if a player has won the game on a 4x4 board.
 * A win is 4 marks in a row, column, or diagonal.
 * @param board The game board as a 16-element array.
 * @returns The mark of the winner ('X' or 'O'), or null if there is no winner.
 */
export function checkWinner(board: BoardArray): Mark | null {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c, d] = combination;
    const firstMark = board[a];

    if (
      firstMark &&
      firstMark === board[b] &&
      firstMark === board[c] &&
      firstMark === board[d]
    ) {
      return firstMark;
    }
  }
  return null;
}

/**
 * Checks if the board is full, which can indicate a draw if there is no winner.
 * @param board The game board as a 16-element array.
 * @returns True if the board is full, false otherwise.
 */
export function isBoardFull(board: BoardArray): boolean {
    return board.every(cell => cell !== null);
}

