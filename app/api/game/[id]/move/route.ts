import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { ErrorEvent } from "ws";

function getNextPlayerId(players: { id: string }[], currentPlayerId: string | null): string | null {
  if (!currentPlayerId || players.length < 2) return players[0]?.id || null;
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

export async function POST(request: Request) {
    
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    // Expected /api/game/[id]/move
    const gameSessionId = segments[3];
    
    if (!gameSessionId) {
      return NextResponse.json({ message: "Missing game session ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, move } = body;

    if (!userId || !move || move.squareIndex === undefined || !move.mark) {
      return NextResponse.json({ message: "User ID and valid move data are required" }, { status: 400 });
    }

    const updatedGameSession = await prisma.$transaction(async (tx) => {
      const gameSession = await tx.gameSession.findUnique({
        where: { id: gameSessionId },
        include: { users: { select: { id: true } } },
      });
      
      if (!gameSession) throw new Error("Game not found");
      if (gameSession.currentPlayerId === userId) throw new Error("Not your turn");

      const currentBoard = (gameSession.boardState as { [key: number]: string }) || {};
      if (currentBoard[move.squareIndex]) {
        throw new Error("Square already occupied");
      }

      const newBoardState = { ...currentBoard, [move.squareIndex]: move.mark };
      console.log(newBoardState);
      const nextPlayerId = getNextPlayerId(gameSession.users, gameSession.currentPlayerId);

      return await tx.gameSession.update({
        where: { id: gameSessionId },
        data: {
          boardState: newBoardState,
          currentPlayerId: nextPlayerId,
          oddTurn: gameSession.oddTurn ? false : true,
        },
        select: { boardState: true, currentPlayerId: true, oddTurn: true },
      });
    });

    return NextResponse.json(updatedGameSession);

  } catch (error:unknown) {
    console.error(`Failed to process move for game:`, error);
    let message = "Failed to process move";
    if (error instanceof Error) {
        message = error.message;
    }
    if (message === "Not your turn") {
      return NextResponse.json({ message: message }, { status: 403 });
    }
    if (message === "Game not found") {
      return NextResponse.json({ message: message }, { status: 404 });
    }
    if (message === "Square already occupied") {
      return NextResponse.json({ message: message }, { status: 409 });
    }

    return NextResponse.json({ message: "Failed to process move" }, { status: 500 });
  }
}
