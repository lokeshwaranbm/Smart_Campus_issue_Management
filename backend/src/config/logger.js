import winston from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const prettyConsole = printf(({ level, message, timestamp: ts, stack }) => {
  if (stack) return `${ts} [${level}] ${stack}`;
  return `${ts} [${level}] ${message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'smart-campus-backend' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), prettyConsole),
    }),
  ],
});
