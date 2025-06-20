import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { getCanvaVerificationCode } from '@/app/utils/gmail';

// Cấu hình Google OAuth2 credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SHEET_ID = process.env.SHEET_ID;

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback'
);

oauth2Client.setCredentials({
  refresh_token: GOOGLE_REFRESH_TOKEN
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

// Helper function để xử lý detached frame errors
async function safePageEvaluate<T>(page: any, fn: () => T, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await page.evaluate(fn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('detached') || errorMessage.includes('Execution context')) {
        console.log(`Page evaluate failed (attempt ${i + 1}/${retries}): ${errorMessage}`);
        if (i === retries - 1) {
          console.log('Max retries reached for page evaluate');
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error; // Re-throw non-detached errors
    }
  }
  return null;
}

// Helper function để wait for selector với retry
async function safeWaitForSelector(page: any, selector: string, timeout = 10000, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await page.waitForSelector(selector, { timeout });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('detached') || errorMessage.includes('Execution context')) {
        console.log(`Wait for selector failed (attempt ${i + 1}/${retries}): ${errorMessage}`);
        if (i === retries - 1) {
          throw new Error(`Failed to find selector ${selector} after ${retries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error; // Re-throw non-detached errors
    }
  }
}

// Hàm tự động chuyển team sử dụng Puppeteer
async function automateTeamTransfer(email: string, credentials: { account: string; password: string }) {
  let browser = null;
  
  try {
    console.log('Launching browser with Railway-optimized config...');
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production' ? true : false,
      defaultViewport: {
        width: 1024,
        height: 768
      },
      timeout: 60000,
      protocolTimeout: 240000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--disable-blink-features=AutomationControlled',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--window-size=1024,768',
        '--window-position=100,100',
        '--disable-extensions-file-access-check',
        '--disable-plugins-discovery',
        '--start-maximized=false',
        ...(process.env.NODE_ENV === 'production' ? [
          '--single-process',
          '--max-old-space-size=2048'
        ] : []),
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    console.log('Browser launched successfully');

    // Retry mechanism cho newPage
    let page = null;
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Creating new page, attempt ${i + 1}/3...`);
        page = await browser.newPage();
        console.log('Page created successfully');
        break;
      } catch (error) {
        console.log(`Failed to create page, attempt ${i + 1}/3:`, error);
        if (i === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!page) {
      throw new Error('Failed to create page after 3 attempts');
    }
    
    // Enhanced stealth setup
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Add chrome runtime
      (window as any).chrome = { runtime: {} };
      
      // Override plugins length
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission } as any);
        }
        return originalQuery(parameters);
      };
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Canva login...');
    await page.goto('https://www.canva.com/login', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('Page loaded successfully!');
    
    // Click Continue with email - use Promise.all to handle navigation
    console.log('Looking for Continue with email button...');
    await safeWaitForSelector(page, 'button');
    
    // Set up navigation promise before clicking
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 20000 
    }).catch(() => null); // Don't fail if no navigation
    
    const emailButtonClicked = await safePageEvaluate(page, () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emailButton = buttons.find(btn => btn.textContent?.includes('Continue with email'));
      if (emailButton) {
        (emailButton as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Clicked Continue with email:', emailButtonClicked);
    
    // Wait for either navigation or timeout
    console.log('Waiting for page navigation or stabilization...');
    await navigationPromise;
    
    // Additional wait for any SPA transitions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Log current state
    try {
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
    } catch (error) {
      console.log('Could not get current URL:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Check if page is still usable after navigation
    let pageUsable = false;
    for (let i = 0; i < 3; i++) {
      try {
        await page.evaluate(() => document.readyState);
        pageUsable = true;
        console.log('Page is usable for DOM operations');
        break;
      } catch (error) {
        console.log(`Page not usable, attempt ${i + 1}/3. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // If page is completely dead, try to reload current URL
        if (i === 2) {
          try {
            const currentUrl = page.url();
            console.log('Attempting to reload page:', currentUrl);
            await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.evaluate(() => document.readyState);
            pageUsable = true;
            console.log('Page successfully reloaded and is now usable');
          } catch (reloadError) {
            console.log('Failed to reload page:', reloadError instanceof Error ? reloadError.message : 'Unknown error');
            throw new Error('Page became permanently unusable after navigation');
          }
        }
      }
    }
    
    if (!pageUsable) {
      throw new Error('Could not establish usable page context');
    }
    
    // Find and fill email
    let emailInput = null;
    try {
      // Thử tìm input với inputmode="email" trước
      await safeWaitForSelector(page, 'input[inputmode="email"]', 5000);
      emailInput = await page.$('input[inputmode="email"]');
      console.log('Found email input with inputmode="email"');
    } catch (error) {
      try {
        // Fallback: tìm input với name="email"
        await safeWaitForSelector(page, 'input[name="email"]', 5000);
        emailInput = await page.$('input[name="email"]');
        console.log('Found email input with name="email"');
      } catch (error2) {
        try {
          // Fallback cuối: tìm input với autocomplete="email"
          await safeWaitForSelector(page, 'input[autocomplete="email"]', 5000);
          emailInput = await page.$('input[autocomplete="email"]');
          console.log('Found email input with autocomplete="email"');
        } catch (error3) {
          console.log('Could not find any email input field');
        }
      }
    }
    
    if (emailInput) {
      await emailInput.click();
      await emailInput.type(credentials.account, { delay: 100 });
      console.log('Typed email:', credentials.account);
      
      // Wait before clicking Continue
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click Continue
      const continueClicked = await safePageEvaluate(page, () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueButton = buttons.find(btn => btn.textContent?.includes('Continue'));
        if (continueButton) {
          (continueButton as HTMLElement).click();
          return true;
        }
        return false;
      });
      console.log('Clicked Continue:', continueClicked);
      
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
    await safeWaitForSelector(page, 'input[type="password"]', 10000);
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type(credentials.password, { delay: 100 });
      console.log('Typed password');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click Log in
      const loginClicked = await safePageEvaluate(page, () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginButton = buttons.find(btn => btn.textContent?.includes('Log in'));
        if (loginButton) {
          (loginButton as HTMLElement).click();
          return true;
        }
        return false;
      });
      console.log('Clicked Log in:', loginClicked);
    }
    
    // Check for verification code
    let needsVerification = false;
    try {
      const verificationInput = await safeWaitForSelector(page, 'input[type="text"], input[placeholder*="code"]', 5000);
      if (verificationInput) {
        console.log('⚠️ Verification code required! Attempting to get code from email...');
        
        // Đợi 5 giây để email được gửi đến
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
          const submitClicked = await safePageEvaluate(page, () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitButton = buttons.find(btn => 
              btn.textContent?.includes('Submit') || 
              btn.textContent?.includes('Continue') ||
              btn.textContent?.includes('Verify')
            );
            if (submitButton) {
              (submitButton as HTMLElement).click();
              return true;
            }
            return false;
          });
          console.log('Clicked verification submit:', submitClicked);
          
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
    
    console.log('Navigating to People settings page...');
    await page.goto('https://www.canva.com/settings/people', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Click Invite button
    console.log('Looking for Invite button...');
    await safeWaitForSelector(page, 'button');
    const inviteClicked = await safePageEvaluate(page, () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inviteButton = buttons.find(btn => 
        btn.textContent?.includes('Mời mọi người') || 
        btn.textContent?.includes('Invite') ||
        btn.getAttribute('aria-label')?.includes('Mời mọi người') ||
        btn.getAttribute('aria-label')?.includes('Invite')
      );
      if (inviteButton) {
        (inviteButton as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Clicked Invite button:', inviteClicked);
    
    // Wait for invite modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click role dropdown button "Thành viên đội"
    console.log('Looking for role dropdown...');
    await safeWaitForSelector(page, 'button[role="combobox"]', 10000);
    const roleDropdownClicked = await safePageEvaluate(page, () => {
      const roleButtons = Array.from(document.querySelectorAll('button[role="combobox"]'));
      const roleDropdown = roleButtons.find(btn => 
        btn.textContent?.includes('Thành viên đội') || 
        btn.getAttribute('aria-label')?.includes('Chỉ định vai trò')
      );
      if (roleDropdown) {
        (roleDropdown as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Clicked role dropdown:', roleDropdownClicked);
    
    // Wait for dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select "Nhà thiết kế thương hiệu của đội" role
    console.log('Selecting brand designer role...');
    const brandDesignerSelected = await safePageEvaluate(page, () => {
      const roleOptions = Array.from(document.querySelectorAll('button'));
      const brandDesignerOption = roleOptions.find(btn => 
        btn.textContent?.includes('Nhà thiết kế thương hiệu của đội') ||
        btn.textContent?.includes('Brand designer')
      );
      if (brandDesignerOption) {
        (brandDesignerOption as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Selected brand designer role:', brandDesignerSelected);
    
    // Wait for role selection to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enter email to invite
    console.log('Looking for email input...');
    await safeWaitForSelector(page, 'input[inputmode="email"]', 10000);
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
    const confirmClicked = await safePageEvaluate(page, () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmButton = buttons.find(btn => 
        btn.textContent?.includes('Xác nhận và mời') || 
        btn.textContent?.includes('Confirm') ||
        (btn.textContent?.includes('Invite') && !btn.textContent?.includes('Mời mọi người'))
      );
      if (confirmButton) {
        (confirmButton as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Clicked confirm and invite button:', confirmClicked);
    
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
      const copyResult = await safePageEvaluate(page, () => {
        // Look for the specific invitation text pattern "Lời mời của [email] còn hiệu lực trong"
        const inviteTextPattern = `Lời mời của ${email} còn hiệu lực trong`;
        console.log('Looking for text pattern:', inviteTextPattern);
        
        // Find all span elements that might contain the invitation text
        const allSpans = Array.from(document.querySelectorAll('span'));
        let inviteTextSpan = null;
        
        for (const span of allSpans) {
          if (span.textContent && span.textContent.includes(inviteTextPattern)) {
            inviteTextSpan = span;
            console.log('Found invite text span for:', email);
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
              console.log('Successfully clicked copy button for invited email:', email);
              return 'success';
            } else {
              console.log('Copy button not found in main container for:', email);
            }
          } else {
            console.log('Main container not found for:', email);
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
          return 'fallback';
        } else {
          console.log('No copy button found at all');
          return 'none';
        }
      });
      console.log('Copy link result:', copyResult);
      
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

    if (browser) await browser.close();
    return inviteLink;

  } catch (error) {
    console.error('Automation error:', error);
    if (browser) await browser.close();
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Email is required'
      });
    }

    // Lấy thông tin tài khoản mới nhất
    const credentials = await getLatestTeamCredentials();
    if (!credentials) {
      return NextResponse.json({
        status: 'error',
        message: 'Không tìm thấy thông tin tài khoản mới'
      });
    }

    // Thực hiện quá trình chuyển team
    const inviteLink = await automateTeamTransfer(email, credentials);
    
    if (!inviteLink) {
      return NextResponse.json({
        status: 'error',
        message: 'Không thể tạo link mời'
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Đã tạo link mời thành công',
      data: {
        inviteLink
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Có lỗi xảy ra trong quá trình chuyển team'
    });
  }
} 