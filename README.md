# Random NSF Grant Explorer

A web application that displays random NSF (National Science Foundation) research grants with AI-powered explanations.

## Features

- **Random Grant Discovery**: Uses cryptographic random number generation to select truly random NSF grants from a pool of over 1.9 million awards (2007-present)
- **Grant Details**: Displays title, abstract, award amount, institution, principal investigator, and dates
- **AI Explanations**: Uses Claude Opus 4.5 to explain complex research in plain language for educated lay audiences
- **Research Outcomes**: Shows project outcomes reports and publications resulting from the research
- **AI Outcome Summaries**: Summarizes research results and their significance

## How Random Selection Works

The app uses two strategies for true randomness:

1. **Random Award ID**: Generates cryptographically random numbers using `crypto.getRandomValues()` to select random award IDs in the valid NSF range (0700000-2600000)
2. **Random Offset Fallback**: If direct ID lookup fails, uses random offset pagination on the NSF API

This ensures grants are selected with uniform probability, not biased by popularity or recency.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude Opus 4.5
- **Data Source**: [NSF Award Search API](https://www.research.gov/common/webapi/awardapisearch-v1.htm)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /api/grant` - Fetches a random NSF grant with publications
- `POST /api/summarize` - Generates AI summaries for grants and outcomes

## Data Sources

- [NSF Award Search API](https://www.research.gov/common/webapi/awardapisearch-v1.htm) - Official NSF awards database
- [NSF Developer Resources](https://www.nsf.gov/digital/developer) - API documentation
