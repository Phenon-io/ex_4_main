import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addMinutes } from "date-fns";

// for getting info on a room by its ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const game = await prisma.gameSession.findUnique({
        where: { id: params.id },
        select: {
            boardState: true,
            currentPlayerId: true,
            oddTurn: true,
            users: { select: { id: true } }
        }
    });

    if (!game) {
        return new Response(null, { status: 404 });
    }

    return Response.json({
        boardState: game.boardState,
        currentPlayerId: game.currentPlayerId,
        oddTurn: game.oddTurn
    });
}
// when lease is up or when no players are in a room, blow it up
export async function DELETE(){

}
// on user disconnect, change playercount
export async function PUT(){

}