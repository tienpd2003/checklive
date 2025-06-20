import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Debug Transfer Context ===');
    
    const { email } = await request.json();
    console.log('Requested email:', email);
    
    // Mirror the exact same checks as transfer-team route
    console.log('🔍 Environment check:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - RENDER:', process.env.RENDER);
    console.log('  - PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    console.log('  - PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR);
    console.log('  - CHROME_BIN:', process.env.CHROME_BIN);
    console.log('  - Current working directory:', process.cwd());
    
    const directPaths = [
      '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
      '/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.70/chrome-linux64/chrome',
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN
    ].filter(Boolean) as string[];
    
    console.log('🔍 Checking direct paths:', directPaths.length, 'paths');
    
    const pathResults = [];
    
    for (let i = 0; i < directPaths.length; i++) {
      const path = directPaths[i];
      console.log(`📍 Checking direct path ${i + 1}/${directPaths.length}:`, path);
      
      try {
        const fs = require('fs');
        const exists = fs.existsSync(path);
        console.log('Path exists:', exists);
        
        const pathResult: any = {
          path,
          exists,
          index: i + 1
        };
        
        if (exists) {
          // Test if executable works
          try {
            const { execSync } = require('child_process');
            const versionOutput = execSync(`"${path}" --version`, { timeout: 5000, stdio: 'pipe' });
            console.log('✅ Chrome executable test successful:', path);
            console.log('Version output:', versionOutput.toString());
            pathResult.executable = true;
            pathResult.version = versionOutput.toString();
          } catch (testError) {
            console.log('❌ Chrome executable test failed:', path, testError);
            pathResult.executable = false;
            pathResult.testError = (testError as Error).message;
          }
        }
        
        pathResults.push(pathResult);
      } catch (error) {
        console.log('❌ Failed to check path:', path, error);
        pathResults.push({
          path,
          exists: false,
          error: (error as Error).message,
          index: i + 1
        });
      }
    }
    
    // Check cache directory dynamically
    const cacheResults: any = {
      baseDirExists: false,
      chromeDirExists: false,
      versions: [],
      contents: []
    };
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      const baseCacheDir = '/opt/render/.cache/puppeteer';
      cacheResults.baseDirExists = fs.existsSync(baseCacheDir);
      
      if (cacheResults.baseDirExists) {
        cacheResults.baseContents = fs.readdirSync(baseCacheDir);
      }
      
      const cacheDir = '/opt/render/.cache/puppeteer/chrome';
      cacheResults.chromeDirExists = fs.existsSync(cacheDir);
      
      if (cacheResults.chromeDirExists) {
        const allContents = fs.readdirSync(cacheDir);
        cacheResults.contents = allContents;
        cacheResults.versions = allContents.filter((dir: string) => dir.startsWith('linux-'));
        
        // Check each version
        for (const version of cacheResults.versions) {
          const versionDir = path.join(cacheDir, version);
          const chromePath = path.join(versionDir, 'chrome-linux64', 'chrome');
          
          cacheResults[`version_${version}`] = {
            versionDirExists: fs.existsSync(versionDir),
            chromeExecutableExists: fs.existsSync(chromePath),
            versionDirContents: fs.existsSync(versionDir) ? fs.readdirSync(versionDir) : []
          };
        }
      }
    } catch (error) {
      cacheResults.error = (error as Error).message;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Transfer context debug completed',
      data: {
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          RENDER: process.env.RENDER,
          PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
          PUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR,
          CHROME_BIN: process.env.CHROME_BIN,
          cwd: process.cwd()
        },
        pathResults,
        cacheResults,
        requestEmail: email
      }
    });

  } catch (error) {
    console.error('Transfer context debug error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Transfer context debug failed: ' + (error as Error).message
    }, { status: 500 });
  }
} 