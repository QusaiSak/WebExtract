import { ExecutionEnviornment } from "@/lib/types";
import { TranslateTextTask } from "../task/TranslateText";
import prisma from "@/lib/prisma";
import { symmetricDecrypt } from "@/lib/credential";
import OpenAi from "openai";

export async function TranslateTextExecutor(
  enviornment: ExecutionEnviornment<typeof TranslateTextTask>
): Promise<boolean> {
  try {
    const textContent = enviornment.getInput("Text Content");
    if (!textContent) {
      enviornment.log.error("input -> Text Content is not defined");
      return false;
    }
    
    const targetLanguage = enviornment.getInput("Target Language");
    if (!targetLanguage) {
      enviornment.log.error("input -> Target Language is not defined");
      return false;
    }
    
    const credentialId = enviornment.getInput("Credentials");
    if (!credentialId) {
      enviornment.log.error("input -> Credentials is not defined");
      return false;
    }

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      enviornment.log.error("Credential not found");
      return false;
    }

    const plainCredentialValue = symmetricDecrypt(credential.value);
    if (!plainCredentialValue) {
      enviornment.log.error("Cannot decrypt credential");
      return false;
    }

    const languageNames = {
      en: "English",
      hi: "Hindi",
      ta: "Tamil", 
      bn: "Bengali",
      mr: "Marathi",
      kn: "Kannada"
    };

    const targetLanguageName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage;

    const openAi = new OpenAi({
      apiKey: plainCredentialValue,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "WebExtract AI Translation Service",
      },
    });

    const response = await openAi.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the provided text to ${targetLanguageName}. 
          Maintain the original meaning, context, and tone. 
          Return a JSON object with the following structure:
          {
            "translatedText": "translated content here",
            "sourceLanguage": "detected source language code (e.g., 'en', 'hi', 'ta')",
            "confidence": "confidence level (high/medium/low)"
          }`,
        },
        {
          role: "user",
          content: textContent,
        },
      ],
      temperature: 0.3,
    });

    enviornment.log.info(
      `Prompt tokens used: ${JSON.stringify(response.usage?.prompt_tokens)}`
    );

    enviornment.log.info(
      `Completion tokens used: ${JSON.stringify(response.usage?.completion_tokens)}`
    );

    const result = response.choices[0].message?.content;
    if (!result) {
      enviornment.log.error("Empty response from AI");
      return false;
    }

    try {
      const parsed = JSON.parse(result);
      enviornment.setOutput("Translated Text", parsed.translatedText || result);
      enviornment.setOutput("Source Language", parsed.sourceLanguage || "unknown");
      enviornment.log.info(`Translated text from ${parsed.sourceLanguage} to ${targetLanguage}`);
    } catch {
      // If not JSON, treat as plain translated text
      enviornment.setOutput("Translated Text", result);
      enviornment.setOutput("Source Language", "unknown");
      enviornment.log.info(`Translated text to ${targetLanguage}`);
    }

    return true;
  } catch (error: any) {
    enviornment.log.error(error.message);
    return false;
  }
}
