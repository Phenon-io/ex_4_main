'use client';

import { useState, useEffect, useCallback } from 'react';

// Polling to determine board state
const useGameStatePolling = (gameSessionId: string) => {
    const [boardState, setBoardState] = useState<any>({});
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [oddTurn, setOddTurn] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Polling function
    const fetchGameState = useCallback(async () => {
        try {
        const response = await fetch(`/api/game/${gameSessionId}/state`);
        if (!response.ok) {
            // Logs if the poll fails but shouldn't throw
            console.error('Failed to fetch game state, status:', response.status);
            return;
        }
        const data = await response.json();
        setBoardState(data.boardState);
        setCurrentPlayerId(data.currentPlayerId);
        setOddTurn(data.oddTurn);
        setError(null);
        } catch (err: any) {
        setError('Connection issue. Retrying...');
        console.error(err);
        }
    }, [gameSessionId]);

    useEffect(() => {
        fetchGameState();
        const intervalId = setInterval(fetchGameState, 250); // Poll every 250ms
        return () => clearInterval(intervalId);
    }, [fetchGameState]);

    return { boardState, currentPlayerId, oddTurn, error };
    };

    // Calls the state api to push a move to the gamesession board
    const makeMove = async (gameSessionId: string, userId: string, moveData: any) => {
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



export default function GameBoard({ gameSessionId }: { gameSessionId: string }) {
    const { boardState, currentPlayerId, oddTurn, error: pollingError } = useGameStatePolling(gameSessionId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [moveError, setMoveError] = useState<string | null>(null);
    const myUserId = 'current-user-id'; // TODO: Replace with actual user ID from session/auth


    const handleClick = async (squareIndex: number) => {
        if (currentPlayerId !== myUserId || isSubmitting || boardState?.[squareIndex]) {
        return;
    }

        setIsSubmitting(true);
        setMoveError(null);

        try {
            const mark = oddTurn ? 'X' : 'O';
            const moveData = { squareIndex, mark }; // Assuming player is 'X'
            await makeMove(gameSessionId, myUserId, moveData);
        } catch (err: any) {
        setMoveError(err.message);
        } finally {
        setIsSubmitting(false);
        }
    };

    // Create a 4x4 board array from the boardState object
    const board = Array.from({ length: 16 }, (_, i) => boardState?.[i] || null);
    return (
        <div>
        <h1>Game Board (Game ID: {gameSessionId})</h1>
        <p>Current Turn: {currentPlayerId === myUserId ? 'Your Turn' : `Player ${currentPlayerId || '...'}'s Turn`}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 50px)', gap: '5px' }}>
            {board.map((cell, index) => (
            <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={isSubmitting || !!cell || currentPlayerId !== myUserId}
                style={{ width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer' }}
            >
                {cell}
            </button>
            ))}
        </div>

        {pollingError && <p style={{ color: 'red' }}>Connection Error: {pollingError}</p>}
        {moveError && <p style={{ color: 'red' }}>Move Error: {moveError}</p>}
        </div>
    );
}