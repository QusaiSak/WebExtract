import { ExecutionEnviornment } from "@/lib/types";
import { PageToHtmlTask } from "../task/PageToHtml";

export async function PageToHtmlExecutor(
  enviornment: ExecutionEnviornment<typeof PageToHtmlTask>
): Promise<boolean> {
  try {
    const executorStartTime = performance.now();
    enviornment.log.info(`🔄 Starting PageToHTML processing at ${new Date().toLocaleTimeString()}`);
    
    const allPagesData = enviornment.getInput("All Pages Data");
    
    if (allPagesData) {
      // Process multiple pages data (much faster - HTML already extracted)
      try {
        const parseStartTime = performance.now();
        enviornment.log.info(`📝 Parsing pages data...`);
        
        const pagesData = JSON.parse(allPagesData);
        const parseTime = performance.now() - parseStartTime;
        enviornment.log.info(`✅ Parsed ${pagesData.length} pages in ${Math.round(parseTime)}ms`);
        
        // Calculate original data size
        const originalSizeKB = Math.round(allPagesData.length / 1024);
        enviornment.log.info(`📊 Input data size: ${originalSizeKB}KB`);
        
        const combineStartTime = performance.now();
        enviornment.log.info(`🔄 Combining HTML content...`);
        
        // Combine all HTML content
        const combinedHTML = pagesData.map((page: any) => 
          `<!-- Source: ${page.url} -->\n<h1>${page.title}</h1>\n${page.html || ''}\n\n`
        ).join('\n');
        const combineTime = performance.now() - combineStartTime;
        
        const outputStartTime = performance.now();
        const allHtmlData = JSON.stringify({
          pages: pagesData,
          combinedHTML: combinedHTML,
          totalPages: pagesData.length,
          processedAt: new Date().toISOString()
        }, null, 2);
        
        enviornment.setOutput("HTML", combinedHTML);
        enviornment.setOutput("All HTML Data", allHtmlData);
        enviornment.setOutput("Pages Count", pagesData.length.toString());
        
        const outputTime = performance.now() - outputStartTime;
        const totalTime = performance.now() - executorStartTime;
        
        // Calculate sizes
        const combinedSizeKB = Math.round(combinedHTML.length / 1024);
        const outputSizeKB = Math.round(allHtmlData.length / 1024);
        
        enviornment.log.info(`✅ Combined HTML in ${Math.round(combineTime)}ms`);
        enviornment.log.info(`💾 Output sizes: Combined HTML ${combinedSizeKB}KB, Full data ${outputSizeKB}KB`);
        enviornment.log.info(`⚡ Set outputs in ${Math.round(outputTime)}ms`);
        enviornment.log.info(`🎉 PageToHTML completed in ${Math.round(totalTime)}ms total`);
        enviornment.log.info(`🚀 Fast processing: Combined HTML from ${pagesData.length} pages (${combinedHTML.length} characters)`);
        return true;
        
      } catch (parseError) {
        enviornment.log.error(`Error parsing pages data: ${parseError}`);
        return false;
      }
    } else {
      // Single page processing (original method)
      const page = enviornment.getPage();
      if (!page) {
        enviornment.log.error("No web page available");
        return false;
      }
      
      const html = await page.content();
      enviornment.setOutput("HTML", html);
      enviornment.setOutput("Pages Count", "1");
      enviornment.log.info(`Single page HTML extracted: ${html.length} characters`);
      return true;
    }
  } catch (error: any) {
    enviornment.log.error(error.message);
    return false;
  }
}
