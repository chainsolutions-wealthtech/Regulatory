import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "ALIVE",
      readyForSubmission: false,
    },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
