import { ExecutionEnviornment } from "@/lib/types";
import { AiResearchAssistantTask } from "../task/AiResearchAssistant";
import prisma from "@/lib/prisma";
import { symmetricDecrypt } from "@/lib/credential";
import OpenAi from "openai";

export async function AiResearchAssistantExecutor(
  enviornment: ExecutionEnviornment<typeof AiResearchAssistantTask>
): Promise<boolean> {
  try {
    const startTime = performance.now();
    enviornment.log.info(`🔍 Starting AI Research Assistant at ${new Date().toLocaleTimeString()}...`);
    
    const researchQuery = enviornment.getInput("Research Query");
    if (!researchQuery) {
      enviornment.log.error("❌ Research Query is required");
      return false;
    }
    enviornment.log.info(`🎯 Research topic: "${researchQuery}"`);
    
    const numberOfLinksInput = enviornment.getInput("Number of Links") || "5";
    const numberOfLinks = parseInt(numberOfLinksInput);
    enviornment.log.info(`📊 Generating ${numberOfLinks} research links`);
    
    const credentialId = enviornment.getInput("Credentials");
    if (!credentialId) {
      enviornment.log.error("❌ Credentials are required");
      return false;
    }

    const credentialStartTime = performance.now();
    enviornment.log.info("🔐 Retrieving API credentials...");
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
    const credentialTime = performance.now() - credentialStartTime;
    enviornment.log.info(`✅ Credentials retrieved in ${Math.round(credentialTime)}ms`);

    const aiSetupStartTime = performance.now();
    enviornment.log.info("🌐 Connecting to SerpApi for search...");
    const aiSetupTime = performance.now() - aiSetupStartTime;
    enviornment.log.info(`🌐 SerpApi setup completed in ${Math.round(aiSetupTime)}ms`);

    const aiRequestStartTime = performance.now();
    enviornment.log.info("� Sending search request to SerpApi...");

    // Use SerpApi to search for real research links
    const serpApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(researchQuery)}&api_key=${plainCredentialValue}&num=${numberOfLinks}&hl=en`;
    
    const searchResponse = await fetch(serpApiUrl);
    if (!searchResponse.ok) {
      throw new Error(`SerpApi request failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    const aiRequestTime = performance.now() - aiRequestStartTime;
    enviornment.log.info(`🚀 SerpApi response received in ${Math.round(aiRequestTime)}ms`);

    if (searchData.error) {
      enviornment.log.error(`❌ SerpApi error: ${searchData.error}`);
      return false;
    }

    const processingStartTime = performance.now();
    
    // Extract organic results from SerpApi response
    const organicResults = searchData.organic_results || [];
    if (organicResults.length === 0) {
      enviornment.log.error("❌ No search results found");
      return false;
    }

    // Extract clean URLs for Launch Browser (one URL per line, no numbering)
    const cleanUrls = organicResults
      .slice(0, numberOfLinks)
      .map((item: any) => item.link)
      .filter((link: string | undefined) => !!link && link.startsWith('http'));

    // Format for Launch Browser: plain newline-separated URLs
    const linksForBrowser = cleanUrls.join('\n');

    // Format for display: numbered list
    const prettyList = cleanUrls
      .map((link: string, index: number) => `${index + 1}. ${link}`)
      .join('\n');

    const linkCount = cleanUrls.length;

    // Create a brief summary
    const summary = `Found ${linkCount} research links for: ${researchQuery}`;

    // Output for Launch Browser (clean URLs)
    enviornment.setOutput("Research Links", linksForBrowser);
    enviornment.setOutput("Link Count", linkCount.toString());
    enviornment.setOutput("Research Summary", summary);
    
    const processingTime = performance.now() - processingStartTime;
    const totalTime = performance.now() - startTime;
    
    enviornment.log.info(`📝 Results processed in ${Math.round(processingTime)}ms`);
    enviornment.log.info(`🎉 AI Research Assistant completed in ${Math.round(totalTime)}ms total`);
    enviornment.log.info(`✅ Successfully generated research links!`);
    enviornment.log.info(`📝 Research summary: Found ${linkCount} links for "${researchQuery}"`);
    enviornment.log.info(`⏱️ Breakdown - Credentials: ${Math.round(credentialTime)}ms, AI Setup: ${Math.round(aiSetupTime)}ms, AI Request: ${Math.round(aiRequestTime)}ms, Processing: ${Math.round(processingTime)}ms`);

    return true;
  } catch (error: any) {
    enviornment.log.error(`❌ AI Research Assistant error: ${error.message}`);
    return false;
  }
}
