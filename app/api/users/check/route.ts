import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addMinutes } from "date-fns";




// check if a leased user is logging back in
export async function GET(){
    const cookieStore = cookies();
    const userIdCookie = (await cookieStore).get('user-id');

    if(!userIdCookie) {
        return NextResponse.json({valid:false})
    }
    
    const id = userIdCookie.value;

    const user = await prisma.user.findUnique({
        where: {
            id
        }
    });
    if(!user || user.leaseEnd < new Date()){
        const response = NextResponse.json({valid:false});
        response.cookies.delete('user-id');
        return response;
    }
    // Extend the users lease so they don't refresh and not have a login as expected
    user.leaseEnd = addMinutes(new Date(), Number(process.env.LEASE_TIME || 60));
    return NextResponse.json({valid:true, name:user.name, id:user.id})
}