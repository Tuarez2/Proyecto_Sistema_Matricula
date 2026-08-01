const write = (level, message, detail) => {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] [${level}] ${message}`;

  if (detail) {
    console[level === 'ERROR' ? 'error' : 'log'](output, detail);
    return;
  }

  console[level === 'ERROR' ? 'error' : 'log'](output);
};

const logger = Object.freeze({
  info: (message, detail) => write('INFO', message, detail),
  warn: (message, detail) => write('WARN', message, detail),
  error: (message, detail) => write('ERROR', message, detail)
});

export default logger;
