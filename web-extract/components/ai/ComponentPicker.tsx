'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { TaskType } from '@/lib/types'
import { 
  GlobeIcon, 
  CodeIcon, 
  TextIcon, 
  Edit3Icon, 
  MousePointerClickIcon, 
  ClockIcon, 
  SendIcon, 
  BrainIcon, 
  FileJson2Icon, 
  PlusCircleIcon, 
  NavigationIcon, 
  ScrollIcon,
  Search,
  Plus,
  Sparkles
} from 'lucide-react'

interface ComponentInfo {
  type: TaskType
  name: string
  description: string
  detailedDescription: string
  inputs: string[]
  outputs: string[]
  icon: React.ComponentType<any>
  credits: number
  isEntryPoint?: boolean
  examples: string[]
}

export const COMPONENT_LIBRARY: ComponentInfo[] = [
  {
    type: TaskType.LAUNCH_BROWSER,
    name: 'Launch Browser',
    description: 'Opens a browser and navigates to a URL',
    detailedDescription: 'Starts a new browser session and navigates to the specified website. This is typically the first step in any web scraping workflow.',
    inputs: ['Website Url'],
    outputs: ['Web page'],
    icon: GlobeIcon,
    credits: 5,
    isEntryPoint: true,
    examples: [
      'Open Amazon product page',
      'Navigate to login page',
      'Start scraping from homepage'
    ]
  },
  {
    type: TaskType.PAGE_TO_HTML,
    name: 'Get HTML from Page',
    description: 'Converts the current page to HTML',
    detailedDescription: 'Extracts the HTML content from the current webpage. Useful for getting the raw HTML that can then be processed by other components.',
    inputs: ['Web page'],
    outputs: ['HTML', 'Web page'],
    icon: CodeIcon,
    credits: 2,
    examples: [
      'Get page HTML for AI processing',
      'Extract current page content',
      'Prepare HTML for text extraction'
    ]
  },
  {
    type: TaskType.EXTRACT_TEXT_FROM_ELEMENT,
    name: 'Extract Text from Element',
    description: 'Extracts text from a specific element using CSS selector',
    detailedDescription: 'Uses CSS selectors to find and extract text content from specific HTML elements. Perfect for grabbing titles, prices, descriptions, etc.',
    inputs: ['Html', 'Selector'],
    outputs: ['Extracted Text'],
    icon: TextIcon,
    credits: 2,
    examples: [
      'Extract product title with "h1.product-title"',
      'Get price using ".price" selector',
      'Extract description from ".description"'
    ]
  },
  {
    type: TaskType.EXTRACT_DATA_WITH_AI,
    name: 'Extract Data with AI',
    description: 'Uses AI to extract structured data from HTML',
    detailedDescription: 'Leverages AI to intelligently extract structured data from HTML content. Can extract complex information, handle variations in layout, and return data in specific formats.',
    inputs: ['Content', 'Credentials', 'Prompt'],
    outputs: ['Extracted Data'],
    icon: BrainIcon,
    credits: 3,
    examples: [
      'Extract all products as JSON array',
      'Get contact information from about page',
      'Extract table data into structured format'
    ]
  },
  {
    type: TaskType.FILL_INPUT,
    name: 'Fill Input Field',
    description: 'Fills an input field with specified data',
    detailedDescription: 'Automatically fills form input fields with specified values. Useful for login forms, search boxes, and other interactive elements.',
    inputs: ['Web page', 'Selector', 'Value'],
    outputs: ['Web page'],
    icon: Edit3Icon,
    credits: 2,
    examples: [
      'Fill username field',
      'Enter search query',
      'Fill form data'
    ]
  },
  {
    type: TaskType.CLICK_ELEMENT,
    name: 'Click Element',
    description: 'Clicks on an element using CSS selector',
    detailedDescription: 'Simulates clicking on webpage elements like buttons, links, or other clickable items. Essential for navigating through multi-step processes.',
    inputs: ['Web page', 'Selector'],
    outputs: ['Web page'],
    icon: MousePointerClickIcon,
    credits: 2,
    examples: [
      'Click login button',
      'Click next page button',
      'Click search button'
    ]
  },
  {
    type: TaskType.WAIT_FOR_ELEMENT,
    name: 'Wait for Element',
    description: 'Waits for an element to appear on the page',
    detailedDescription: 'Waits for specific elements to become visible or disappear. Crucial for handling dynamic content, loading states, and ensuring elements are ready before interaction.',
    inputs: ['Web page', 'Selector', 'Visibility'],
    outputs: ['Web page'],
    icon: ClockIcon,
    credits: 1,
    examples: [
      'Wait for search results to load',
      'Wait for login success indicator',
      'Wait for page content to appear'
    ]
  },
  {
    type: TaskType.READ_PROPERTY_FROM_JSON,
    name: 'Read JSON Property',
    description: 'Reads a property from a JSON object',
    detailedDescription: 'Extracts specific properties from JSON data. Useful for accessing nested data or specific fields from structured data returned by AI extraction.',
    inputs: ['JSON', 'Property name'],
    outputs: ['Property Value'],
    icon: FileJson2Icon,
    credits: 1,
    examples: [
      'Get "title" from product JSON',
      'Extract "price" property',
      'Read nested property like "address.city"'
    ]
  },
  {
    type: TaskType.ADD_PROPERTY_TO_JSON,
    name: 'Add JSON Property',
    description: 'Adds a property to a JSON object',
    detailedDescription: 'Adds new properties to existing JSON objects. Useful for enriching data, adding computed values, or combining data from multiple sources.',
    inputs: ['JSON', 'Property name', 'Property value'],
    outputs: ['JSON'],
    icon: PlusCircleIcon,
    credits: 1,
    examples: [
      'Add timestamp to data',
      'Add computed total price',
      'Add source URL to scraped data'
    ]
  },
  {
    type: TaskType.NAVIGATE_URL,
    name: 'Navigate to URL',
    description: 'Navigates to a specific URL',
    detailedDescription: 'Changes the browser location to a new URL. Different from Launch Browser as it uses an existing browser session.',
    inputs: ['Web page', 'URL'],
    outputs: ['Web page'],
    icon: NavigationIcon,
    credits: 2,
    examples: [
      'Navigate to next page',
      'Go to product details page',
      'Navigate to different category'
    ]
  },
  {
    type: TaskType.SCROLL_TO_ELEMENT,
    name: 'Scroll to Element',
    description: 'Scrolls to a specific element on the page',
    detailedDescription: 'Scrolls the page to bring a specific element into view. Useful for infinite scroll pages or when elements need to be visible before interaction.',
    inputs: ['Web page', 'Selector'],
    outputs: ['Web page'],
    icon: ScrollIcon,
    credits: 1,
    examples: [
      'Scroll to load more products',
      'Scroll to specific section',
      'Scroll to trigger lazy loading'
    ]
  },
  {
    type: TaskType.DELIVER_VIA_WEBHOOK,
    name: 'Send to Webhook',
    description: 'Sends extracted data to a webhook URL',
    detailedDescription: 'Delivers the final scraped data to a webhook endpoint. This is typically the final step to send results to your application, database, or external service.',
    inputs: ['Target URL', 'Body'],
    outputs: [],
    icon: SendIcon,
    credits: 1,
    examples: [
      'Send data to your API',
      'Post to webhook.site for testing',
      'Deliver to database endpoint'
    ]
  },
]

interface ComponentPickerProps {
  onComponentSelect: (componentText: string) => void
  trigger?: React.ReactNode
}

export default function ComponentPicker({ onComponentSelect, trigger }: ComponentPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filteredComponents = COMPONENT_LIBRARY.filter(component => {
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.examples.some(example => 
        example.toLowerCase().includes(searchQuery.toLowerCase())
      )
    
    return matchesSearch
  })

  const handleComponentClick = (component: ComponentInfo) => {
    const componentText = `Use ${component.name} to ${component.description.toLowerCase()}`
    onComponentSelect(componentText)
    setIsOpen(false)
  }

  const handleExampleClick = (example: string) => {
    onComponentSelect(example)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Components
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mb-4 border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Available Components
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components or examples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="grid gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.type} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <component.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{component.name}</h3>
                      <div className="flex items-center gap-2">
                        {component.isEntryPoint && (
                          <Badge variant="secondary">Entry Point</Badge>
                        )}
                        <Badge variant="outline">{component.credits} credits</Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {component.detailedDescription}
                    </p>
                    
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="font-medium">Inputs:</span> {component.inputs.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Outputs:</span> {component.outputs.length > 0 ? component.outputs.join(', ') : 'None'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComponentClick(component)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Component
                      </Button>
                      
                      {component.examples.map((example, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExampleClick(example)}
                          className="h-8 text-xs text-blue-600 hover:text-blue-800"
                        >
                          "{example}"
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
