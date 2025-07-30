'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import LogoutButton from './LogoutButton';
import { checkWinner, isBoardFull, type BoardArray, type Mark } from '@/app/utils/gameLogic';
import type { CSSProperties } from 'react';
import type { Move } from '../types/Move';

interface Props {
    gameSessionId: string;
    userId: string;
}

type BoardState = {
  [key: number]: Mark;
};

// Custom hook for polling the game state from the server.
const useGameStatePolling = (gameSessionId: string) => {
    const [boardState, setBoardState] = useState<BoardState>({});
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [oddTurn, setOddTurn] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true);

    // Function to fetch the latest game state.
    const fetchGameState = useCallback(async () => {
        try {
            const response = await fetch(`/api/game/${gameSessionId}/state`);
            if (!response.ok) {
                // Logs if the poll fails but shouldn't throw.
                console.error('Failed to fetch game state, status:', response.status);
                // If the game session is gone (e.g., opponent left and it was cleaned up), stop polling.
                if (response.status === 404) {
                    setError("Game session not found. The other player may have left.");
                    setIsPolling(false);
                }
                else console.log(response);
                return;
            }
            const data = await response.json();
            setBoardState(data.boardState);
            setCurrentPlayerId(data.currentPlayerId);
            setOddTurn(data.oddTurn);
            setError(null);
        } catch (err: unknown) {
            let message = 'Failed to fetch game state';
            if (err instanceof Error) {
                message = err.message;
            }
            setError('Connection issue. Retrying...');
            console.error(message);
        }
    }, [gameSessionId]);

    useEffect(() => {
        if (!isPolling) return;

        fetchGameState();
        const intervalId = setInterval(fetchGameState, 500); // Poll every 250ms
        return () => clearInterval(intervalId);
    }, [fetchGameState, isPolling]);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    return { boardState, currentPlayerId, oddTurn, error, stopPolling };
};

// API call to submit a move to the server.
const makeMove = async (gameSessionId: string, userId: string, moveData: Move) => {
    const response = await fetch(`/api/game/${gameSessionId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, move: moveData }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to make move');
    }
};

export default function GameBoard(props: Props) {
    const { gameSessionId, userId: myUserId } = props;
    const { boardState, currentPlayerId, oddTurn, error: pollingError, stopPolling } = useGameStatePolling(gameSessionId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [moveError, setMoveError] = useState<string | null>(null);

    // Memo-ize board array creation and game status checks to avoid re-calculation on every render.
    const board: BoardArray = useMemo(() => Array.from({ length: 16 }, (_, i) => boardState?.[i] || null), [boardState]);
    const winner = useMemo(() => checkWinner(board), [board]);
    const isDraw = useMemo(() => isBoardFull(board) && !winner, [board, winner]);
    const isGameOver = !!winner || isDraw;

    // Stop polling once the game is over.
    useEffect(() => {
        if (isGameOver) {
            stopPolling();
        }
    }, [isGameOver, stopPolling]);

    const handleClick = async (squareIndex: number) => {
        if (isGameOver || currentPlayerId === myUserId || isSubmitting || boardState?.[squareIndex]) {
            return;
        }
        setIsSubmitting(true);
        setMoveError(null);

        try {
            const mark = oddTurn ? 'X' : 'O';
            const moveData:Move = { squareIndex, mark };
            await makeMove(gameSessionId, myUserId, moveData);
        } catch (err: unknown) {
            let message = 'Failed to make move';
            if (err instanceof Error) {
                message = err.message;
            }
            setMoveError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determine the status message to display.
    let statusMessage;
    if (winner) {
        statusMessage = winner === (oddTurn ? 'O' : 'X') ? 'You Win!' : 'You Lose!';
    } else if (isDraw) {
        statusMessage = "It's a Draw!";
    } else if (currentPlayerId) {
        statusMessage = currentPlayerId !== myUserId ? 'Your Turn' : `Opponent's Turn`;
        console.log("Player's turn")
    } else {
        statusMessage = 'Waiting for opponent...';
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>4-in-a-Row</h1>
            <p style={styles.status}>{statusMessage}</p>

            <div style={styles.board}>
                {board.map((cell: Mark | null, index: number) => {
                    const cellStyle = {
                        ...styles.cell,
                        ...(cell === 'X' ? styles.cellX : {}),
                        ...(cell === 'O' ? styles.cellO : {}),
                    };
                    return (
                        <button
                            key={index}
                            onClick={() => handleClick(index)}
                            disabled={isSubmitting || !!cell || currentPlayerId === myUserId || isGameOver}
                            style={cellStyle}
                        >
                            {cell}
                        </button>
                    );
                })}
                {isGameOver && (
                    <div style={styles.gameOverOverlay}>
                        <p style={styles.gameOverText}>{statusMessage}</p>
                    </div>
                )}
            </div>

            <div style={styles.footer}>
                <LogoutButton />
                {pollingError && <p style={styles.errorText}>Connection Error: {pollingError}</p>}
                {moveError && <p style={styles.errorText}>Move Error: {moveError}</p>}
            </div>
        </div>
    );
}

// CSS-in-JS for styling the component.
const styles: { [key: string]: CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#2c3e50', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '40px auto', color: 'white' },
    title: { color: '#ecf0f1', marginBottom: '10px' },
    status: { fontSize: '1.2em', fontWeight: 'bold', marginBottom: '20px', minHeight: '25px', color: '#bdc3c7' },
    board: { display: 'grid', gridTemplateColumns: 'repeat(4, 70px)', gap: '8px', backgroundColor: '#34495e', padding: '10px', borderRadius: '8px', position: 'relative' },
    cell: { width: '70px', height: '70px', fontSize: '36px', fontWeight: 'bold', border: 'none', borderRadius: '5px', backgroundColor: '#95a5a6', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    cellX: { color: '#e74c3c' },
    cellO: { color: '#3498db' },
    gameOverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', textAlign: 'center' },
    gameOverText: { fontSize: '2.5em', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' },
    footer: { marginTop: '20px', textAlign: 'center' },
    errorText: { color: '#e74c3c', marginTop: '10px' },
};