/**
 * Pino-based structured JSON logger implementation
 * Supports correlation IDs and child context
 */

import pino from "pino";
import type { ILogger } from "./types.js";

/**
 * Pino logger configuration options
 */
export interface PinoLoggerOptions {
  level?: string;
  write?: (chunk: string) => void;
  pretty?: boolean;
}

/**
 * PinoLogger implementation
 * Wraps pino logger to implement ILogger interface
 */
export class PinoLogger implements ILogger {
  private readonly pinoLogger: pino.Logger;

  constructor(options: PinoLoggerOptions = {}) {
    const { level = "info", write, pretty = false } = options;

    const pinoOptions: pino.LoggerOptions = {
      level,
    };

    if (write) {
      // Custom write stream for testing
      const stream = {
        write: (chunk: string): void => {
          write(chunk);
        },
      };
      this.pinoLogger = pino(pinoOptions, stream);
    } else if (pretty) {
      // Pretty print for development
      this.pinoLogger = pino(pinoOptions, pino.destination({ sync: false }));
    } else {
      // Standard JSON output
      this.pinoLogger = pino(pinoOptions);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.debug(context || {}, message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.info(context || {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.warn(context || {}, message);
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const logContext: Record<string, unknown> = { ...context };
    if (error) {
      logContext.err = error;
    }
    this.pinoLogger.error(logContext, message);
  }

  child(context: Record<string, unknown>): ILogger {
    const childLogger = this.pinoLogger.child(context);
    return new PinoLoggerWrapper(childLogger);
  }
}

/**
 * Wrapper for pino child logger
 * Allows child loggers to also implement ILogger interface
 */
class PinoLoggerWrapper implements ILogger {
  private readonly pinoLogger: pino.Logger;

  constructor(pinoLogger: pino.Logger) {
    this.pinoLogger = pinoLogger;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.debug(context || {}, message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.info(context || {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.pinoLogger.warn(context || {}, message);
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const logContext: Record<string, unknown> = { ...context };
    if (error) {
      logContext.err = error;
    }
    this.pinoLogger.error(logContext, message);
  }

  child(context: Record<string, unknown>): ILogger {
    const childLogger = this.pinoLogger.child(context);
    return new PinoLoggerWrapper(childLogger);
  }
}

/**
 * Create a default logger instance
 */
export function createLogger(options?: PinoLoggerOptions): ILogger {
  return new PinoLogger(options);
}

