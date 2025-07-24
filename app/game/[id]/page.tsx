'use client'
import GameBoard from "@/app/components/GameBoard";
import prisma from "@/prisma/prisma";
import { cookies } from "next/headers";

function checkForGames(){
    const games = prisma.gameSession.findFirst();
    if(!games) return false;
    return true;
}
async function identify(){
    var userId:string;
    const response = await fetch('/api/users/check');
    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        return null;
    }  
}


export default function Game(){
    const user = identify();
    if(process.env.GAME_BROWSER === "false"){
        if(checkForGames()) continue;
        else{
            const game = prisma.gameSession.create({
                data:{
                    users: user,

            }})
        }
    }
    
    

    return(
        <div>

        </div>
    );
}