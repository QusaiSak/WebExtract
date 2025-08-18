import { ExecutionEnviornment } from "@/lib/types";
import { ReadPropertyFromJsonTask } from "../task/ReadPropertyFromJson";

export async function ReadPropertyFromJsonExecutor(
  enviornment: ExecutionEnviornment<typeof ReadPropertyFromJsonTask>
): Promise<boolean> {
  try {
    let jsonData = enviornment.getInput("JSON");
    if (!jsonData) {
      enviornment.log.error("input -> JSON is not defined");
      return false;
    }
    
    const propertyName = enviornment.getInput("Property name");
    if (!propertyName) {
      enviornment.log.error("input -> Property name is not defined");
      return false;
    }

    // Handle multiple levels of JSON stringification
    let json = jsonData;
    let parseAttempts = 0;
    const maxParseAttempts = 5; // Prevent infinite loops

    // Keep parsing until we get an object or reach max attempts
    while (typeof json === 'string' && parseAttempts < maxParseAttempts) {
      try {
        const parsed = JSON.parse(json);
        json = parsed;
        parseAttempts++;
        enviornment.log.info(`Parse attempt ${parseAttempts}: ${typeof json}`);
      } catch (parseError) {
        // If parsing fails, it's not valid JSON
        break;
      }
    }

    // Final check - ensure we have an object
    if (typeof json !== 'object' || json === null) {
      enviornment.log.error(`After ${parseAttempts} parse attempts, result is not an object. Type: ${typeof json}`);
      enviornment.log.error(`Final value: ${json}`);
      return false;
    }

    enviornment.log.info(`Successfully parsed JSON after ${parseAttempts} attempts`);

    // Check if property exists
    if (!(propertyName in json)) {
      enviornment.log.error(`Property '${propertyName}' not found in JSON object`);
      enviornment.log.info(`Available properties: ${Object.keys(json).join(', ')}`);
      enviornment.log.info(`JSON structure: ${JSON.stringify(json, null, 2)}`);
      return false;
    }

    const propertyValue = json[propertyName];

    // Log the found value for debugging
    enviornment.log.info(`Found property '${propertyName}' with value: ${JSON.stringify(propertyValue)}`);

    // Convert value to string if it's an object/array, otherwise keep as-is
    const outputValue = typeof propertyValue === 'object' 
      ? JSON.stringify(propertyValue) 
      : propertyValue;

    enviornment.setOutput("Property Value", outputValue);

    return true;
  } catch (error: any) {
    enviornment.log.error(`ReadPropertyFromJson error: ${error.message}`);
    return false;
  }
}