import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { getCanvaVerificationCode } from '@/app/utils/gmail';
import { findChromeExecutable, getChromeLaunchArgs } from '@/app/utils/chrome-finder';

// Cấu hình Google OAuth2 credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SHEET_ID = process.env.SHEET_ID;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Lấy thông tin tài khoản mới nhất từ sheet ADMIN FAM CANVA
async function getLatestTeamCredentials() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'ADMIN FAM CANVA!A:G',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return null; // Nếu chỉ có header hoặc không có dữ liệu

    // Lấy dòng cuối cùng có dữ liệu
    let lastDataRow = null;
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i] && rows[i][1] && rows[i][2]) { // Kiểm tra có tài khoản và mật khẩu
        lastDataRow = rows[i];
        break;
      }
    }

    if (!lastDataRow) return null;

    return {
      account: lastDataRow[1], // TÀI KHOẢN ở cột B (index 1)
      password: lastDataRow[2], // PASS ở cột C (index 2)
    };
  } catch (error) {
    console.error('Error getting latest team credentials:', error);
    throw error;
  }
}

// Hàm tự động chuyển team sử dụng Puppeteer
async function automateTeamTransfer(email: string, credentials: { account: string; password: string }) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('Launching browser for environment:', isProduction ? 'production' : 'development');
  
  // HARDCODED CHROME PATH - Using working path from debug-chrome endpoint
  console.log('🎯 Using hardcoded Chrome path from successful debug results...');
  const WORKING_CHROME_PATH = '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome';
  
  console.log('🔍 Environment check:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - RENDER:', process.env.RENDER);
  console.log('  - PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
  console.log('  - PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR);
  console.log('  - CHROME_BIN:', process.env.CHROME_BIN);
  console.log('  - Current working directory:', process.cwd());
  console.log('  - HARDCODED_CHROME_PATH:', WORKING_CHROME_PATH);
  
  let chromeExecutable: string | undefined = undefined;
  
  // First try the hardcoded path that we know works
  try {
    const fs = require('fs');
    if (fs.existsSync(WORKING_CHROME_PATH)) {
      console.log('✅ Hardcoded Chrome path exists:', WORKING_CHROME_PATH);
      chromeExecutable = WORKING_CHROME_PATH;
    } else {
      console.log('❌ Hardcoded Chrome path does not exist, trying fallbacks...');
    }
  } catch (error) {
    console.log('❌ Error checking hardcoded path:', error);
  }
  
  // Fallback search if hardcoded path fails
  if (!chromeExecutable) {
    console.log('🔍 Fallback: searching for Chrome...');
    const fallbackPaths = [
      '/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.70/chrome-linux64/chrome',
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN
    ].filter(Boolean) as string[];
  
    console.log('🔍 Checking fallback paths:', fallbackPaths.length, 'paths');
    
    for (let i = 0; i < fallbackPaths.length; i++) {
      const path = fallbackPaths[i];
      console.log(`📍 Checking fallback path ${i + 1}/${fallbackPaths.length}:`, path);
      
      try {
        const fs = require('fs');
        if (fs.existsSync(path)) {
          console.log('✅ Found working Chrome at:', path);
          chromeExecutable = path;
          break;
        } else {
          console.log('❌ Fallback path does not exist:', path);
        }
      } catch (error) {
        console.log('❌ Failed to check fallback path:', path, error);
      }
    }
  }
  
  console.log('🔍 Final Chrome executable result:', chromeExecutable);
  
  // Configure browser launch options
  const launchOptions: any = {
    headless: isProduction ? true : false,
    defaultViewport: null,
    args: getChromeLaunchArgs()
  };

  // Set executable path if found
  if (chromeExecutable) {
    launchOptions.executablePath = chromeExecutable;
    console.log('✅ Using Chrome executable:', chromeExecutable);
  } else {
    console.log('❌ No Chrome executable found, will use default Puppeteer behavior');
  }
  
  console.log('🚀 Final browser launch options:', { 
    headless: launchOptions.headless, 
    executablePath: launchOptions.executablePath || 'default',
    argsCount: launchOptions.args.length
  });
  
  // Last resort fallback: if no executable path found, try to find it dynamically
  if (!launchOptions.executablePath) {
    console.log('⚠️ Attempting last resort Chrome detection...');
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if puppeteer base directory exists
      const baseCacheDir = '/opt/render/.cache/puppeteer';
      console.log('📁 Checking base cache dir:', baseCacheDir, '- exists:', fs.existsSync(baseCacheDir));
      
      if (fs.existsSync(baseCacheDir)) {
        const baseContents = fs.readdirSync(baseCacheDir);
        console.log('📁 Base cache contents:', baseContents);
      }
      
      const cacheDir = '/opt/render/.cache/puppeteer/chrome';
      console.log('📁 Checking chrome cache dir:', cacheDir, '- exists:', fs.existsSync(cacheDir));
      
      if (fs.existsSync(cacheDir)) {
        const allContents = fs.readdirSync(cacheDir);
        console.log('📁 Chrome cache all contents:', allContents);
        
        const versions = allContents.filter((dir: string) => dir.startsWith('linux-'));
        console.log('📁 Found Chrome versions:', versions);
        
        for (const version of versions) {
          const versionDir = path.join(cacheDir, version);
          console.log('📁 Checking version dir:', versionDir, '- exists:', fs.existsSync(versionDir));
          
          if (fs.existsSync(versionDir)) {
            const versionContents = fs.readdirSync(versionDir);
            console.log('📁 Version dir contents:', versionContents);
            
            const chromePath = path.join(versionDir, 'chrome-linux64', 'chrome');
            console.log('📁 Checking final chrome path:', chromePath, '- exists:', fs.existsSync(chromePath));
            
            if (fs.existsSync(chromePath)) {
              console.log('🎯 Last resort: found Chrome at', chromePath);
              launchOptions.executablePath = chromePath;
              break;
            }
          }
        }
      } else {
        console.log('❌ Chrome cache directory does not exist');
      }
    } catch (error) {
      console.log('❌ Last resort detection failed:', error);
    }
  }
  
  console.log('🚀 FINAL browser launch with executable:', launchOptions.executablePath || 'default');
  
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    
    // Basic stealth setup
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      (window as any).chrome = { runtime: {} };
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Canva login...');
    await page.goto('https://www.canva.com/login', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('Page loaded successfully!');
    
    // Click Continue with email
    console.log('Looking for Continue with email button...');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emailButton = buttons.find(btn => btn.textContent?.includes('Continue with email'));
      if (emailButton) {
        (emailButton as HTMLElement).click();
      }
    });
    console.log('Clicked Continue with email');
    
    // Wait for email input
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: Kiểm tra tất cả input elements
    const allInputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({
        type: input.type,
        inputmode: input.inputMode,
        name: input.name,
        id: input.id,
        autocomplete: input.autocomplete,
        placeholder: input.placeholder,
        className: input.className
      }))
    );
    console.log('All inputs found:', allInputs);
    
    // Find and fill email
    let emailInput = null;
    try {
      // Thử tìm input với inputmode="email" trước
      await page.waitForSelector('input[inputmode="email"]', { timeout: 5000 });
      emailInput = await page.$('input[inputmode="email"]');
      console.log('Found email input with inputmode="email"');
    } catch (error) {
      try {
        // Fallback: tìm input với name="email"
        await page.waitForSelector('input[name="email"]', { timeout: 5000 });
        emailInput = await page.$('input[name="email"]');
        console.log('Found email input with name="email"');
      } catch (error2) {
        // Fallback cuối: tìm input với autocomplete="email"
        await page.waitForSelector('input[autocomplete="email"]', { timeout: 5000 });
        emailInput = await page.$('input[autocomplete="email"]');
        console.log('Found email input with autocomplete="email"');
      }
    }
    
    if (emailInput) {
      await emailInput.click();
      await emailInput.type(credentials.account, { delay: 100 });
      console.log('Typed email:', credentials.account);
      
      // Wait before clicking Continue
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click Continue
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueButton = buttons.find(btn => btn.textContent?.includes('Continue'));
        if (continueButton) {
          (continueButton as HTMLElement).click();
        }
      });
      console.log('Clicked Continue');
      
      // Check for technical issue or security block
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pageContent = await page.content();
      if (pageContent.includes('technical issue')) {
        console.log('❌ Technical issue detected - Canva is blocking automation');
        throw new Error('Canva detected automation. Please try manual login or use different approach.');
      }
      
      // Check for security block
      if (pageContent.includes('security reasons') || pageContent.includes('RRS‑') || pageContent.includes('different Wi-Fi')) {
        console.log('🚨 SECURITY BLOCK detected - Canva has blocked this IP/browser');
        throw new Error('Canva security system blocked access. Please:\n1. Change IP/WiFi network\n2. Use different browser/device\n3. Wait 24-48 hours\n4. Consider manual team invitation');
      }
    }
    
    // Wait for password input
    console.log('Waiting for password input...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type(credentials.password, { delay: 100 });
      console.log('Typed password');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click Log in
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginButton = buttons.find(btn => btn.textContent?.includes('Log in'));
        if (loginButton) {
          (loginButton as HTMLElement).click();
        }
      });
      console.log('Clicked Log in');
    }
    
    // Check for verification code
    let needsVerification = false;
    try {
      const verificationInput = await page.waitForSelector('input[type="text"], input[placeholder*="code"]', { timeout: 5000 });
      if (verificationInput) {
        console.log('⚠️ Verification code required! Waiting 20 seconds for email to arrive...');
        
        // Đợi 10 giây để đảm bảo email được gửi đến
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Thử lấy mã xác thực từ email
        let verificationCode = null;
        for (let i = 0; i < 3; i++) { // Thử 3 lần
          verificationCode = await getCanvaVerificationCode(credentials.account);
          if (verificationCode) break;
          await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5 giây trước khi thử lại
        }
        
        if (verificationCode) {
          console.log('Found verification code:', verificationCode);
          await verificationInput.type(verificationCode, { delay: 100 });
          
          // Click nút Submit/Continue
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitButton = buttons.find(btn => 
              btn.textContent?.includes('Submit') || 
              btn.textContent?.includes('Continue') ||
              btn.textContent?.includes('Verify')
            );
            if (submitButton) {
              (submitButton as HTMLElement).click();
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log('❌ Could not get verification code from email');
          throw new Error('Could not get verification code from email');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Could not get verification code')) {
        throw error;
      }
      console.log('No verification code required');
    }
    
    // // Navigate to People page
    // if (!needsVerification) {
    //   await page.waitForNavigation({ timeout: 30000 });
    // }
    
    console.log('Navigating to People settings page...');
    await page.goto('https://www.canva.com/settings/people', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Click Invite button
    console.log('Looking for Invite button...');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inviteButton = buttons.find(btn => 
        btn.textContent?.includes('Mời mọi người') || 
        btn.textContent?.includes('Invite') ||
        btn.getAttribute('aria-label')?.includes('Mời mọi người') ||
        btn.getAttribute('aria-label')?.includes('Invite')
      );
      if (inviteButton) {
        (inviteButton as HTMLElement).click();
      }
    });
    console.log('Clicked Invite button');
    
    // Wait for invite modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click role dropdown button "Thành viên đội"
    console.log('Looking for role dropdown...');
    await page.waitForSelector('button[role="combobox"]', { timeout: 10000 });
    await page.evaluate(() => {
      const roleButtons = Array.from(document.querySelectorAll('button[role="combobox"]'));
      const roleDropdown = roleButtons.find(btn => 
        btn.textContent?.includes('Thành viên đội') || 
        btn.getAttribute('aria-label')?.includes('Chỉ định vai trò')
      );
      if (roleDropdown) {
        (roleDropdown as HTMLElement).click();
      }
    });
    console.log('Clicked role dropdown');
    
    // Wait for dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select "Nhà thiết kế thương hiệu của đội" role
    console.log('Selecting brand designer role...');
    await page.evaluate(() => {
      const roleOptions = Array.from(document.querySelectorAll('button'));
      const brandDesignerOption = roleOptions.find(btn => 
        btn.textContent?.includes('Nhà thiết kế thương hiệu của đội') ||
        btn.textContent?.includes('Brand designer')
      );
      if (brandDesignerOption) {
        (brandDesignerOption as HTMLElement).click();
      }
    });
    console.log('Selected brand designer role');
    
    // Wait for role selection to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enter email to invite
    console.log('Looking for email input...');
    await page.waitForSelector('input[inputmode="email"]', { timeout: 10000 });
    const inviteEmailInput = await page.$('input[inputmode="email"]');
    if (inviteEmailInput) {
      await inviteEmailInput.click();
      await inviteEmailInput.type(email, { delay: 100 });
      console.log('Typed email:', email);
    }
    
    // Wait before clicking confirm
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Confirm and Invite button
    console.log('Looking for confirm button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmButton = buttons.find(btn => 
        btn.textContent?.includes('Xác nhận và mời') || 
        btn.textContent?.includes('Confirm') ||
        (btn.textContent?.includes('Invite') && !btn.textContent?.includes('Mời mọi người'))
      );
      if (confirmButton) {
        (confirmButton as HTMLElement).click();
      }
    });
    console.log('Clicked confirm and invite button');
    
    // Wait for success message and copy link button
    console.log('Waiting for invite success message...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Grant clipboard permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.canva.com', ['clipboard-read', 'clipboard-write']);
    
    // Click copy invite link button for the specific email
    console.log('Looking for copy link button for email:', email);
    let inviteLink = null;
    try {
      await page.evaluate((emailToFind) => {
        // Look for the specific invitation text pattern "Lời mời của [email] còn hiệu lực trong"
        const inviteTextPattern = `Lời mời của ${emailToFind} còn hiệu lực trong`;
        console.log('Looking for text pattern:', inviteTextPattern);
        
        // Find all span elements that might contain the invitation text
        const allSpans = Array.from(document.querySelectorAll('span'));
        let inviteTextSpan = null;
        
        for (const span of allSpans) {
          if (span.textContent && span.textContent.includes(inviteTextPattern)) {
            inviteTextSpan = span;
            console.log('Found invite text span for:', emailToFind);
            break;
          }
        }
        
        if (inviteTextSpan) {
          // Find the main container div that contains both the text and buttons
          // Based on HTML structure, look for div with class "_2fpXnQ HbS2lw" or similar main container
          let mainContainer = null;
                     let currentElement = inviteTextSpan as Element;
          
          // Search up the DOM tree to find the main container div
          for (let i = 0; i < 15; i++) {
            if (!currentElement) break;
            
            // Check if this element contains both the text and has buttons
            const buttonsInElement = currentElement.querySelectorAll('button[aria-label*="Sao chép liên kết duy nhất"], button[aria-label*="Copy unique link"]');
            
            if (buttonsInElement.length > 0) {
              mainContainer = currentElement;
              console.log('Found main container at level:', i);
              break;
            }
            
            currentElement = currentElement.parentElement as Element;
          }
          
          if (mainContainer) {
            // Now find the copy button specifically within this main container
            const copyButton = mainContainer.querySelector('button[aria-label*="Sao chép liên kết duy nhất"], button[aria-label*="Copy unique link"]');
            
            if (copyButton) {
              (copyButton as HTMLElement).click();
              console.log('Successfully clicked copy button for invited email:', emailToFind);
              return;
            } else {
              console.log('Copy button not found in main container for:', emailToFind);
            }
          } else {
            console.log('Main container not found for:', emailToFind);
          }
        } else {
          console.log('Invite text span not found for pattern:', inviteTextPattern);
        }
        
        // Fallback: click the first copy button found
        console.log('Using fallback method to find copy button');
        const allButtons = Array.from(document.querySelectorAll('button'));
        const fallbackButton = allButtons.find(btn => 
          btn.getAttribute('aria-label')?.includes('Sao chép liên kết duy nhất') ||
          btn.getAttribute('aria-label')?.includes('Copy unique link')
        );
        if (fallbackButton) {
          (fallbackButton as HTMLElement).click();
          console.log('Used fallback copy button');
        } else {
          console.log('No copy button found at all');
        }
      }, email);
      console.log('Clicked copy link button for the invited email');
      
      // Wait for clipboard operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get invite link from clipboard
      inviteLink = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (error) {
          console.error('Clipboard read error:', error);
          return null;
        }
      });
      
      console.log('Retrieved invite link:', inviteLink);
      
    } catch (error) {
      console.error('Error copying invite link:', error);
      
      // Fallback: try to find the link in the DOM
      try {
        inviteLink = await page.evaluate(() => {
          // Look for any element that might contain the invite link
          const possibleElements = Array.from(document.querySelectorAll('*'));
          for (const el of possibleElements) {
            const text = el.textContent || el.getAttribute('value') || el.getAttribute('href');
            if (text && (text.includes('https://www.canva.com/brand/join') || text.includes('canva.com/brand'))) {
              return text;
            }
          }
          return null;
        });
        console.log('Found invite link in DOM:', inviteLink);
      } catch (domError) {
        console.error('Error finding link in DOM:', domError);
      }
    }

    await browser.close();
    return inviteLink;

  } catch (error) {
    console.error('Automation error:', error);
    await browser.close();
    throw error;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Email is required'
      }, { status: 400 });
    }

    // Lấy thông tin tài khoản mới nhất
    const credentials = await getLatestTeamCredentials();
    if (!credentials) {
      return NextResponse.json({
        status: 'error',
        message: 'Không tìm thấy thông tin tài khoản mới'
      }, { status: 404 });
    }

    // Thực hiện quá trình chuyển team
    const inviteLink = await automateTeamTransfer(email, credentials);
    
    if (!inviteLink) {
      return NextResponse.json({
        status: 'error',
        message: 'Không thể tạo link mời'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Đã tạo link mời thành công',
      data: {
        inviteLink
      }
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Có lỗi xảy ra trong quá trình chuyển team'
    }, { status: 500 });
  }
} 