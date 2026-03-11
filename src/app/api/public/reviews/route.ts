import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Reviews data - migrated from website's reviews.js
// Future: could read from database
const reviews = [
  {
    author: "Robert Boyd",
    rating: 5,
    text: "On time, on budget and well done!",
    date: "2026-02-22",
    relative_time: "2 days ago",
  },
  {
    author: "Brett Hodess",
    rating: 5,
    text: "Mountain West came out to seal the concrete pavers on our walk and patio. Not only did they do a great job with that, but they were professional, responsive, and a pleasure to work with.",
    date: "2026-02-22",
    relative_time: "2 days ago",
  },
  {
    author: "Amy Mills",
    rating: 5,
    text: "Our driveway was resurfaced by Mountain West Surface. The job was well done, service was professional and efficient, and the product is holding up under heavy use and various weather conditions.",
    date: "2026-02-21",
    relative_time: "3 days ago",
  },
  {
    author: "Molly Jones",
    rating: 5,
    text: "Really great working with these guys. Fast, responsive.",
    date: "2025-08-01",
    relative_time: "6 months ago",
  },
  {
    author: "Jonathan Cheever",
    rating: 5,
    text: "Mountain West Surface is pro and very reliable. We'll definitely be working with them again.",
    date: "2025-07-01",
    relative_time: "7 months ago",
  },
  {
    author: "David Jantzen",
    rating: 5,
    text: "If you are looking for a company to clean or reseal your concrete, I highly recommend Everett to do the job. Professional service and excellent results.",
    date: "2025-06-24",
    relative_time: "8 months ago",
  },
  {
    author: "Susie",
    rating: 5,
    text: "What a fantastic job!!",
    date: "2025-06-24",
    relative_time: "8 months ago",
  },
  {
    author: "Ryan Midiri",
    rating: 5,
    text: "Great communication and professionalism. Easy to schedule and work with - excited to use them again.",
    date: "2025-06-24",
    relative_time: "8 months ago",
  },
  {
    author: "Jacobs Jeff",
    rating: 5,
    text: "Washed, sealed and left the place looking fresh. Super easy to work with. Used these guys for Commercial and then had them wash and seal our driveway at home.",
    date: "2025-06-24",
    relative_time: "8 months ago",
  },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    { reviews },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
