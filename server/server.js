process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const db = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`[MTalks API] Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error('Failed to connect to database', { error: err.message });
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});
