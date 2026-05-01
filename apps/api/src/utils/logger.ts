import winston from 'winston';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${String(ts)} [${level}]: ${String(message)}${stack ? `\n${String(stack)}` : ''}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  defaultMeta: { service: 'hotel-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        errors({ stack: true }),
        colorize(),
        isDev ? devFormat : json(),
      ),
    }),
  ],
});
