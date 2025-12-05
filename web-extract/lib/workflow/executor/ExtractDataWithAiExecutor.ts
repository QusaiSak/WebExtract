import { ExecutionEnviornment } from "@/lib/types";
import { ExtractDataWithAiTask } from "../task/ExtractDataWithAi";
import prisma from "@/lib/prisma";
import { symmetricDecrypt } from "@/lib/credential";
import OpenAi from "openai";
import * as cheerio from "cheerio";

export async function ExtractDataWithAiExecutor(
  enviornment: ExecutionEnviornment<typeof ExtractDataWithAiTask>
): Promise<boolean> {
  try {
    const credentialId = enviornment.getInput("Credentials");
    if (!credentialId) {
      enviornment.log.error("input -> credentials is not defined");
      return false;
    }
    const content = enviornment.getInput("Content");
    if (!content) {
      enviornment.log.error("input -> content is not defined");
      return false;
    }
    const prompt = enviornment.getInput("Prompt");
    if (!prompt) {
      enviornment.log.error("input -> prompt is not defined");
      return false;
    }

    // Handle case where input is JSON (from PageToHtml "All HTML Data" output)
    let htmlContent = content;
    try {
      // Try to parse as JSON to see if it's a structured object
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const jsonContent = JSON.parse(content);
        
        // Check for common patterns from PageToHtmlExecutor
        if (jsonContent.combinedHTML) {
          htmlContent = jsonContent.combinedHTML;
          enviornment.log.info("📄 Detected JSON input, extracting 'combinedHTML'");
        } else if (jsonContent.html) {
          htmlContent = jsonContent.html;
          enviornment.log.info("📄 Detected JSON input, extracting 'html'");
        } else if (Array.isArray(jsonContent.pages)) {
          // Combine HTML from all pages
          htmlContent = jsonContent.pages.map((p: any) => p.html || '').join('\n\n');
          enviornment.log.info(`📄 Detected JSON input, combining HTML from ${jsonContent.pages.length} pages`);
        } else if (jsonContent.pages && Array.isArray(jsonContent.pages)) {
           // Handle the specific structure shown in user screenshot
           htmlContent = jsonContent.pages.map((p: any) => p.html || '').join('\n\n');
           enviornment.log.info(`📄 Detected JSON input, combining HTML from ${jsonContent.pages.length} pages`);
        }
      }
    } catch (e) {
      // Not JSON or failed to parse, proceed with raw content
    }

    // Clean content using cheerio to reduce token usage without losing structure
    const $ = cheerio.load(htmlContent);
    
    // Remove unnecessary elements
    $('script, style, noscript, iframe, svg, link, meta, head').remove();
    
    // Remove comments
    $('*').contents().filter((_: any, el: any) => el.type === 'comment').remove();

    // Remove heavy attributes from all elements to save tokens
    $('*').each((_: any, el: any) => {
      if (el.type === 'tag') {
        const attribs = el.attribs;
        for (const name in attribs) {
          // Remove style, data-*, on*, aria-*, width, height
          if (
            name === 'style' || 
            name.startsWith('data-') || 
            name.startsWith('aria-') || 
            name.startsWith('on') ||
            name === 'width' || 
            name === 'height'
          ) {
            $(el).removeAttr(name);
          }
        }
      }
    });

    // Get the cleaned HTML (body only) and normalize whitespace
    let cleanedContent = $('body').html() || '';
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();

    // Safety check: Limit to ~1.5M tokens (approx 6M chars) to avoid 400 error
    const MAX_CHARS = 6000000;
    if (cleanedContent.length > MAX_CHARS) {
       enviornment.log.info(`⚠️ Content too large (${cleanedContent.length} chars), truncating to ${MAX_CHARS} chars to fit token limit`);
       cleanedContent = cleanedContent.substring(0, MAX_CHARS);
    }

    const credential = await prisma.credential.findUnique({
      where: {
        id: credentialId,
      },
    });

    if (!credential) {
      enviornment.log.error("Credential no found");
      return false;
    }

    const plainCredentialValue = symmetricDecrypt(credential.value);

    if (!plainCredentialValue) {
      enviornment.log.error("Cannot decrypt credential");
      return false;
    }

    const openAi = new OpenAi({
      apiKey: plainCredentialValue,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "WebExtract AI Data Extraction",
      },
    });

    const response = await openAi.chat.completions.create({
      model: "x-ai/grok-4.1-fast:free",
      messages: [
        {
          role: "system",
          content:
            "You are a webscraper helper that extracts data from HTML or text. You will be given a piece of text or HTML content as input and also the prompt with the data you have to extract. The response should always be only the extracted data as a JSON array or object, without any additional words or explanations. Analyze the input carefully and extract data precisely based on the prompt. If no data is found, return an empty JSON array. Work only with the provided content and ensure the output is always a valid JSON array without any surrounding text",
        },
        {
          role: "user",
          content: cleanedContent,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
    });
    console.log(response);
    enviornment.log.info(
      `Prompt tokens used: ${JSON.stringify(response.usage?.prompt_tokens)}`
    );

    enviornment.log.info(
      `Completition tokens used: ${JSON.stringify(
        response.usage?.completion_tokens
      )}`
    );

    const result = response.choices[0].message?.content;

    if (!result) {
      enviornment.log.error("Empty response from AI");
      return false;
    }

    // Output the JSON text directly (no double stringification)
    enviornment.setOutput("Extracted Data", result);

    return true;
  } catch (error: any) {
    enviornment.log.error(error.message);
    return false;
  }
}
