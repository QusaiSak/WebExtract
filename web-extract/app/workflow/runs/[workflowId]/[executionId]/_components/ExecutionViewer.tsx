'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import {
  CircleDashedIcon,
  ClockIcon,
  CoinsIcon,
  Loader2Icon,
  WorkflowIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  PlayCircleIcon,
  ClockIcon as PendingIcon,
  StopCircleIcon,
  type LucideIcon,
  TerminalIcon,
  Copy as CopyIcon,
  Eye,
  EyeOff,
  BarChart3Icon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExecutionLog {
  id: string
  message: string
  logLevel: string
  timestamp: Date
  executionPhaseId: string
}

interface ExecutionPhase {
  id: string
  name: string
  status: string
  startedAt: Date | null
  completedAt: Date | null
  creditsConsumed: number | null
  inputs?: string | null
  outputs?: string | null
  logs?: ExecutionLog[]
}

interface ExecutionData {
  id: string
  workflowId: string
  status: string
  startedAt: Date | null
  completedAt: Date | null
  phases: ExecutionPhase[]
}

// Enhanced Status badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    COMPLETED: { icon: CheckCircle2Icon, color: 'text-green-600', bg: 'bg-green-100/20 border-green-200/30', label: 'Completed' },
    RUNNING: { icon: Loader2Icon, color: 'text-blue-600', bg: 'bg-blue-100/20 border-blue-200/30', label: 'Running' },
    FAILED: { icon: AlertCircleIcon, color: 'text-red-600', bg: 'bg-red-100/20 border-red-200/30', label: 'Failed' },
    PENDING: { icon: PendingIcon, color: 'text-amber-600', bg: 'bg-amber-100/20 border-amber-200/30', label: 'Pending' },
    CREATED: { icon: CircleDashedIcon, color: 'text-slate-600', bg: 'bg-slate-100/20 border-slate-200/30', label: 'Created' },
  }

  const config = statusConfig[status] || statusConfig.CREATED
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${config.bg}`}>
      <Icon className={`${config.color} h-3.5 w-3.5 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      <span className={`text-[11px] font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

const ParameterViewer = memo(function ParameterViewer({ 
  title, 
  subTitle, 
  paramsJSON 
}: { 
  title: string; 
  subTitle: string; 
  paramsJSON: string | null 
}) {
  const params = useMemo(() => {
    if (!paramsJSON) return undefined;
    try {
      return JSON.parse(paramsJSON);
    } catch (error) {
      console.error('Failed to parse params:', error);
      return undefined;
    }
  }, [paramsJSON]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const toggleReveal = useCallback((key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <Card className="bg-card border overflow-hidden group">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-foreground">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
            <TerminalIcon className="w-4 h-4" />
          </div>
          {title}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                if (!params) return;
                const keys = Object.keys(params);
                setExpanded(keys.reduce((acc, k) => ({ ...acc, [k]: true }), {}));
              }}
            >
              Expand all
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setExpanded({})}
            >
              Collapse all
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{subTitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y">
          {(!params || Object.keys(params).length === 0) && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                <CircleDashedIcon className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">No parameters generated</p>
            </div>
          )}
          
          {params && Object.entries(params).map(([key, value]) => {
            const raw = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            const isLong = raw.length > 300 || raw.split('\n').length > 8;
            const isOpen = !!expanded[key];
            const isSensitive = /token|secret|password|credential|key/i.test(key);
            const contentRaw = isSensitive && !revealed[key] ? '••••••••••' : raw;
            const display = isOpen ? contentRaw : contentRaw.slice(0, 300);
            return (
              <div key={key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground tracking-wider">{key}</p>
                  <div className="flex items-center gap-1">
                    {isSensitive && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => toggleReveal(key)}>
                        {revealed[key] ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        {revealed[key] ? 'Hide' : 'Reveal'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => navigator.clipboard.writeText(raw)}
                    >
                      <CopyIcon className="w-3.5 h-3.5 mr-1" />Copy
                    </Button>
                    {isLong && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => toggleExpand(key)}
                      >
                        {isOpen ? 'Show less' : 'Show more'}
                      </Button>
                    )}
                  </div>
                </div>
                <pre className={cn(
                  "text-foreground font-mono bg-muted px-3 py-2 rounded-md border border-border text-left whitespace-pre-wrap break-words",
                  !isOpen && isLong ? "max-h-36 overflow-hidden" : "max-h-[50vh] overflow-auto"
                )}>
                  {display}
                  {!isOpen && isLong && contentRaw.length > display.length && (
                    <span className="text-muted-foreground">…</span>
                  )}
                </pre>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
});

const LogViewer = memo(function LogViewer({ logs, isConnected }: { logs: ExecutionLog[] | undefined, isConnected?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <Card className="bg-slate-950 border-white/10 h-full flex items-center justify-center min-h-[300px] shadow-2xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto border border-white/10 shadow-inner relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse"></div>
            <TerminalIcon className="w-8 h-8 text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-slate-300 font-medium text-lg">Waiting for Execution</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Logs will stream here in real-time once the workflow begins processing.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border h-full min-h-[360px] flex flex-col overflow-hidden rounded-lg">
      <CardHeader className="py-2.5 px-4 border-b flex flex-row items-center justify-between sticky top-0 z-10 bg-muted/30">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Logs</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />}
          <Badge variant="outline" className="text-muted-foreground text-[11px] h-6">
            {logs.length} lines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 font-mono text-sm relative">
        <div 
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto p-4 space-y-0.5"
        >
          {logs.map((log, index) => (
            <div key={index} className="flex gap-3 group px-2 py-1 rounded-sm border-l-2"
              style={{ borderLeftColor: log.logLevel === 'ERROR' ? '#ef4444' : log.logLevel === 'WARNING' ? '#f59e0b' : log.logLevel === 'INFO' ? '#60a5fa' : '#64748b' }}
            >
              <span className="text-slate-600 select-none w-[70px] flex-shrink-0 text-[10px] pt-[2px] opacity-50">
                {new Date(log.timestamp).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(' ')[0]}
              </span>
              <div className={cn(
                "flex-1 break-words leading-relaxed",
                log.logLevel === 'ERROR' ? "text-red-400" :
                log.logLevel === 'WARNING' ? "text-amber-400" :
                log.logLevel === 'INFO' ? "text-blue-300" :
                "text-slate-400"
              )}>
                <span className={cn(
                  "inline-block mr-2 text-[11px] font-semibold tracking-wider uppercase",
                  log.logLevel === 'ERROR' ? "text-red-500" :
                  log.logLevel === 'WARNING' ? "text-amber-500" :
                  log.logLevel === 'INFO' ? "text-blue-500" :
                  "text-slate-600"
                )}>
                  [{log.logLevel}]
                </span>
                {log.message}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Main ExecutionViewer Component
function ExecutionViewer({ initialData }: { initialData: ExecutionData }) {
  const router = useRouter()
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [realTimeLogs, setRealTimeLogs] = useState<ExecutionLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const [executionData, setExecutionData] = useState<ExecutionData>(initialData)
  const [selectedPhaseData, setSelectedPhaseData] = useState<ExecutionPhase | null>(null)
  const triggeredDownloadsRef = useRef<Record<string, string>>({})

  const isRunning = executionData?.status === 'RUNNING' || executionData?.status === 'PENDING'

  // Stop execution handler
  const handleStopExecution = async () => {
    try {
      setIsStopping(true)
      toast.loading('Stopping execution...', { id: 'stop-execution' })

      const response = await fetch(`/api/workflows/executions/${executionData.id}/stop`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to stop execution')
      }

      toast.success('Execution stopped', { id: 'stop-execution' })
      
      // Refresh data
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Failed to stop execution:', error)
      toast.error(error.message || 'Failed to stop execution', { id: 'stop-execution' })
    } finally {
      setIsStopping(false)
    }
  }

  // Poll for execution updates
  useEffect(() => {
    if (!isRunning) return

    const poll = async () => {
      if (document.hidden) return // Skip polling if tab is not visible
      
      try {
        const res = await fetch(`/api/workflows/executions/${initialData.id}`)
        if (res.ok) {
          const data = await res.json()
          setExecutionData(data)
        }
      } catch (error) {
        console.error('Failed to fetch execution updates:', error)
      }
    }

    const interval = setInterval(poll, 2000)

    return () => clearInterval(interval)
  }, [isRunning, initialData.id])

  const fetchPhaseDetails = useCallback((phaseId: string) => {
    const phase = executionData.phases.find((p) => p.id === phaseId)
    setSelectedPhaseData(phase || null)
  }, [executionData.phases])

  const connectToPhase = useCallback(
    (phaseId: string) => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }

        setRealTimeLogs([])
        console.log(`🔌 Connecting to logs for phase: ${phaseId}`)
        
        const eventSource = new EventSource(`/api/ws?phaseId=${phaseId}`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          setIsConnected(true)
          console.log('✅ Connected to log stream')
        }

        eventSource.onmessage = (event) => {
          try {
            if (event.data.startsWith(':')) return
            
            const logData = JSON.parse(event.data)
            console.log('📨 Received log:', logData)
            
            if (logData.type === 'log' && logData.message) {
              setRealTimeLogs((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  message: logData.message,
                  logLevel: logData.logLevel || 'info',
                  timestamp: new Date(logData.timestamp),
                  executionPhaseId: phaseId,
                },
              ])
            }
          } catch (err) {
            console.error('Error parsing log:', err)
          }
        }

        eventSource.onerror = (error) => {
          console.error('❌ EventSource error:', error)
          setIsConnected(false)
          eventSource.close()
          
          if (isRunning) {
            console.log('♻️ Reconnecting in 3s...')
            setTimeout(() => connectToPhase(phaseId), 3000)
          }
        }
      } catch (err) {
        console.error('Error connecting to logs:', err)
      }
    },
    [isRunning]
  )

  useEffect(() => {
    if (selectedPhase) {
      fetchPhaseDetails(selectedPhase)
      if (isRunning) {
        connectToPhase(selectedPhase)
      }
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [selectedPhase, isRunning, fetchPhaseDetails, connectToPhase])

  // Auto-download when "Auto Download" output is available
  useEffect(() => {
    if (!selectedPhaseData?.outputs) return
    let outputsObj: Record<string, any> | null = null
    try {
      outputsObj = typeof selectedPhaseData.outputs === 'string'
        ? JSON.parse(selectedPhaseData.outputs)
        : (selectedPhaseData.outputs as any)
    } catch {
      outputsObj = null
    }
    const autoUrl = outputsObj?.['Auto Download'] as string | undefined
    if (!autoUrl) return
    const phaseId = selectedPhaseData.id
    // Avoid repeated triggers for the same phase/url
    if (triggeredDownloadsRef.current[phaseId] === autoUrl) return

    try {
      const a = document.createElement('a')
      a.href = autoUrl
      a.rel = 'noopener'
      // Let server-side headers set filename; using same-tab click to avoid popup blockers
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      triggeredDownloadsRef.current[phaseId] = autoUrl
      toast.success('Download started')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to trigger download')
    }
  }, [selectedPhaseData?.outputs, selectedPhaseData?.id])

  useEffect(() => {
    const phases = executionData?.phases || []
    if (!selectedPhase && phases.length > 0) {
      // Auto-select first RUNNING phase, or first phase
      const runningPhase = phases.find((p) => p.status === 'RUNNING')
      const targetPhase = runningPhase || phases[0]
      setSelectedPhase(targetPhase.id)
    }
  }, [executionData?.phases, selectedPhase])

  const completedPhases = executionData.phases.filter((p) => p.status === 'COMPLETED').length
  const totalPhases = executionData.phases.length
  const creditsTotal = executionData.phases.reduce((sum, p) => sum + (p.creditsConsumed || 0), 0)

  return (
    <div className="flex h-full w-full gap-4">
      {/* Left Sidebar - Glassmorphism */}
      <aside className="w-80 glass-card rounded-2xl flex flex-col overflow-hidden flex-shrink-0 border border-white/20 dark:border-white/10">
        <div className="p-5 border-b border-white/10 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold gradient-text">Execution</h2>
            <StatusBadge status={executionData.status} />
          </div>

          {/* Show stop button when RUNNING or PENDING */}
          {(executionData.status === 'RUNNING' || executionData.status === 'PENDING') && (
            <Button
              onClick={handleStopExecution}
              disabled={isStopping}
              variant="destructive"
              className="w-full shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all"
              size="sm"
            >
              {isStopping ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <StopCircleIcon className="h-4 w-4 mr-2" />
                  Stop Execution
                </>
              )}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
              <p className="text-[10px] text-blue-500 font-medium mb-0.5 uppercase tracking-wider">Started</p>
              <p className="text-xs font-bold text-foreground truncate">
                {executionData.startedAt
                  ? formatDistanceToNow(new Date(executionData.startedAt), { addSuffix: true })
                  : 'Not started'}
              </p>
            </div>
            <div className="bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
              <p className="text-[10px] text-purple-500 font-medium mb-0.5 uppercase tracking-wider">Duration</p>
              <p className="text-xs font-bold text-foreground truncate">
                {executionData.completedAt && executionData.startedAt
                  ? `${Math.round((new Date(executionData.completedAt).getTime() - new Date(executionData.startedAt).getTime()) / 1000)}s`
                  : isRunning ? 'Running...' : '-'}
              </p>
            </div>
            <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
              <p className="text-[10px] text-amber-500 font-medium mb-0.5 uppercase tracking-wider">Credits</p>
              <p className="text-xs font-bold text-foreground">{creditsTotal}</p>
            </div>
            <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
              <p className="text-[10px] text-green-500 font-medium mb-0.5 uppercase tracking-wider">Progress</p>
              <p className="text-xs font-bold text-foreground">{completedPhases}/{totalPhases}</p>
            </div>
          </div>

          {totalPhases > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>Phases</span>
                <span>{Math.round((completedPhases / totalPhases) * 100)}%</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-2 overflow-hidden border border-black/5 dark:border-white/5">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${(completedPhases / totalPhases) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-b border-white/10 bg-black/5 dark:bg-white/5 flex-shrink-0">
          <h3 className="font-semibold text-xs flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <WorkflowIcon className="h-3.5 w-3.5" />
            Workflow Phases
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-2 p-3">
            {executionData.phases.map((phase, index) => (
              <button
                key={phase.id}
                onClick={() => {
                  setSelectedPhase(phase.id)
                  setRealTimeLogs([])
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
                  selectedPhase === phase.id
                    ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/5'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      selectedPhase === phase.id 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'bg-black/5 dark:bg-white/10 text-muted-foreground group-hover:bg-black/10 dark:group-hover:bg-white/20'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-xs truncate transition-colors ${
                        selectedPhase === phase.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      }`}>{phase.name}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate">
                        {phase.startedAt 
                          ? formatDistanceToNow(new Date(phase.startedAt), { addSuffix: true })
                          : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <div className="scale-90 origin-right">
                    <StatusBadge status={phase.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content - Glassmorphism */}
      <main className="flex-1 rounded-lg overflow-hidden flex flex-col min-w-0 border bg-card">
        {selectedPhaseData ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 space-y-6 flex-shrink-0">
              <div className="space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold">{selectedPhaseData.name}</h1>
                  <StatusBadge status={selectedPhaseData.status} />
                </div>
                <div className="flex items-center gap-6 text-xs text-muted-foreground p-3 rounded-md border w-fit">
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-foreground">{selectedPhaseData.creditsConsumed || 0}</span>
                    <span>credits</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  {selectedPhaseData.startedAt && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-blue-500" />
                      <span>{formatDistanceToNow(new Date(selectedPhaseData.startedAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            <Separator className="flex-shrink-0 bg-border/50" />
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {selectedPhaseData.inputs && (
                  <ParameterViewer
                    title="Inputs"
                    subTitle="Input parameters"
                    paramsJSON={selectedPhaseData.inputs}
                  />
                )}

                {selectedPhaseData.outputs && (
                  <ParameterViewer
                    title="Outputs"
                    subTitle="Generated output"
                    paramsJSON={selectedPhaseData.outputs}
                  />
                )}
              </div>

              {/* Visualization Section */}
              {(() => {
                try {
                  const outputsObj = typeof selectedPhaseData?.outputs === 'string'
                    ? JSON.parse(selectedPhaseData?.outputs || '{}')
                    : (selectedPhaseData?.outputs as any) || {}
                  
                  const vizConfigStr = outputsObj?.['Visualization Config']
                  if (!vizConfigStr) return null
                  
                  const vizConfig = JSON.parse(vizConfigStr)
                  const { type, data, config, title, description } = vizConfig
                  
                  // Dynamic import for Recharts components to avoid SSR issues
                  const { 
                    BarChart, Bar, LineChart, Line, PieChart, Pie, 
                    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
                    ResponsiveContainer, Cell, ScatterChart, Scatter
                  } = require('recharts')

                  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

                  return (
                    <div className="mx-6 mb-6 p-6 rounded-xl border bg-card shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3Icon className="w-5 h-5 text-primary" />
                          {title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>

                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {type === 'bar' || type === 'column' ? (
                            <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey={config.xAxis} fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                              />
                              <Legend />
                              <Bar dataKey={config.yAxis} fill="#8884d8" radius={[4, 4, 0, 0]}>
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : type === 'pie' || type === 'doughnut' ? (
                            <PieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey={config.yAxis}
                                nameKey={config.label}
                              >
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          ) : type === 'scatter' ? (
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" dataKey={config.xAxis} name="X" />
                              <YAxis type="number" dataKey={config.yAxis} name="Y" />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Legend />
                              <Scatter name="Data" data={data} fill="#8884d8">
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          ) : (
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey={config.xAxis} fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey={config.yAxis} stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                } catch (e) {
                  console.error('Failed to render visualization:', e)
                  return null
                }
              })()}

              {/* Manual download action when auto URL exists */}
              {(() => {
                try {
                  const outputsObj = typeof selectedPhaseData?.outputs === 'string'
                    ? JSON.parse(selectedPhaseData?.outputs || '{}')
                    : (selectedPhaseData?.outputs as any) || {}
                  const autoUrl = outputsObj?.['Auto Download']
                  if (!autoUrl) return null
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 mx-6">
                      <Button size="sm" variant="outline" className="border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500" onClick={() => {
                        const a = document.createElement('a')
                        a.href = autoUrl
                        a.rel = 'noopener'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        toast.info('Download triggered')
                      }}>
                        Download File
                      </Button>
                      <span className="text-xs text-muted-foreground">Auto Download URL available</span>
                    </div>
                  )
                } catch {
                  return null
                }
              })()}

              <div className="p-6">
                <LogViewer
                  logs={realTimeLogs.length > 0 ? realTimeLogs : selectedPhaseData.logs || []}
                  isConnected={isConnected}
                />
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 backdrop-blur-sm">
              <WorkflowIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">No phase selected</p>
              <p className="text-sm text-muted-foreground mt-1">Select a phase from the sidebar to view details</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ExecutionViewer
