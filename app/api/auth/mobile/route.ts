import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_ID_IOS || "",
        process.env.GOOGLE_CLIENT_ID_ANDROID || "",
      ].filter(Boolean),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: picture,
          provider: "google",
          providerAccountId: googleId,
        },
      });
    } else {
      // Update user info if changed
      user = await prisma.user.update({
        where: { email },
        data: {
          name: name || user.name,
          image: picture || user.image,
        },
      });
    }

    // Create JWT token for mobile app
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        branch: user.branch,
        year: user.year,
      },
      token,
    });
  } catch (error) {
    console.error("Mobile auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
