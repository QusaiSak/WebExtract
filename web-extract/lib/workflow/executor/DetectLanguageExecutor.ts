import { ExecutionEnviornment } from "@/lib/types";
import { DetectLanguageTask } from "../task/DetectLanguage";

export async function DetectLanguageExecutor(
  enviornment: ExecutionEnviornment<typeof DetectLanguageTask>
): Promise<boolean> {
  try {
    const textContent = enviornment.getInput("Text Content");
    if (!textContent) {
      enviornment.log.error("input -> Text Content is not defined");
      return false;
    }

    // Simple language detection based on character patterns
    const detectLanguage = (text: string) => {
      const cleanText = text.trim().toLowerCase();
      
      // Devanagari script (Hindi, Marathi)
      if (/[\u0900-\u097F]/.test(cleanText)) {
        // More specific detection between Hindi and Marathi could be added
        return { code: "hi", name: "Hindi", confidence: 0.85 };
      }
      
      // Tamil script
      if (/[\u0B80-\u0BFF]/.test(cleanText)) {
        return { code: "ta", name: "Tamil", confidence: 0.95 };
      }
      
      // Bengali script
      if (/[\u0980-\u09FF]/.test(cleanText)) {
        return { code: "bn", name: "Bengali", confidence: 0.95 };
      }
      
      // Kannada script
      if (/[\u0C80-\u0CFF]/.test(cleanText)) {
        return { code: "kn", name: "Kannada", confidence: 0.95 };
      }
      
      // Basic English detection (Latin script with common English words)
      const englishWords = ["the", "and", "is", "in", "to", "of", "a", "that", "it", "with", "for", "as", "was", "on", "are"];
      const words = cleanText.split(/\s+/);
      const englishWordCount = words.filter(word => englishWords.includes(word)).length;
      
      if (englishWordCount > words.length * 0.1) {
        return { code: "en", name: "English", confidence: 0.8 };
      }
      
      // Default to English if no specific script detected
      return { code: "en", name: "English", confidence: 0.3 };
    };

    const detection = detectLanguage(textContent);
    
    enviornment.setOutput("Language Code", detection.code);
    enviornment.setOutput("Confidence Score", detection.confidence.toString());
    enviornment.setOutput("Text Content", textContent);
    
    enviornment.log.info(`Detected language: ${detection.name} (${detection.code}) with confidence ${detection.confidence}`);

    return true;
  } catch (error: any) {
    enviornment.log.error(error.message);
    return false;
  }
}
