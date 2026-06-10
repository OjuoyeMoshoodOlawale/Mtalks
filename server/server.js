process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const app    = require('./src/app');
const logger = require('./src/utils/logger');
const db     = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established');

    const server = app.listen(PORT, () => {
      logger.info(`[MTalks API] Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n  Port ${PORT} is already in use.\n`);
        console.error(`  Kill the existing process with:\n`);
        console.error(`    Windows:  for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`);
        console.error(`    Mac/Linux: kill -9 $(lsof -ti :${PORT})\n`);
        console.error(`  Then run:   node server.js\n`);
        process.exit(1);
      } else {
        logger.error('Server error', { error: err.message });
        process.exit(1);
      }
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
