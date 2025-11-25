import { ExecutionEnviornment } from "@/lib/types";
import { GenerateDocumentTask } from "../task/GenerateDocument";
import prisma from "@/lib/prisma";
import { symmetricDecrypt } from "@/lib/credential";
import OpenAi from "openai";
// Removed direct export handling; generation returns plain content only

// --- Prompt size management helpers ---
function stripHtml(html: string): string {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const noStyles = noScripts.replace(/<style[\s\S]*?<\/style>/gi, "");
  const text = noStyles.replace(/<[^>]+>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function middleOutTruncate(text: string, targetChars: number): string {
  if (text.length <= targetChars) return text;
  const headSize = Math.floor(targetChars * 0.6);
  const tailSize = targetChars - headSize - 64;
  const head = text.slice(0, headSize);
  const tail = text.slice(-tailSize);
  return `${head}\n\n...[TRUNCATED DUE TO LENGTH]...\n\n${tail}`;
}

function compressContentData(raw: string, maxInputTokens: number): { content: string; originalTokens: number; compressedTokens: number } {
  const MAX_CHARS = maxInputTokens * 4;
  const originalTokens = estimateTokens(raw);
  let processed = stripHtml(raw);
  let tokens = estimateTokens(processed);
  if (tokens > maxInputTokens) {
    processed = middleOutTruncate(processed, Math.min(processed.length, MAX_CHARS - 8000));
    tokens = estimateTokens(processed);
  }
  return { content: processed, originalTokens, compressedTokens: tokens };
}

export async function GenerateDocumentExecutor(
  enviornment: ExecutionEnviornment<typeof GenerateDocumentTask>
): Promise<boolean> {
  try {
    const startTime = performance.now();
    enviornment.log.info(`📄 Starting Document Generation at ${new Date().toLocaleTimeString()}...`);

    const contentData = enviornment.getInput("Content Data");
    if (!contentData) {
      enviornment.log.error("❌ Content Data is required");
      return false;
    }

    // Normalize the incoming document type and map synonyms
    const normalizeDocumentTypeKey = (input: string) => {
      const v = (input || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
      switch (v) {
        case "research_paper":
          return "research_paper";
        case "business_report":
          return "business_report";
        case "executive_summary":
        case "summary":
          return "executive_summary";
        case "thesis_chapter":
        case "thesis":
          return "thesis_chapter";
        default:
          return v;
      }
    };

    const rawDocumentType = enviornment.getInput("Document Type") || "research_paper";
    const documentType = normalizeDocumentTypeKey(rawDocumentType);
    const customInstructions = enviornment.getInput("Custom Instructions") || "";
    // Export format removed; downstream exporters will decide how to use content

    enviornment.log.info(`📋 Document type: ${rawDocumentType} → ${documentType}`);
    // No export format – keeping generation focused on content only

    // Compress oversize content to respect model context limits
    const MAX_INPUT_TOKENS = 100_000; // leave headroom under ~131k endpoint limit
    const { content: compressedContent, originalTokens, compressedTokens } = compressContentData(contentData, MAX_INPUT_TOKENS);
    enviornment.log.info(`🧹 Content tokens: original≈${originalTokens}, compressed≈${compressedTokens}`);

    const credentialId = enviornment.getInput("Credentials");
    if (!credentialId) {
      enviornment.log.error("❌ Credentials are required");
      return false;
    }

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      enviornment.log.error("❌ Credential not found");
      return false;
    }

    const plainCredentialValue = symmetricDecrypt(credential.value);
    if (!plainCredentialValue) {
      enviornment.log.error("❌ Cannot decrypt credential");
      return false;
    }
    enviornment.log.info("🔑 Credentials retrieved successfully");

    // Document templates
    const documentTemplates = {
      research_paper: {
        structure: "Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, References",
        tone: "Academic and scholarly",
        requirements: "Include proper citations, academic formatting, and structured sections"
      },
      business_report: {
        structure: "Executive Summary, Background, Analysis, Findings, Recommendations, Conclusion",
        tone: "Professional and analytical", 
        requirements: "Business-focused language, actionable insights, and clear recommendations"
      },
      executive_summary: {
        structure: "Key Points Summary, Main Findings, Strategic Implications, Next Steps",
        tone: "Concise and executive-level",
        requirements: "High-level overview suitable for executives, bullet points, key metrics"
      },
      thesis_chapter: {
        structure: "Chapter Introduction, Main Content with subsections, Analysis, Chapter Conclusion",
        tone: "Academic and scholarly",
        requirements: "Detailed analysis, proper academic formatting, and scholarly references"
      }
    };

    // Ensure we always have a valid template
    const template =
      documentTemplates[documentType as keyof typeof documentTemplates] ||
      documentTemplates.research_paper;

    const openAi = new OpenAi({
      apiKey: plainCredentialValue,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "WebExtract AI Document Generator",
      },
    });

    // Generate document content
    enviornment.log.info("🤖 Generating document content with AI...");
    const aiStartTime = performance.now();

    const response = await openAi.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: `You are an expert document writer. Create a comprehensive ${documentType} based on the provided content data.

Structure: ${template.structure}
Tone: ${template.tone}
Requirements: ${template.requirements}

Additional instructions: ${customInstructions}

Note: The input content may be compressed to meet context limits; focus on included sections and infer structure as needed.

Return the output as plain text with clear section headings, using line breaks for readability. Do NOT include HTML tags.`
        },
        {
          role: "user",
          content: `Create a ${documentType} based on this content data (compressed if necessary):\n\n${compressedContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiTime = performance.now() - aiStartTime;
    enviornment.log.info(`🚀 AI content generated in ${Math.round(aiTime)}ms`);

    const generatedContent = response.choices[0].message?.content;
    if (!generatedContent) {
      enviornment.log.error("❌ Failed to generate document content");
      return false;
    }

    // Return plain text content directly; downstream cards handle export
    enviornment.setOutput("Generated Document", generatedContent);

    const totalTime = performance.now() - startTime;
    enviornment.log.info(`🎉 Document generation completed in ${Math.round(totalTime)}ms`);
    enviornment.log.success("✅ Document content ready for export");

    return true;
  } catch (error: any) {
    enviornment.log.error("❌ Document generation failed:");
    enviornment.log.error(error.message);
    return false;
  }
}
