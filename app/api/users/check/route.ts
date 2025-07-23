import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";


// check if a leased user is logging back in
export async function GET(req: Request){
    const id = new URL(req.url).searchParams.get('id');
    if(!id) return NextResponse.json({valid:false})
    
    const user = await prisma.user.findUnique({
        where: {
            id
        }
    });
    if(!user || user.leaseEnd < new Date()){
        return NextResponse.json({valid:false})

    }
    return NextResponse.json({valid:true, name:user.name})
}