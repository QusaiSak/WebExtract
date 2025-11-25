import { Log, LogCollector, LogFunction, LogLevel, LogLevels } from "./types";

export function createLogCollector(onLog?: (log: Log) => Promise<void>): LogCollector {
  const logs: Log[] = [];

  const getAll = () => logs;

  const logFunctions = {} as Record<LogLevel, LogFunction>;

  LogLevels.forEach(
    (level) =>
      (logFunctions[level] = (message: string) => {
        const log = { level, message, timeStamp: new Date() };
        logs.push(log);
        
        // Call the callback if provided (for real-time broadcasting)
        if (onLog) {
          onLog(log).catch(err => {
            // Silently fail - don't interrupt execution
            console.error('Error in log callback:', err);
          });
        }
      })
  );

  return {
    getAll,
    ...logFunctions,
  };
}
