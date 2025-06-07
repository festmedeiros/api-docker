const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

const logtail = new Logtail(process.env.LOGTAIL_TOKEN, {
  endpoint: process.env.LOGTAIL_URL,
});

logtail.info('teste');

// Criando a instância base com formatação
const baseLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...rest }) => {
      const meta = Object.keys(rest).length ? JSON.stringify(rest) : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${meta}`;
    })
  ),
  transports: [new LogtailTransport(logtail)]
});

// Métodos personalizados
const logger = {
  info: (msg, meta = {}) => baseLogger.info(msg, meta),
  warn: (msg, meta = {}) => baseLogger.warn(msg, meta),
  error: (msg, meta = {}) => baseLogger.error(msg, meta),
  debug: (msg, meta = {}) => baseLogger.debug(msg, meta),
  alert: (msg, meta = {}) => baseLogger.log('alert', msg, meta) // nível customizado (precisa configurar abaixo)
};

// Adicionando nível "alert" (opcional)
baseLogger.levels['alert'] = 0;
baseLogger.add(new winston.transports.Console()); // Adiciona log no console também, se quiser

module.exports = logger;

