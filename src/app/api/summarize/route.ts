import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, abstract, outcomes, publications } = body;

    let prompt = "";
    let systemPrompt = "";

    if (type === "grant") {
      systemPrompt = `You are a science communicator who explains complex research to educated lay audiences.
Your explanations are clear, engaging, and accurate. You avoid jargon and use analogies when helpful.
Keep responses concise but informative - around 2-3 paragraphs.`;

      prompt = `Please explain this NSF research grant in plain language for an educated person who isn't a specialist in this field.

**Grant Title:** ${title}

**Abstract:**
${abstract}

Explain:
1. What problem or question is this research addressing?
2. What approach are the researchers taking?
3. Why does this matter - what could be the broader impact?`;

    } else if (type === "outcomes") {
      systemPrompt = `You are a science communicator who summarizes research outcomes for the general public.
Be clear about what was actually accomplished and discovered. Be honest if outcomes seem limited.
Keep responses concise - around 3-4 paragraphs.`;

      // Format publications with their abstracts
      const pubsText = publications && publications.length > 0
        ? publications.map((p: { title: string; authors: string; journal: string; year: string; abstract?: string | null }, i: number) => {
            let pubEntry = `${i + 1}. "${p.title}"`;
            if (p.authors) pubEntry += `\n   Authors: ${p.authors}`;
            if (p.journal) pubEntry += `\n   Journal: ${p.journal}`;
            if (p.year) pubEntry += ` (${p.year})`;
            if (p.abstract) pubEntry += `\n   Abstract: ${p.abstract}`;
            return pubEntry;
          }).join("\n\n")
        : "No publications listed yet.";

      prompt = `Please summarize the outcomes and impact of this NSF research grant for an educated lay audience.

**Grant Title:** ${title}

**Project Outcomes Report:**
${outcomes || "No outcomes report available yet."}

**Publications from this grant (with abstracts where available):**
${pubsText}

Based on the project outcomes report and the publication abstracts above, please summarize:
1. What did this research actually accomplish? What were the key findings?
2. What new knowledge or discoveries came from it?
3. What is the significance and potential impact of this work?`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    return NextResponse.json({ summary: responseText });
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
