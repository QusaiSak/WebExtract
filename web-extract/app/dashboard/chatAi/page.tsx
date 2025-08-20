'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ai/ChatInterface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ChatAiPage = () => {
  const [workflowSavedCount, setWorkflowSavedCount] = useState(0)

  const handleWorkflowSaved = () => {
    setWorkflowSavedCount(prev => prev + 1)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Workflow Generator</h1>
        <p className="text-muted-foreground mt-2">
          Create web scraping workflows by describing what you want to accomplish. 
          {workflowSavedCount > 0 && ` (${workflowSavedCount} workflow${workflowSavedCount > 1 ? 's' : ''} saved)`}
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ChatInterface onWorkflowSaved={handleWorkflowSaved} />
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-primary">Be Specific</p>
                <p className="text-muted-foreground">
                  Mention the website, what data to extract, and any special requirements.
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">Include Examples</p>
                <p className="text-muted-foreground">
                  "Extract product titles and prices from Amazon search results"
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">Review & Edit</p>
                <p className="text-muted-foreground">
                  Use the canvas to visualize and modify your workflow before saving.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sample Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="p-2 bg-muted rounded cursor-pointer hover:bg-muted/80">
                "Create a workflow to scrape product reviews from a website"
              </div>
              <div className="p-2 bg-muted rounded cursor-pointer hover:bg-muted/80">
                "Extract job listings with salary information from job boards"
              </div>
              <div className="p-2 bg-muted rounded cursor-pointer hover:bg-muted/80">
                "Scrape news article headlines and publish dates"
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ChatAiPage