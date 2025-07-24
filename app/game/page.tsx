import GameBoard from "@/app/components/GameBoard";

async function createRoom(){
    try{
        const res = await fetch('/api/game/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if(!res.ok){
            throw new Error(`Failed to create room: ${res.status}`);
        }
        else{
            const data = await res.json();
            return data;
        }
    }catch(err){
        console.error(err);
    }
}

export default async function Game(){
    const room = await createRoom();
    return(
        <div>
            <GameBoard gameSessionId={room.id} userId={room.userId}/>
        </div>
    );
}