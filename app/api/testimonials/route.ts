import { NextResponse } from "next/server";

// Force dynamic rendering - disable all caching
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Public endpoint - testimonials disabled (feedback removed)
export async function GET() {
  return NextResponse.json(
    {
      testimonials: [],
      stats: {
        averageRating: 0,
        totalReviews: 0,
      },
      disabled: true,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
