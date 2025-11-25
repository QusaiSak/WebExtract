import { Browser, Page } from 'puppeteer'

type LogEntry = {
  message: string
  logLevel: string
  timestamp: Date
}

export class Environment {
  private browser?: Browser
  private page?: Page
  private phases: Record<string, any> = {}
  private logs: LogEntry[] = []
  private creditsConsumed: number = 0

  constructor() {
    console.log('🔧 Environment initialized')
  }

  setBrowser(browser: Browser) {
    this.browser = browser
    console.log('🌐 Browser set in environment')
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized')
    }
    return this.browser
  }

  setPage(page: Page) {
    this.page = page
    console.log('📄 Page set in environment')
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page not initialized')
    }
    return this.page
  }

  setPhase(key: string, value: any) {
    this.phases[key] = value
  }

  getPhase(key: string): any {
    return this.phases[key]
  }

  addCredits(credits: number) {
    this.creditsConsumed += credits
    console.log(`💰 Credits consumed: ${this.creditsConsumed}`)
  }

  getCreditsConsumed(): number {
    return this.creditsConsumed
  }

  log = {
    info: (message: string) => {
      const entry = {
        message,
        logLevel: 'info',
        timestamp: new Date(),
      }
      console.log(`ℹ️  [INFO] ${message}`)
      this.logs.push(entry)
    },
    error: (message: string) => {
      const entry = {
        message,
        logLevel: 'error',
        timestamp: new Date(),
      }
      console.error(`❌ [ERROR] ${message}`)
      this.logs.push(entry)
    },
    success: (message: string) => {
      const entry = {
        message,
        logLevel: 'success',
        timestamp: new Date(),
      }
      console.log(`✅ [SUCCESS] ${message}`)
      this.logs.push(entry)
    },
    warning: (message: string) => {
      const entry = {
        message,
        logLevel: 'warning',
        timestamp: new Date(),
      }
      console.warn(`⚠️  [WARNING] ${message}`)
      this.logs.push(entry)
    },
    getAll: (): LogEntry[] => {
      return [...this.logs]
    },
    clear: () => {
      const count = this.logs.length
      this.logs = []
      if (count > 0) {
        console.log(`🧹 Cleared ${count} logs from memory`)
      }
    },
  }

  async cleanup() {
    console.log('🧹 Cleaning up environment...')
    if (this.page) {
      await this.page.close().catch(console.error)
    }
    if (this.browser) {
      await this.browser.close().catch(console.error)
    }
    console.log('✅ Environment cleaned up')
  }
}