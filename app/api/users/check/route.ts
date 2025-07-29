import prisma from "@/prisma/prisma";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addMinutes } from "date-fns";
import { AUTH_COOKIE_NAME } from "@/app/lib/constants"


// check if a leased user is logging back in
export async function GET(){
    const cookieStore = cookies();
    const userIdCookie = (await cookieStore).get(AUTH_COOKIE_NAME);

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
        // Ensure the cookie is cleared if the user is invalid
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
    }
    // Extend the users lease so they don't refresh and not have a login as expected
    const newLeaseEnd = addMinutes(new Date(), Number(process.env.LEASE_TIME || 60));
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { leaseEnd: newLeaseEnd },
    });

    const response = NextResponse.json({valid:true, name:updatedUser.name, id:updatedUser.id});
    // Also update the cookie with the new lease time
    response.cookies.set(AUTH_COOKIE_NAME, updatedUser.id, { expires: newLeaseEnd, httpOnly: true, path: '/' });
    return response;
}