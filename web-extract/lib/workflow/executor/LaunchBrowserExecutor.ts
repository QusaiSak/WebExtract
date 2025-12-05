import { ExecutionEnviornment } from "@/lib/types";
import { LaunchBrowserTask } from "../task/LaunchBrowser";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";

export async function LaunchBrowserExecutor(
  enviornment: ExecutionEnviornment<typeof LaunchBrowserTask>
): Promise<boolean> {
  // Keep database connection alive during long operations
  let keepAliveInterval: NodeJS.Timeout | null = null;
  
  try {
    enviornment.log.info("🌐 Starting Launch Browser...");
    
    // Start keep-alive ping to prevent database connection timeout
    keepAliveInterval = setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        console.error('⚠️ Keep-alive query failed:', error);
      }
    }, 30000); // Ping every 30 seconds
    
    const websiteUrl = enviornment.getInput("Website Url");
    const researchLinks = enviornment.getInput("Research Links");
    const processAllLinks = enviornment.getInput("Process All Links");
    
    let urls: string[] = [];
    
    // Determine URLs to process
    if (researchLinks && processAllLinks === "true") {
      enviornment.log.info("🔄 Processing research links in parallel mode");
      
      // Try to parse URLs - handle both newline-separated and space-separated formats
      let parsedUrls: string[] = [];
      
      // First try newline-separated
      const lines = researchLinks.split('\n').filter(line => line.trim());
      if (lines.length > 0 && lines.every(line => line.startsWith('http'))) {
        // Clean newline-separated URLs
        parsedUrls = lines.map(line => line.trim());
      } else {
        // If not newline-separated, try to extract URLs using regex
        const urlMatches = researchLinks.match(/https?:\/\/[^\s]+/g);
        if (urlMatches) {
          parsedUrls = urlMatches.map(url => url.trim());
        }
      }
      
      urls = parsedUrls.filter(url => url.length > 0);
      enviornment.log.info(`🚀 Found ${urls.length} URLs for parallel processing`);
      
    } else if (researchLinks) {
      enviornment.log.info("🎯 Processing first research link only");
      
      // Extract first URL from research links
      const urlMatch = researchLinks.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        urls = [urlMatch[0].trim()];
      }
      
    } else if (websiteUrl) {
      enviornment.log.info("🌍 Processing direct website URL");
      const trimmed = websiteUrl.trim();
      // Detect multiple URLs in Website Url field
      const newlineUrls = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      const regexUrls = trimmed.match(/https?:\/\/[^\s]+/g) || [];
      const candidateUrls = (newlineUrls.length > 1 ? newlineUrls : regexUrls).length > 1
        ? (newlineUrls.length > 1 ? newlineUrls : regexUrls)
        : [trimmed];
      urls = candidateUrls;
      if (urls.length > 1) {
        enviornment.log.info(`🔄 Detected ${urls.length} URLs in Website Url input; switching to parallel processing`);
      }
    }
    
    if (urls.length === 0) {
      enviornment.log.error("❌ No URL provided. Please provide either Website URL or Research Links.");
      throw new Error("No URL provided. Please provide either Website URL or Research Links.");
    }

    // Validate and filter URLs
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];

    for (const url of urls) {
      try {
        const urlObj = new URL(url.trim());
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          validUrls.push(urlObj.href);
        } else {
          invalidUrls.push(url);
        }
      } catch (error) {
        invalidUrls.push(url);
      }
    }

    if (invalidUrls.length > 0) {
      enviornment.log.info(`⚠️ Skipped ${invalidUrls.length} invalid URLs`);
    }

    if (validUrls.length === 0) {
      enviornment.log.error("❌ No valid URLs found to process");
      throw new Error("No valid URLs found to process");
    }

    enviornment.log.info(`✅ Processing ${validUrls.length} valid URLs`);
    urls = validUrls;

    enviornment.log.info("🚀 Starting browser instance...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-features=VizDisplayCompositor",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check"
      ],
    });
    enviornment.log.info("✅ Browser started successfully");
    enviornment.setBrowser(browser);

    let allPagesData: any[] = [];
    
    // Process URLs in parallel for speed
    if (urls.length > 1) {
      const startTime = performance.now();
      enviornment.log.info(`⚡ Processing ${urls.length} URLs in parallel for maximum speed`);
      enviornment.log.info(`⏱️ Starting parallel processing at ${new Date().toLocaleTimeString()}`);
      
      const pagePromises = urls.map(async (url, index) => {
        const pageStartTime = performance.now();
        try {
          enviornment.log.info(`📄 Loading page ${index + 1}/${urls.length}: ${url}`);
          const page = await browser.newPage();
          
          // Optimize page for faster loading
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const resourceType = req.resourceType();
            if(['image', 'stylesheet', 'font', 'media'].includes(resourceType)){
              req.abort();
            } else {
              req.continue();
            }
          });
          
          const navigationStartTime = performance.now();
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });
          const navigationTime = performance.now() - navigationStartTime;
          enviornment.log.info(`🚀 Navigation completed in ${Math.round(navigationTime)}ms for: ${url}`);
          
          const extractionStartTime = performance.now();
          const htmlContent = await page.content();
          const extractionTime = performance.now() - extractionStartTime;
          enviornment.log.info(`📝 HTML extracted in ${Math.round(extractionTime)}ms (${Math.round(htmlContent.length / 1024)}KB)`);
          
          const pageData = {
            url: url,
            title: await page.title(),
            index: index + 1,
            total: urls.length,
            html: htmlContent,
            timing: {
              navigationMs: Math.round(navigationTime),
              extractionMs: Math.round(extractionTime),
              totalMs: Math.round(performance.now() - pageStartTime)
            }
          };
          
          await page.close();
          
          const totalPageTime = performance.now() - pageStartTime;
          enviornment.log.info(`✅ Completed ${index + 1}/${urls.length} in ${Math.round(totalPageTime)}ms: ${pageData.title || 'Untitled'}`);
          return pageData;
        } catch (error: any) {
          const totalPageTime = performance.now() - pageStartTime;
          enviornment.log.error(`❌ Failed ${index + 1}/${urls.length} after ${Math.round(totalPageTime)}ms ${url}: ${error.message}`);
          return {
            url: url,
            title: "Error loading page",
            index: index + 1,
            total: urls.length,
            error: error.message,
            html: "",
            timing: {
              totalMs: Math.round(totalPageTime),
              navigationMs: 0,
              extractionMs: 0
            }
          };
        }
      });

      allPagesData = await Promise.all(pagePromises);
      
      const totalTime = performance.now() - startTime;
      const successCount = allPagesData.filter(p => !p.error).length;
      const failCount = allPagesData.filter(p => p.error).length;
      const timings = allPagesData.map(p => p.timing?.totalMs || 0);
      const avgTime = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
      const maxTime = Math.max(...timings);
      const minTime = timings.length > 0 ? Math.min(...timings) : 0;
      
      const totalHtmlSize = allPagesData.reduce((total, page) => total + (page.html?.length || 0), 0);
      const totalSizeKB = Math.round(totalHtmlSize / 1024);
      
      enviornment.log.info(`🎉 Parallel processing completed in ${Math.round(totalTime)}ms!`);
      enviornment.log.info(`📊 Results: ${successCount} success, ${failCount} failed out of ${allPagesData.length} total`);
      enviornment.log.info(`⏱️ Timing: avg ${avgTime}ms, fastest ${minTime}ms, slowest ${maxTime}ms per page`);
      enviornment.log.info(`💾 Total data extracted: ${totalSizeKB}KB of HTML content`);
      
    } else {
      // Single URL processing
      const url = urls[0];
      try {
        enviornment.log.info(`🌍 Opening: ${url}`);
        const page = await browser.newPage();
        enviornment.setPage(page);

        await page.goto(url);
        enviornment.log.info(`✅ Successfully opened: ${url}`);
      } catch (error: any) {
        enviornment.log.error(`❌ Failed to process ${url}: ${error.message}`);
        return false;
      }
    }
    
    // Set outputs
    if (urls.length > 1) {
      enviornment.setOutput("All Pages Data", JSON.stringify(allPagesData, null, 2));
      enviornment.setOutput("Pages Processed", urls.length.toString());
    }
    
    // Clear keep-alive interval
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    
    return true;
  } catch (error: any) {
    // Clear keep-alive interval on error
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    enviornment.log.error(error.message);
    return false;
  }
}
