const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(__dirname, '.cache', 'puppeteer'),
  
  // Skip Chromium download for production
  skipDownload: false,
  
  // Default executable path
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
}; 