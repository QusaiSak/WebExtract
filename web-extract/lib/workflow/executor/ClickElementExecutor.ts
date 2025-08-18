import { ExecutionEnviornment } from "@/lib/types";
import { ClickElementTask } from "../task/ClickElement";

export async function ClickElementExecutor(
  enviornment: ExecutionEnviornment<typeof ClickElementTask>
): Promise<boolean> {
  try {
    const selector = enviornment.getInput("Selector");
    if (!selector) {
      enviornment.log.error("input -> selector is not defined");
      return false;
    }

    // Clean and validate the selector
    let cleanSelector = selector.trim();
    
    // Fix common selector issues
    if (cleanSelector.startsWith('.') && cleanSelector.includes(' ')) {
      // Fix multiple classes: ".btn btn-primary" -> ".btn.btn-primary"
      const classes = cleanSelector.substring(1).split(' ').filter(cls => cls.length > 0);
      cleanSelector = '.' + classes.join('.');
      enviornment.log.info(`Fixed selector from "${selector}" to "${cleanSelector}"`);
    }

    enviornment.log.info(`Attempting to click element with selector: ${cleanSelector}`);

    const page = enviornment.getPage();
    if (!page) {
      enviornment.log.error("Page is not available");
      return false;
    }

    // Wait for the element to be visible before clicking
    try {
      await page.waitForSelector(cleanSelector, { timeout: 10000 });
      enviornment.log.info(`Element found: ${cleanSelector}`);
    } catch (waitError) {
      enviornment.log.error(`Element not found or not visible: ${cleanSelector}`);
      
      // Try alternative selectors
      const alternatives = [
        'button[type="submit"]',
        '.btn-primary',
        '.btn',
        'input[type="submit"]',
        '[type="submit"]'
      ];

      for (const altSelector of alternatives) {
        try {
          await page.waitForSelector(altSelector, { timeout: 2000 });
          enviornment.log.info(`Found alternative selector: ${altSelector}`);
          cleanSelector = altSelector;
          break;
        } catch {
          // Continue to next alternative
        }
      }
    }

    // Click the element
    await page.click(cleanSelector);
    enviornment.log.info(`Successfully clicked element: ${cleanSelector}`);

    return true;
  } catch (error: any) {
    enviornment.log.error(`ClickElement error: ${error.message}`);
    return false;
  }
}