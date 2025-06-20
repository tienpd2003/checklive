const { execSync } = require('child_process');
const path = require('path');

async function installChrome() {
  try {
    console.log('🔍 Checking environment...');
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log('⏭️ Skipping Chrome installation in development');
      return;
    }
    
    console.log('🚀 Production environment detected, installing Chrome...');
    
    // Install Chrome using puppeteer
    try {
      console.log('📦 Installing Chrome via Puppeteer...');
      execSync('npx puppeteer browsers install chrome', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      console.log('✅ Chrome installation completed successfully!');
    } catch (error) {
      console.error('❌ Chrome installation failed:', error.message);
      console.log('🔄 Attempting alternative installation method...');
      
      // Fallback: try without npx
      try {
        execSync('./node_modules/.bin/puppeteer browsers install chrome', { 
          stdio: 'inherit',
          timeout: 300000
        });
        console.log('✅ Chrome installation completed with fallback method!');
      } catch (fallbackError) {
        console.error('❌ Fallback installation also failed:', fallbackError.message);
        console.log('⚠️ Chrome installation failed, browser automation may not work in production');
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    // Don't fail the build, just warn
    console.log('⚠️ Chrome installation script failed, continuing build...');
  }
}

installChrome(); 