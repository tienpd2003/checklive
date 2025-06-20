import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export function findChromeExecutable(): string | undefined {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true' || process.cwd().includes('/opt/render/');
  
  console.log('🔍 Finding Chrome executable...');
  console.log('Environment: production =', isProduction, ', render =', isRender);
  
  // If not production, let Puppeteer handle it
  if (!isProduction && !isRender) {
    console.log('Development mode - using default Puppeteer Chrome');
    return undefined;
  }
  
  // List of possible Chrome paths in production/Render
  const possiblePaths = [
    // Environment variable override
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    
    // Puppeteer cache paths (different versions)
    '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-128.0.6613.84/chrome-linux64/chrome', 
    '/opt/render/.cache/puppeteer/chrome/linux-129.0.6668.58/chrome-linux64/chrome',
    '/opt/render/.cache/puppeteer/chrome/linux-130.0.6723.58/chrome-linux64/chrome',
    
    // System Chrome installations
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chrome',
    
    // Local installations
    join(process.cwd(), '.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome'),
    '/home/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome'
  ].filter(Boolean) as string[];
  
  // Try each path
  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        console.log('✅ Found Chrome executable at:', path);
        return path;
      }
    } catch (error) {
      console.log('❌ Failed to check path:', path, error);
    }
  }
  
  // Try to find Chrome using which command
  try {
    const whichChrome = execSync('which google-chrome-stable || which chromium-browser || which chromium || which chrome', { 
      encoding: 'utf8', 
      timeout: 5000 
    }).trim();
    
    if (whichChrome && existsSync(whichChrome)) {
      console.log('✅ Found Chrome using which command:', whichChrome);
      return whichChrome;
    }
  } catch (error) {
    console.log('❌ which command failed:', error);
  }
  
  // Try to list puppeteer cache directory
  try {
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    if (existsSync(cacheDir)) {
      console.log('📁 Puppeteer cache exists at:', cacheDir);
      const chromeDir = join(cacheDir, 'chrome');
      if (existsSync(chromeDir)) {
        console.log('📁 Chrome cache directory exists');
        // Try to find any chrome executable recursively
        try {
          const findResult = execSync(`find ${chromeDir} -name "chrome" -type f -executable 2>/dev/null | head -1`, { 
            encoding: 'utf8', 
            timeout: 5000 
          }).trim();
          
          if (findResult && existsSync(findResult)) {
            console.log('✅ Found Chrome using find command:', findResult);
            return findResult;
          }
        } catch (findError) {
          console.log('❌ find command failed:', findError);
        }
      }
    }
  } catch (error) {
    console.log('❌ Cache directory check failed:', error);
  }
  
  console.log('❌ No Chrome executable found in any known location');
  return undefined;
}

export function getChromeLaunchArgs(): string[] {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=VizDisplayCompositor',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--incognito',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
} 