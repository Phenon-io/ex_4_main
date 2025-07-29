import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";

// ===GET===
export async function GET( request: Request,
  { params }: { params: { gameSessionId: string } }) {
    
    const { gameSessionId } = params;

  if (!gameSessionId) {
    return NextResponse.json({ message: 'Missing game session ID' }, { status: 400 });
  }

  try {
    const gameSession = await prisma.gameSession.findUnique({
      where: { id: gameSessionId },
      select: {
        boardState: true,
        currentPlayerId: true,
        oddTurn: true,
      },
    });

    if (!gameSession) {
      return NextResponse.json({ message: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(gameSession);
  } catch (error) {
    console.error(`Failed to fetch game state for ${gameSessionId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch game state' }, { status: 500 });
  }
}

function getNextPlayerId(players: { id: string }[], currentPlayerId: string | null): string | null {
    if (!currentPlayerId || players.length < 2) return players[0]?.id || null;
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
}



// ===POST===
export async function POST( request: Request,
  { params }: { params: { gameSessionId: string } }) {
  
  const { gameSessionId } = params;

  try {
    const body = await request.json();
    const { userId, move } = body; 

    if (!userId || !move || move.squareIndex === undefined) {
      return NextResponse.json({ message: 'User ID and move data are required' }, { status: 400 });
    }

    const updatedGameSession = await prisma.$transaction(async (tx) => {
      const gameSession = await tx.gameSession.findUnique({
        where: { id: gameSessionId },
        include: { users: { select: { id: true } } },
      });

      if (!gameSession) throw new Error('Game not found');
      if (gameSession.currentPlayerId !== userId) throw new Error('Not your turn');

      const currentBoard = (gameSession.boardState as { [key: number]: string }) || {};
      const newBoardState = { ...currentBoard, [move.squareIndex]: move.value };
      const nextPlayerId = getNextPlayerId(gameSession.users, gameSession.currentPlayerId);

      // Save updates to the session
      return await tx.gameSession.update({
        where: { id: gameSessionId },
        data: {
          boardState: newBoardState,
          currentPlayerId: nextPlayerId,
          oddTurn: gameSession.oddTurn ? false : true
        },
        select: { boardState: true, currentPlayerId: true }
      });
    });

    return NextResponse.json(updatedGameSession);

  } catch (error: any) {
    console.error(`Failed to process move for ${gameSessionId}:`, error);
    if (error.message === 'Not your turn') {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error.message === 'Game not found') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to process move' }, { status: 500 });
  }
}