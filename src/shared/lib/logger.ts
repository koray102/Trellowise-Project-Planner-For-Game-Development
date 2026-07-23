/**
 * Logger Service — Centralized logging for GDS Sync
 *
 * Provides structured, leveled logging to replace scattered console.log/warn/error calls.
 * Each log entry includes a timestamp, source module tag, and log level.
 *
 * Usage:
 *   import { logger } from '@/shared/lib/logger';
 *   logger.info('UserStore', 'User logged in', { userId: '123' });
 *   logger.error('TaskRepo', 'Failed to create task', error);
 *
 * Log Levels (in order of severity):
 *   DEBUG < INFO < WARN < ERROR
 *
 * In production, set LOG_LEVEL to 'warn' or 'error' to reduce noise.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum log level — messages below this are suppressed */
const CURRENT_LOG_LEVEL: LogLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug';

/**
 * Formats a structured log prefix: [HH:MM:SS] [LEVEL] [Module]
 */
function formatPrefix(level: LogLevel, module: string): string {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  return `[${time}] [${level.toUpperCase()}] [${module}]`;
}

/**
 * Determines whether a message at the given level should be logged
 * based on the current minimum log level setting.
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

export const logger = {
  /**
   * Debug-level log — Verbose details for development/troubleshooting.
   * Suppressed in production when LOG_LEVEL > 'debug'.
   */
  debug(module: string, message: string, data?: unknown): void {
    if (!shouldLog('debug')) return;
    console.debug(formatPrefix('debug', module), message, data ?? '');
  },

  /**
   * Info-level log — Normal operational events (e.g. "DB initialized", "User switched").
   */
  info(module: string, message: string, data?: unknown): void {
    if (!shouldLog('info')) return;
    console.info(formatPrefix('info', module), message, data ?? '');
  },

  /**
   * Warn-level log — Potentially harmful situations that don't break functionality.
   */
  warn(module: string, message: string, data?: unknown): void {
    if (!shouldLog('warn')) return;
    console.warn(formatPrefix('warn', module), message, data ?? '');
  },

  /**
   * Error-level log — Errors that need attention. Always logged regardless of level.
   * Include the caught error object as `data` for stack trace visibility.
   */
  error(module: string, message: string, data?: unknown): void {
    if (!shouldLog('error')) return;
    console.error(formatPrefix('error', module), message, data ?? '');
  },
};
