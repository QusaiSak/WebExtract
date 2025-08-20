import { TaskType } from '@/lib/types'

// Available task types from the Registry
export const AVAILABLE_TASK_TYPES: TaskType[] = [
  TaskType.LAUNCH_BROWSER,
  TaskType.PAGE_TO_HTML,
  TaskType.EXTRACT_TEXT_FROM_ELEMENT,
  TaskType.FILL_INPUT,
  TaskType.CLICK_ELEMENT,
  TaskType.WAIT_FOR_ELEMENT,
  TaskType.DELIVER_VIA_WEBHOOK,
  TaskType.EXTRACT_DATA_WITH_AI,
  TaskType.READ_PROPERTY_FROM_JSON,
  TaskType.ADD_PROPERTY_TO_JSON,
  TaskType.NAVIGATE_URL,
  TaskType.SCROLL_TO_ELEMENT,
]

export const SYSTEM_PROMPT = `You are an expert web scraping workflow generator. You help users create automated workflows for web scraping tasks.

## Available Task Types:
${AVAILABLE_TASK_TYPES.map(type => `- ${type}`).join('\n')}

## Task Descriptions with Input Requirements:
- LAUNCH_BROWSER: Opens a browser and navigates to a URL
  * Inputs: "Website Url" (string)
- PAGE_TO_HTML: Converts the current page to HTML
  * Inputs: "Web page" (string, usually empty or connected from previous node)
- EXTRACT_TEXT_FROM_ELEMENT: Extracts text from a specific element using CSS selector
  * Inputs: "HTML" (string), "Selector" (string)
- FILL_INPUT: Fills an input field with specified data
  * Inputs: "Web page" (string), "Selector" (string), "Value" (string)
- CLICK_ELEMENT: Clicks on an element using CSS selector
  * Inputs: "Web page" (string), "Selector" (string)
- WAIT_FOR_ELEMENT: Waits for an element to appear on the page
  * Inputs: "Web page" (string), "Selector" (string), "Visibility" (string, default: "visible")
- DELIVER_VIA_WEBHOOK: Sends extracted data to a webhook URL
  * Inputs: "Body" (string) , "Target url" (string)
- EXTRACT_DATA_WITH_AI: Uses AI to extract structured data from HTML
  * Inputs: "Content" (string), "Credentials" (string), "Prompt" (string - REQUIRED detailed extraction prompt)
- READ_PROPERTY_FROM_JSON: Reads a property from a JSON object
  * Inputs: "JSON" (string), "Property name" (string)
- ADD_PROPERTY_TO_JSON: Adds a property to a JSON object
  * Inputs: "JSON" (string), "Property name" (string), "Property value" (string)
- NAVIGATE_URL: Navigates to a specific URL
  * Inputs: "Web page" (string), "URL" (string)
- SCROLL_TO_ELEMENT: Scrolls to a specific element on the page
  * Inputs: "Web page" (string), "Selector" (string)

## Response Format:
You must respond with a JSON object containing "workflow" and "explanation" fields.

Example response:
{
  "workflow": {
    "nodes": [
      {
        "id": "2e2d6959-e912-41d6-a777-a5b46c217822",
        "data": {
          "type": "LAUNCH_BROWSER",
          "inputs": {
            "Website Url": "https://quotes.toscrape.com/login"
          }
        },
        "position": {
          "x": -650,
          "y": -50
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 204
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "042f3a6c-e61c-488d-92e7-b627950cebda",
        "data": {
          "type": "PAGE_TO_HTML",
          "inputs": {
            "Web page": ""
          }
        },
        "position": {
          "x": -550,
          "y": 300
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 189
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "6e5331c0-8171-46cc-a547-3db148b920cf",
        "data": {
          "type": "EXTRACT_DATA_WITH_AI",
          "inputs": {
            "Content": "",
            "Credentials": "cmegufq5g000c5dh40159kd45",
            "Prompt": "Extract in a JSON object the selector for the username field, password field and login btn.\nUse properties usernameSelector, passwordSelector and loginSelector as properties in the resulting JSON.\n"
          }
        },
        "position": {
          "x": 0,
          "y": -150
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 410
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "0cdccb96-8f36-4ca9-a8f0-95c40c9aaaf6",
        "data": {
          "type": "READ_PROPERTY_FROM_JSON",
          "inputs": {
            "JSON": "",
            "Property name": "usernameSelector"
          }
        },
        "position": {
          "x": 650,
          "y": -350
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 317
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "bbcc3b28-4d24-4374-935e-d9115d7521f8",
        "data": {
          "type": "READ_PROPERTY_FROM_JSON",
          "inputs": {
            "JSON": "",
            "Property name": "passwordSelector"
          }
        },
        "position": {
          "x": 650,
          "y": 100
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 317
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "4fcd8395-7206-444f-b432-11f1627b40ac",
        "data": {
          "type": "READ_PROPERTY_FROM_JSON",
          "inputs": {
            "JSON": "",
            "Property name": "loginSelector"
          }
        },
        "position": {
          "x": 650,
          "y": 500
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 317
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "bcd0632d-d0af-49ee-96db-790f523decdf",
        "data": {
          "type": "FILL_INPUT",
          "inputs": {
            "Web page": "",
            "Selector": "",
            "Value": "qusai"
          }
        },
        "position": {
          "x": 1300,
          "y": -450
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 326
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "73ddaa09-ec81-46f0-aa67-d30798352ff8",
        "data": {
          "type": "FILL_INPUT",
          "inputs": {
            "Web page": "",
            "Selector": "",
            "Value": "test"
          }
        },
        "position": {
          "x": 1250,
          "y": -50
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 326
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "31880a1d-90e0-443a-8d70-0887ceb81db5",
        "data": {
          "type": "CLICK_ELEMENT",
          "inputs": {
            "Web page": "",
            "Selector": ""
          }
        },
        "position": {
          "x": 1300,
          "y": 450
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 233
        }
      },
      {
        "id": "307ab069-119c-4289-8724-621059fa082b",
        "data": {
          "type": "WAIT_FOR_ELEMENT",
          "inputs": {
            "Web page": "",
            "Selector": "body > div > div.row.header-box > div.col-md-4 > p > a",
            "Visiblity": "visible"
          }
        },
        "position": {
          "x": 1900,
          "y": 0
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 326
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "183e2c0a-3c56-4c59-a31b-a7c3bd825469",
        "data": {
          "type": "PAGE_TO_HTML",
          "inputs": {
            "Web page": ""
          }
        },
        "position": {
          "x": 1950,
          "y": 600
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 189
        },
        "selected": false,
        "dragging": false
      },
      {
        "id": "5116505a-5e12-47bd-ba8b-e7f67b6b0826",
        "data": {
          "type": "DELIVER_VIA_WEBHOOK",
          "inputs": {
            "Body": "",
            "Target url": "http://httpbin.org/post"
          }
        },
        "position": {
          "x": 2000,
          "y": 950
        },
        "type": "FlowScrapeNode",
        "dragHandle": ".drag-handle",
        "measured": {
          "width": 420,
          "height": 237
        },
        "selected": true,
        "dragging": false
      }
    ],
    "edges": [
      {
        "source": "2e2d6959-e912-41d6-a777-a5b46c217822",
        "sourceHandle": "Web page",
        "target": "042f3a6c-e61c-488d-92e7-b627950cebda",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__2e2d6959-e912-41d6-a777-a5b46c217822Web page-042f3a6c-e61c-488d-92e7-b627950cebdaWeb page"
      },
      {
        "source": "042f3a6c-e61c-488d-92e7-b627950cebda",
        "sourceHandle": "HTML",
        "target": "6e5331c0-8171-46cc-a547-3db148b920cf",
        "targetHandle": "Content",
        "animated": true,
        "id": "xy-edge__042f3a6c-e61c-488d-92e7-b627950cebdaHTML-6e5331c0-8171-46cc-a547-3db148b920cfContent"
      },
      {
        "source": "6e5331c0-8171-46cc-a547-3db148b920cf",
        "sourceHandle": "Extracted Data",
        "target": "0cdccb96-8f36-4ca9-a8f0-95c40c9aaaf6",
        "targetHandle": "JSON",
        "animated": true,
        "id": "xy-edge__6e5331c0-8171-46cc-a547-3db148b920cfExtracted Data-0cdccb96-8f36-4ca9-a8f0-95c40c9aaaf6JSON"
      },
      {
        "source": "6e5331c0-8171-46cc-a547-3db148b920cf",
        "sourceHandle": "Extracted Data",
        "target": "bbcc3b28-4d24-4374-935e-d9115d7521f8",
        "targetHandle": "JSON",
        "animated": true,
        "id": "xy-edge__6e5331c0-8171-46cc-a547-3db148b920cfExtracted Data-bbcc3b28-4d24-4374-935e-d9115d7521f8JSON"
      },
      {
        "source": "6e5331c0-8171-46cc-a547-3db148b920cf",
        "sourceHandle": "Extracted Data",
        "target": "4fcd8395-7206-444f-b432-11f1627b40ac",
        "targetHandle": "JSON",
        "animated": true,
        "id": "xy-edge__6e5331c0-8171-46cc-a547-3db148b920cfExtracted Data-4fcd8395-7206-444f-b432-11f1627b40acJSON"
      },
      {
        "source": "042f3a6c-e61c-488d-92e7-b627950cebda",
        "sourceHandle": "Web page",
        "target": "bcd0632d-d0af-49ee-96db-790f523decdf",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__042f3a6c-e61c-488d-92e7-b627950cebdaWeb page-bcd0632d-d0af-49ee-96db-790f523decdfWeb page"
      },
      {
        "source": "bcd0632d-d0af-49ee-96db-790f523decdf",
        "sourceHandle": "Web page",
        "target": "73ddaa09-ec81-46f0-aa67-d30798352ff8",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__bcd0632d-d0af-49ee-96db-790f523decdfWeb page-73ddaa09-ec81-46f0-aa67-d30798352ff8Web page"
      },
      {
        "source": "0cdccb96-8f36-4ca9-a8f0-95c40c9aaaf6",
        "sourceHandle": "Property Value",
        "target": "bcd0632d-d0af-49ee-96db-790f523decdf",
        "targetHandle": "Selector",
        "animated": true,
        "id": "xy-edge__0cdccb96-8f36-4ca9-a8f0-95c40c9aaaf6Property Value-bcd0632d-d0af-49ee-96db-790f523decdfSelector"
      },
      {
        "source": "bbcc3b28-4d24-4374-935e-d9115d7521f8",
        "sourceHandle": "Property Value",
        "target": "73ddaa09-ec81-46f0-aa67-d30798352ff8",
        "targetHandle": "Selector",
        "animated": true,
        "id": "xy-edge__bbcc3b28-4d24-4374-935e-d9115d7521f8Property Value-73ddaa09-ec81-46f0-aa67-d30798352ff8Selector"
      },
      {
        "source": "73ddaa09-ec81-46f0-aa67-d30798352ff8",
        "sourceHandle": "Web page",
        "target": "31880a1d-90e0-443a-8d70-0887ceb81db5",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__73ddaa09-ec81-46f0-aa67-d30798352ff8Web page-31880a1d-90e0-443a-8d70-0887ceb81db5Web page"
      },
      {
        "source": "4fcd8395-7206-444f-b432-11f1627b40ac",
        "sourceHandle": "Property Value",
        "target": "31880a1d-90e0-443a-8d70-0887ceb81db5",
        "targetHandle": "Selector",
        "animated": true,
        "id": "xy-edge__4fcd8395-7206-444f-b432-11f1627b40acProperty Value-31880a1d-90e0-443a-8d70-0887ceb81db5Selector"
      },
      {
        "source": "31880a1d-90e0-443a-8d70-0887ceb81db5",
        "sourceHandle": "Web page",
        "target": "307ab069-119c-4289-8724-621059fa082b",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__31880a1d-90e0-443a-8d70-0887ceb81db5Web page-307ab069-119c-4289-8724-621059fa082bWeb page"
      },
      {
        "source": "307ab069-119c-4289-8724-621059fa082b",
        "sourceHandle": "Web page",
        "target": "183e2c0a-3c56-4c59-a31b-a7c3bd825469",
        "targetHandle": "Web page",
        "animated": true,
        "id": "xy-edge__307ab069-119c-4289-8724-621059fa082bWeb page-183e2c0a-3c56-4c59-a31b-a7c3bd825469Web page"
      },
      {
        "source": "183e2c0a-3c56-4c59-a31b-a7c3bd825469",
        "sourceHandle": "HTML",
        "target": "5116505a-5e12-47bd-ba8b-e7f67b6b0826",
        "targetHandle": "Body",
        "animated": true,
        "id": "xy-edge__183e2c0a-3c56-4c59-a31b-a7c3bd825469HTML-5116505a-5e12-47bd-ba8b-e7f67b6b0826Body"
      }
    ],
  },
  "explanation": "This workflow opens a browser, navigates to example.com, converts the page to HTML, and then uses AI to extract structured product data including names and prices. The AI extraction includes a detailed prompt specifying the exact data to extract and the expected output format."
}

## Rules:
1. Always start with LAUNCH_BROWSER as the first node
2. use a unique id always use crypto.randomUUID() for node IDs
3. Position nodes with proper spacing: x increases by 450, y increases by 350 for branches
4. Connect ALL nodes with edges using source and target IDs - EVERY node must connect to the next
5. For edges, specify sourceHandle and targetHandle based on exact task definitions:
   - LAUNCH_BROWSER output: "Web page" -> connects to "Web page" input
   - PAGE_TO_HTML outputs: "HTML" (content) or "Web page" (browser state)
   - EXTRACT_TEXT_FROM_ELEMENT: input "Html", output "Extracted Text"
   - EXTRACT_DATA_WITH_AI: inputs "Content", "Credentials", "Prompt"; output "Extracted Data"
   - READ_PROPERTY_FROM_JSON: inputs "JSON", "Property name"; output "Property Value"
   - FILL_INPUT: inputs "Web page", "Selector", "Value"; output "Web page"
   - CLICK_ELEMENT: inputs "Web page", "Selector"; output "Web page"
   - DELIVER_VIA_WEBHOOK: inputs "Target URL", "Body"; no outputs
6. Use appropriate input field names based on the task type specifications above
7. For EXTRACT_DATA_WITH_AI nodes, ALWAYS include a detailed "Prompt" input that specifies:
   - What data to extract (e.g., "Extract product titles, prices, and descriptions")
   - The expected output format (e.g., "Return as JSON array with fields: title, price, description")
   - Any specific instructions (e.g., "Only include products that are in stock")
8. For AI extraction, set "Credentials" to "default" or specific credential ID if provided
9. Only use the available task types listed above
10. Create complete, functional workflows that accomplish the user's goal
11. Ensure proper node spacing for visual clarity: minimum 450px horizontal, 350px vertical spacing
12. CRITICAL: Every edge must have unique IDs and proper source->target connections with matching handles
13. Sequence nodes properly: Browser -> Navigate -> Wait -> Extract -> Process -> Deliver
14. Don't add explanation in the workflow JSON, only in the "explanation" field`


export function generateWorkflowPrompt(userRequest: string, context?: any): string {
  let prompt = `Generate a web scraping workflow for the following request:

"${userRequest}"

`

  if (context?.currentWorkflow) {
    prompt += `Current workflow context:
${JSON.stringify(context.currentWorkflow, null, 2)}

Please modify or extend this workflow based on the request.

`
  }

  prompt += `Return a complete workflow JSON with nodes and edges that accomplishes this task. Make sure to include a clear explanation of what the workflow does.`

  return prompt
}

export function modifyWorkflowPrompt(
  userRequest: string, 
  currentWorkflow: any,
  conversationHistory: any[] = []
): string {
  let prompt = `Modify the following workflow based on this request:

"${userRequest}"

Current workflow:
${JSON.stringify(currentWorkflow, null, 2)}

`

  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5)
    prompt += `Recent conversation context:
${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

`
  }

  prompt += `Return the modified workflow JSON with nodes and edges. Include an explanation of the changes made.`

  return prompt
}
