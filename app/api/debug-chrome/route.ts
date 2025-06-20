import { NextResponse } from 'next/server';
import { findChromeExecutable } from '@/app/utils/chrome-finder';
import { existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const debugInfo: any = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        RENDER: process.env.RENDER,
        cwd: process.cwd(),
        isRender: process.cwd().includes('/opt/render/'),
        PUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR,
        PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
        CHROME_BIN: process.env.CHROME_BIN
      },
      chromeExecutable: null,
      cacheDirectoryExists: false,
      cacheContents: [],
      systemCommands: {}
    };

    // Find Chrome executable
    debugInfo.chromeExecutable = findChromeExecutable();

    // Check cache directory
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    debugInfo.cacheDirectoryExists = existsSync(cacheDir);
    
    if (debugInfo.cacheDirectoryExists) {
      try {
        debugInfo.cacheContents = readdirSync(cacheDir, { recursive: true });
      } catch (error) {
        debugInfo.cacheContents = ['Error reading directory: ' + error];
      }
    }

    // Test system commands
    const commands = [
      'which google-chrome-stable',
      'which chromium-browser', 
      'which chromium',
      'which chrome',
      'ls -la /usr/bin/chrome*',
      'ls -la /usr/bin/chromium*'
    ];

    for (const cmd of commands) {
      try {
        debugInfo.systemCommands[cmd] = execSync(cmd, { 
          encoding: 'utf8', 
          timeout: 5000 
        }).trim();
      } catch (error) {
        debugInfo.systemCommands[cmd] = 'Command failed: ' + (error as Error).message;
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Chrome debug information',
      data: debugInfo
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Debug failed: ' + (error as Error).message
    }, { status: 500 });
  }
} 