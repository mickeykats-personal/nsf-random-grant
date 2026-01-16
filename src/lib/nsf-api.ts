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
export async function getRandomGrant(): Promise<NSFAward | null> {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = generateRandomAwardId();
    const award = await fetchAwardById(randomId);

    if (award && award.abstractText && award.abstractText.length > 100) {
      return award;
    }
  }

  // Fallback: use offset-based random selection from a broad search
  return await getRandomGrantByOffset();
}

// Alternative method: get random grant using random offset
async function getRandomGrantByOffset(): Promise<NSFAward | null> {
  try {
    // First get total count from a broad search (active grants)
    const countUrl = `${NSF_API_BASE}/awards.json?rpp=1`;
    const countResponse = await fetch(countUrl, { next: { revalidate: 0 } });

    if (!countResponse.ok) {
      throw new Error("Failed to get count");
    }

    const countData: NSFApiResponse = await countResponse.json();
    const totalCount = Math.min(countData.response.metadata.totalCount, 3000); // API limit

    // Generate random offset using crypto
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomValue = randomBuffer[0] / (0xffffffff + 1);
    const randomOffset = Math.floor(randomValue * (totalCount - 1));

    // Fetch the grant at that offset
    const url = `${NSF_API_BASE}/awards.json?rpp=1&offset=${randomOffset}&printFields=${PRINT_FIELDS}`;
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
export function parsePublications(publicationStrings: string[]): Publication[] {
  return publicationStrings.map(pub => {
    // Format: "Journal~Year~Volume~Authors~DOI~Title~..."
    // or "Year~Authors~DOI~Title~..."
    const parts = pub.split("~");

    // Try to extract meaningful parts
    let year = "";
    let authors = "";
    let title = "";
    let doi = "";
    let journal = "";

    // Look for year (4 digits)
    for (let i = 0; i < Math.min(parts.length, 3); i++) {
      if (/^\d{4}$/.test(parts[i].trim())) {
        year = parts[i].trim();
        break;
      }
    }

    // Look for DOI
    for (const part of parts) {
      if (part.includes("doi.org") || part.startsWith("10.")) {
        doi = part.includes("http") ? part : `https://doi.org/${part}`;
        break;
      }
    }

    // Find title (usually longer text without special chars at start)
    for (const part of parts) {
      if (
        part.length > 30 &&
        !part.includes("@") &&
        !part.includes("doi.org") &&
        !part.startsWith("10.") &&
        !/^\d+$/.test(part.trim())
      ) {
        title = part.trim();
        break;
      }
    }

    // Find authors (contains "and" or multiple names)
    for (const part of parts) {
      if (
        (part.includes(" and ") || part.includes(",")) &&
        !part.includes("doi") &&
        part.length < 500 &&
        part.length > 5
      ) {
        // Check if it looks like names
        if (/[A-Z][a-z]+/.test(part)) {
          authors = part.trim();
          break;
        }
      }
    }

    // Journal is often the first part
    if (parts[0] && !parts[0].match(/^\d{4}$/) && parts[0].length > 3) {
      journal = parts[0].trim();
    }

    return { year, authors, title, doi, journal };
  }).filter(pub => pub.title || pub.authors);
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
