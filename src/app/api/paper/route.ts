import { NextRequest, NextResponse } from "next/server";

interface CrossRefResponse {
  status: string;
  message: {
    title?: string[];
    abstract?: string;
    author?: Array<{ given?: string; family?: string }>;
    "container-title"?: string[];
    published?: { "date-parts"?: number[][] };
    URL?: string;
  };
}

export async function GET(request: NextRequest) {
  const doi = request.nextUrl.searchParams.get("doi");

  if (!doi) {
    return NextResponse.json({ error: "DOI is required" }, { status: 400 });
  }

  // Extract just the DOI identifier (remove https://doi.org/ if present)
  const doiId = doi.replace(/^https?:\/\/doi\.org\//, "");

  try {
    const response = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doiId)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "NSFGrantExplorer/1.0 (mailto:contact@example.com)",
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Paper not found", abstract: null },
        { status: 404 }
      );
    }

    const data: CrossRefResponse = await response.json();
    const message = data.message;

    // Clean up abstract - remove JATS XML tags if present
    let abstract = message.abstract || null;
    if (abstract) {
      abstract = abstract
        .replace(/<\/?jats:[^>]+>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    return NextResponse.json({
      title: message.title?.[0] || null,
      abstract,
      authors: message.author
        ?.map((a) => `${a.given || ""} ${a.family || ""}`.trim())
        .filter(Boolean)
        .join(", "),
      journal: message["container-title"]?.[0] || null,
      year: message.published?.["date-parts"]?.[0]?.[0] || null,
      url: message.URL || null,
    });
  } catch (error) {
    console.error("Error fetching paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper", abstract: null },
      { status: 500 }
    );
  }
}
