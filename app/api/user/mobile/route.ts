import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { mobile } = await req.json();

    if (!mobile) {
        return new NextResponse("Mobile number is required", { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { mobile }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating mobile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
