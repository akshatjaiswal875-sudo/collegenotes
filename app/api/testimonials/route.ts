import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// Public endpoint - no auth required
// Returns all feedback/reviews for landing page and dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Fetch all feedback - no approval needed
    const testimonials = await prisma.feedback.findMany({
      take: limit,
      orderBy: [
        { createdAt: "desc" },
      ],
      include: {
        user: {
          select: {
            name: true,
            image: true,
            branch: true,
            year: true,
          },
        },
      },
    });

    // Calculate average rating and total count from all reviews
    const stats = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
      _count: true,
    });

    // Format testimonials with privacy (first name + last initial)
    const formattedTestimonials = testimonials.map((t) => ({
      id: t.id,
      rating: t.rating,
      message: t.message,
      createdAt: t.createdAt,
      user: {
        name: formatName(t.user.name),
        image: t.user.image,
        branch: t.user.branch,
        year: t.user.year,
      },
    }));

    return NextResponse.json({
      testimonials: formattedTestimonials,
      stats: {
        averageRating: stats._avg?.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        totalReviews: stats._count ?? 0,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Format name to "FirstName L." for privacy
function formatName(name: string | null): string {
  if (!name) return "Student";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
