/**
 * API Test Script
 * This script tests all the AI workflow endpoints to ensure they work correctly
 */

const testWorkflow = {
  nodes: [
    {
      id: '1',
      type: 'LaunchBrowser',
      position: { x: 0, y: 0 },
      data: {
        type: 'LaunchBrowser',
        websiteUrl: 'https://example.com'
      }
    },
    {
      id: '2',
      type: 'PageToHtml',
      position: { x: 300, y: 0 },
      data: {
        type: 'PageToHtml'
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2'
    }
  ]
}

async function testEndpoints() {
  console.log('🧪 Testing AI Workflow API Endpoints...\n')

  // Test 1: Create a conversation with AI chat
  console.log('1. Testing AI Chat Endpoint...')
  try {
    const chatResponse = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create a simple web scraper for extracting product titles from an e-commerce site'
      })
    })
    
    if (chatResponse.ok) {
      console.log('✅ AI Chat endpoint working')
      const reader = chatResponse.body?.getReader()
      if (reader) {
        // Read first chunk to verify streaming
        const { value } = await reader.read()
        console.log('✅ Streaming response detected')
      }
    } else {
      console.log('❌ AI Chat endpoint failed:', await chatResponse.text())
    }
  } catch (error) {
    console.log('❌ AI Chat endpoint error:', error)
  }

  console.log('\n2. Testing Workflow Save Endpoint...')
  try {
    const saveResponse = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Workflow',
        description: 'A test workflow for API validation',
        definition: JSON.stringify(testWorkflow)
      })
    })
    
    if (saveResponse.ok) {
      const savedWorkflow = await saveResponse.json()
      console.log('✅ Workflow save endpoint working')
      console.log(`   Saved workflow ID: ${savedWorkflow.id}`)
      
      // Test 3: Execute the saved workflow
      console.log('\n3. Testing Workflow Execute Endpoint...')
      const executeResponse = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-token'
        },
        body: JSON.stringify({ workflowId: savedWorkflow.id })
      })
      
      if (executeResponse.ok) {
        const execution = await executeResponse.json()
        console.log('✅ Workflow execute endpoint working')
        console.log(`   Execution ID: ${execution.executionId}`)
      } else {
        console.log('❌ Workflow execute endpoint failed:', await executeResponse.text())
      }
      
    } else {
      console.log('❌ Workflow save endpoint failed:', await saveResponse.text())
    }
  } catch (error) {
    console.log('❌ Workflow save/execute endpoint error:', error)
  }

  // Test 4: List workflows
  console.log('\n4. Testing Workflow List Endpoint...')
  try {
    const listResponse = await fetch('/api/workflows')
    
    if (listResponse.ok) {
      const workflows = await listResponse.json()
      console.log('✅ Workflow list endpoint working')
      console.log(`   Found ${workflows.length} workflow(s)`)
    } else {
      console.log('❌ Workflow list endpoint failed:', await listResponse.text())
    }
  } catch (error) {
    console.log('❌ Workflow list endpoint error:', error)
  }

  console.log('\n🏁 API Testing Complete!')
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAIWorkflowAPIs = testEndpoints
  console.log('Test function loaded. Run window.testAIWorkflowAPIs() in console.')
} else {
  // Node environment
  testEndpoints()
}

export { testEndpoints }
