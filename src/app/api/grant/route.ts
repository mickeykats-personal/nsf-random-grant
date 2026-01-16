import { NextRequest, NextResponse } from "next/server";
import { getRandomGrant, parsePublications, stripHtml } from "@/lib/nsf-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const minAmount = request.nextUrl.searchParams.get("minAmount");
    const grant = await getRandomGrant(minAmount ? parseInt(minAmount, 10) : undefined);

    if (!grant) {
      return NextResponse.json(
        { error: "Failed to fetch a random grant" },
        { status: 500 }
      );
    }

    // Parse publications if available
    const publications = grant.publicationResearch
      ? parsePublications(grant.publicationResearch)
      : [];

    // Clean up the outcomes report if available
    const cleanOutcomes = grant.projectOutComesReport
      ? stripHtml(grant.projectOutComesReport)
      : null;

    return NextResponse.json({
      grant: {
        ...grant,
        projectOutComesReport: cleanOutcomes,
      },
      publications,
    });
  } catch (error) {
    console.error("Error fetching grant:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant" },
      { status: 500 }
    );
  }
}
