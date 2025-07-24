'use client'
import GameBoard from "@/app/components/GameBoard";
import { useState, useEffect } from "react";

interface Game{
    id: string;
    userId: string;
}

interface Room{
    game: Game
    userId: string;
}

export default function GamePage() {
    const [gameSession, setGameSession] = useState<Game | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getARoom = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/game/room', {
                    method: 'POST',
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to create or join a room.' }));
                    throw new Error(errorData.message || `Error: ${response.statusText}`);
                }

                const data: Room = await response.json();

                if (data.game && data.userId) {
                    setGameSession(data.game);
                    setUserId(data.userId);
                } else {
                    throw new Error('Invalid data received from server.');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        getARoom();
    }, []); // Empty, Forces this to run once

    if (isLoading) {
        return <div>Finding a game...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (gameSession && userId) {
        // Note: The API returns { game, userId }, so we use gameSession.id
        return <GameBoard gameSessionId={gameSession.id} userId={userId} />;
    }

    // Fallback case, though it shouldn't be reached with the logic above
    return <div>Something went wrong. Please try refreshing the page.</div>;
}