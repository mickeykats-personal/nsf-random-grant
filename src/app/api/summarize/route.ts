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
      systemPrompt = `You are a science communicator who explains publicly-funded research to taxpayers.
Your job is to clearly explain what this research accomplished and why it matters for America.
Be honest about what was achieved - don't oversell, but do explain the genuine value.
If you know of any major developments or applications that came from this type of research (even after the grant ended), mention them.
Keep responses informative but accessible - around 4-5 paragraphs.`;

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

      prompt = `Please summarize this NSF-funded research for American taxpayers who want to understand what their tax dollars accomplished.

**Grant Title:** ${title}

**Project Outcomes Report:**
${outcomes || "No outcomes report available yet."}

**Publications from this grant (with abstracts where available):**
${pubsText}

Please address the following:

1. **What did this research accomplish?** Summarize the key findings and discoveries in plain language.

2. **Why does this matter for America?** Explain the importance of this research for:
   - The U.S. economy (jobs, industries, competitiveness)
   - American health and well-being
   - National security or infrastructure
   - Scientific leadership and education
   - Any other relevant benefits to society

3. **What's the broader impact?** If you're aware of any major technological advances, medical breakthroughs, or economic benefits that came from this type of research (even developments that occurred after this specific grant ended), please mention them to help illustrate the long-term value of this kind of basic research.

Be honest and balanced - if the outcomes seem modest or the benefits are speculative, say so. But also help readers understand why even foundational research can be valuable.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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
