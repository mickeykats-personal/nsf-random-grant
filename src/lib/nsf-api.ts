import { NSFAward, NSFApiResponse, Publication } from "@/types/nsf";

const NSF_API_BASE = "https://www.research.gov/awardapi-service/v1";

const PRINT_FIELDS = [
  "id",
  "title",
  "abstractText",
  "estimatedTotalAmt",
  "fundsObligatedAmt",
  "awardeeName",
  "awardeeCity",
  "awardeeStateCode",
  "pdPIName",
  "piEmail",
  "startDate",
  "expDate",
  "date",
  "transType",
  "program",
  "dirAbbr",
  "divAbbr",
  "orgLongName",
  "orgLongName2",
  "projectOutComesReport",
  "publicationResearch",
  "activeAwd",
].join(",");

// Generate a truly random award ID to try
// NSF award IDs are typically 7 digits, ranging from about 0700000 to 2600000+
// covering fiscal years from ~2007 to present
function generateRandomAwardId(): string {
  // NSF awards from 2007-2025 roughly span IDs from 0700000 to 2600000
  // We'll generate random numbers in this range
  const minId = 700000;
  const maxId = 2600000;

  // Use crypto for true randomness
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const randomValue = randomBuffer[0] / (0xffffffff + 1);

  const randomId = Math.floor(randomValue * (maxId - minId + 1)) + minId;
  return randomId.toString();
}

// Try to fetch a specific award by ID
async function fetchAwardById(id: string): Promise<NSFAward | null> {
  try {
    const url = `${NSF_API_BASE}/awards.json?id=${id}&printFields=${PRINT_FIELDS}`;
    const response = await fetch(url, {
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return null;
    }

    const data: NSFApiResponse = await response.json();

    if (data.response?.award?.length > 0) {
      return data.response.award[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Get a truly random grant by trying random IDs
export async function getRandomGrant(
  minAmount?: number,
  status: "active" | "completed" = "completed"
): Promise<NSFAward | null> {
  // If there's a minimum amount filter or status filter, use the offset method which supports filtering
  if ((minAmount && minAmount > 0) || status === "active") {
    return await getRandomGrantByOffset(minAmount, status);
  }

  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = generateRandomAwardId();
    const award = await fetchAwardById(randomId);

    if (award && award.abstractText && award.abstractText.length > 100) {
      return award;
    }
  }

  // Fallback: use offset-based random selection from a broad search
  return await getRandomGrantByOffset(minAmount, status);
}

// Alternative method: get random grant using random offset
async function getRandomGrantByOffset(
  minAmount?: number,
  status: "active" | "completed" = "completed"
): Promise<NSFAward | null> {
  try {
    // Build the filter query
    const amountFilter = minAmount ? `&estimatedTotalAmtFrom=${minAmount}` : "";
    const statusFilter = status === "active" ? "&activeAwards=true" : "&expiredAwards=true";

    // First get total count from a broad search
    const countUrl = `${NSF_API_BASE}/awards.json?rpp=1${amountFilter}${statusFilter}`;
    const countResponse = await fetch(countUrl, { next: { revalidate: 0 } });

    if (!countResponse.ok) {
      throw new Error("Failed to get count");
    }

    const countData: NSFApiResponse = await countResponse.json();
    const totalCount = Math.min(countData.response.metadata.totalCount, 3000); // API limit

    if (totalCount === 0) {
      return null;
    }

    // Generate random offset using crypto
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomValue = randomBuffer[0] / (0xffffffff + 1);
    const randomOffset = Math.floor(randomValue * (totalCount - 1));

    // Fetch the grant at that offset
    const url = `${NSF_API_BASE}/awards.json?rpp=1&offset=${randomOffset}${amountFilter}${statusFilter}&printFields=${PRINT_FIELDS}`;
    const response = await fetch(url, { next: { revalidate: 0 } });

    if (!response.ok) {
      throw new Error("Failed to fetch grant");
    }

    const data: NSFApiResponse = await response.json();

    if (data.response?.award?.length > 0) {
      return data.response.award[0];
    }

    return null;
  } catch {
    return null;
  }
}

// Parse publication strings into structured data
// NSF format varies but is typically one of:
// "Year~Authors~DOI~Title~..." or "Journal~Year~Authors~Title~..."
export function parsePublications(publicationStrings: string[]): Publication[] {
  return publicationStrings.map(pub => {
    const parts = pub.split("~");

    let year = "";
    let authors = "";
    let title = "";
    let doi = "";
    let journal = "";

    // Find DOI first (most reliable identifier)
    let doiIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.includes("doi.org") || part.match(/^10\.\d+\//)) {
        doi = part.includes("http") ? part : `https://doi.org/${part}`;
        doiIndex = i;
        break;
      }
    }

    // Find year (4 digits, typically in first 3 positions)
    let yearIndex = -1;
    for (let i = 0; i < Math.min(parts.length, 4); i++) {
      if (/^\d{4}$/.test(parts[i].trim())) {
        year = parts[i].trim();
        yearIndex = i;
        break;
      }
    }

    // Determine format based on first part
    const firstPart = parts[0]?.trim() || "";
    const isYearFirst = /^\d{4}$/.test(firstPart);

    if (isYearFirst) {
      // Format: Year~Authors~DOI?~Title~...
      year = firstPart;
      if (parts[1]) {
        authors = parts[1].trim();
      }
      // Title is after DOI if present, otherwise position 2 or 3
      if (doiIndex >= 0 && parts[doiIndex + 1]) {
        title = parts[doiIndex + 1].trim();
      } else if (parts[3]) {
        title = parts[3].trim();
      } else if (parts[2] && !parts[2].includes("doi")) {
        title = parts[2].trim();
      }
    } else {
      // Format: Journal~Year~Authors?~Title~... or Journal~Year~Volume~Authors~DOI~Title
      journal = firstPart;
      if (yearIndex >= 0 && parts[yearIndex + 1]) {
        // Check if next part after year looks like a volume number
        const afterYear = parts[yearIndex + 1]?.trim() || "";
        if (/^\d+$/.test(afterYear) && parts[yearIndex + 2]) {
          // Has volume number
          authors = parts[yearIndex + 2].trim();
          // Find title - look for longer text that's not a number or DOI
          for (let i = yearIndex + 3; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p.length > 15 && !p.includes("doi.org") && !p.match(/^10\.\d+\//) && !/^\d+$/.test(p) && !p.includes("OSTI")) {
              title = p;
              break;
            }
          }
        } else {
          authors = afterYear;
          // Title after authors
          for (let i = yearIndex + 2; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p.length > 15 && !p.includes("doi.org") && !p.match(/^10\.\d+\//) && !/^\d+$/.test(p) && !p.includes("OSTI")) {
              title = p;
              break;
            }
          }
        }
      }
    }

    // Clean up: if title looks like authors (has " and " but is short), swap
    if (title && title.length < 80 && title.includes(" and ") && /^[A-Z][a-z]+/.test(title)) {
      // Might have swapped - check if authors looks more like a title
      if (authors && authors.length > 50 && !authors.includes(" and ")) {
        [title, authors] = [authors, title];
      }
    }

    // Filter out bad titles (IDs, dates, "OSTI", "N", single letters)
    if (title && (
      /^\d+$/.test(title) ||
      title === "N" ||
      title === "OSTI" ||
      title.length < 10 ||
      title.match(/^\d{4}-\d{2}-\d{2}/)
    )) {
      title = "";
    }

    // Clean authors - remove trailing email-like patterns
    if (authors) {
      authors = authors.replace(/\s+\S+@\S+/g, "").trim();
    }

    return { year, authors, title, doi, journal };
  }).filter(pub => pub.title && pub.title.length > 10);
}

// Strip HTML tags from outcome report
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
