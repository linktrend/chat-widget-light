class Logger {
  debugModeEnabled: boolean;

  constructor(debugModeEnabled?: boolean) {
    this.debugModeEnabled = !!debugModeEnabled;
  }

  debug(...args: any) {
    if (!this.debugModeEnabled) {
      return;
    }

    console.debug('[AI Light]', ...args);
  }

  log(...args: any) {
    if (!this.debugModeEnabled) {
      return;
    }

    console.log('[AI Light]', ...args);
  }

  info(...args: any) {
    console.info('[AI Light]', ...args);
  }

  warn(...args: any) {
    console.warn('[AI Light]', ...args);
  }

  error(...args: any) {
    console.error('[AI Light]', ...args);
  }
}

export default Logger;
