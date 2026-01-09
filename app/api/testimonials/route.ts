import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache testimonials in memory to reduce database calls
let cachedData: {
  testimonials: any[];
  stats: { averageRating: number; totalReviews: number };
  cachedAt: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Fallback data when database is unavailable
const FALLBACK_DATA = {
  testimonials: [],
  stats: { averageRating: 4.5, totalReviews: 0 },
};

// Force dynamic rendering - disable all caching
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Public endpoint - no auth required
// Returns all feedback/reviews for landing page and dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50); // Cap at 50, default 20

    // Return cached data if still valid
    if (cachedData && Date.now() - cachedData.cachedAt < CACHE_DURATION) {
      return NextResponse.json({
        testimonials: cachedData.testimonials.slice(0, limit),
        stats: cachedData.stats,
        cached: true,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300', // Allow browser caching
        }
      });
    }

    // Fetch testimonials and stats in parallel for better performance
    const [testimonials, stats] = await Promise.all([
      // Fetch approved/public feedback only with optimized select
      prisma.feedback.findMany({
        where: {
          OR: [
            { isPublic: true },
            { isApproved: true },
          ],
        },
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          rating: true,
          message: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              image: true,
              branch: true,
              year: true,
            },
          },
        },
      }),
      // Calculate stats only from public/approved reviews
      prisma.feedback.aggregate({
        where: {
          OR: [
            { isPublic: true },
            { isApproved: true },
          ],
        },
        _avg: {
          rating: true,
        },
        _count: true,
      }),
    ]);

    // Format testimonials with privacy (first name + last initial)
    const formattedTestimonials = testimonials.map((t) => ({
      id: t.id,
      rating: t.rating,
      message: t.message,
      createdAt: t.createdAt,
      user: {
        name: formatName(t.user?.name),
        image: t.user?.image,
        branch: t.user?.branch,
        year: t.user?.year,
      },
    }));

    const responseData = {
      testimonials: formattedTestimonials,
      stats: {
        averageRating: stats._avg?.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        totalReviews: stats._count ?? 0,
      },
    };

    // Update cache
    cachedData = {
      testimonials: formattedTestimonials,
      stats: responseData.stats,
      cachedAt: Date.now(),
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (error: any) {
    console.error("Error fetching testimonials:", error);
    
    // Handle Prisma Accelerate plan limit (P6003) or connection errors
    if (error?.code === 'P5000' || error?.code === 'P6003' || error?.message?.includes('planLimitReached')) {
      console.warn("Prisma Accelerate limit reached, returning cached/fallback data");
      
      // Return cached data if available
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          cached: true,
          warning: "Using cached data due to database limit",
        });
      }
      
      // Return fallback data if no cache
      return NextResponse.json({
        ...FALLBACK_DATA,
        warning: "Database temporarily unavailable",
      });
    }
    
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
