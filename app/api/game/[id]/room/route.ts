import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { error } from "console";

export async function POST(){
    var userId:string = "";
    try{
        const res = await fetch('/api/users/check',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if(res.ok){
            const data = await res.json();
            userId = data.id;
        }
        else{
            console.error("User check failed")
        }

    } catch(err){
        console.log(err);
        return NextResponse.json({message: 'User room generation failure'}, {status: 500})
    }
    if(process.env.GAME_BROWSER !== "true"){
        const game = prisma.gameSession.findFirst()
        const updatedRoom = await prisma.gameSession.update
    }
    else{
        console.log("I haven't implemented the game browser so you really shouldn't be seeing this.")
    }

}




// This route will check for a game and create one if it doesn't exist,
// based on the server environment configuration.
export async function POST() {
    // 1. Authenticate user via cookie
    const cookieStore = cookies();
    const userIdCookie = cookieStore.get('user-id');

    if (!userIdCookie?.value) {
        return NextResponse.json({ message: 'Unauthorized: No user session found.' }, { status: 401 });
    }
    const userId = userIdCookie.value;

    // Verify user exists and lease is valid
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.leaseEnd < new Date()) {
        return NextResponse.json({ message: 'Unauthorized: Invalid user session.' }, { status: 401 });
    }

    // 2. Check server environment variable from original code
    if (process.env.GAME_BROWSER !== "false") {
        return NextResponse.json({ message: 'Game creation is disabled on this server.' }, {status: 403});
    }

    try {
        // 3. Check if a game session already exists
        const existingGame = await prisma.gameSession.findFirst();

        if (existingGame) {
            // Game exists, you could add logic here to connect the user if not already connected
            return NextResponse.json({
                message: 'Game session already exists.',
                game: existingGame,
            });
        } else {
            // 4. Create a new game session and connect the user
            const newGame = await prisma.gameSession.create({
                data: {
                    users: { connect: { id: userId } },
                },
            });
            return NextResponse.json({ message: 'New game session created.', game: newGame }, { status: 201 });
        }
    } catch (error) {
        console.error('Failed to manage game session:', error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

