const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function installChrome() {
  try {
    console.log('🔍 Checking environment...');
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER === 'true' || process.cwd().includes('/opt/render/');
    
    if (!isProduction && !isRender) {
      console.log('⏭️ Skipping Chrome installation in development');
      return;
    }
    
    console.log('🚀 Production/Render environment detected, installing Chrome...');
    
    // Check if Chrome is already installed
    const puppeteerCachePath = process.env.PUPPETEER_CACHE_DIR || path.join(process.cwd(), '.cache', 'puppeteer');
    console.log('📁 Puppeteer cache path:', puppeteerCachePath);
    
    // Install Chrome using puppeteer
    try {
      console.log('📦 Installing Chrome via Puppeteer...');
      execSync('npx puppeteer browsers install chrome', { 
        stdio: 'inherit',
        timeout: 600000, // 10 minutes timeout for Render
        env: {
          ...process.env,
          PUPPETEER_CACHE_DIR: puppeteerCachePath
        }
      });
      console.log('✅ Chrome installation completed successfully!');
      
      // Verify installation
      if (fs.existsSync(puppeteerCachePath)) {
        const cacheContents = fs.readdirSync(puppeteerCachePath, { recursive: true });
        console.log('📂 Cache contents after installation:', cacheContents.slice(0, 5));
      }
      
    } catch (error) {
      console.error('❌ Chrome installation failed:', error.message);
      console.log('🔄 Attempting alternative installation methods...');
      
      // Fallback 1: try without npx
      try {
        console.log('🔄 Trying direct puppeteer binary...');
        execSync('./node_modules/.bin/puppeteer browsers install chrome', { 
          stdio: 'inherit',
          timeout: 600000,
          env: {
            ...process.env,
            PUPPETEER_CACHE_DIR: puppeteerCachePath
          }
        });
        console.log('✅ Chrome installation completed with fallback method 1!');
      } catch (fallbackError1) {
        console.error('❌ Fallback 1 failed:', fallbackError1.message);
        
        // Fallback 2: try with explicit chrome install
        try {
          console.log('🔄 Trying explicit chrome download...');
          execSync('npx puppeteer browsers install chrome@stable', { 
            stdio: 'inherit',
            timeout: 600000,
            env: {
              ...process.env,
              PUPPETEER_CACHE_DIR: puppeteerCachePath
            }
          });
          console.log('✅ Chrome installation completed with fallback method 2!');
        } catch (fallbackError2) {
          console.error('❌ All installation methods failed:', fallbackError2.message);
          console.log('⚠️ Chrome installation failed, browser automation may not work in production');
          
          // Try to install system Chrome as last resort
          try {
            console.log('🔄 Attempting system Chrome installation...');
            execSync('apt-get update && apt-get install -y chromium-browser', { 
              stdio: 'inherit',
              timeout: 600000
            });
            console.log('✅ System Chrome installed as fallback!');
          } catch (systemError) {
            console.error('❌ System Chrome installation also failed:', systemError.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    // Don't fail the build, just warn
    console.log('⚠️ Chrome installation script failed, continuing build...');
  }
}

installChrome(); 