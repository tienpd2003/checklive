import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

// Cấu hình Google Sheets credentials
const GOOGLE_SHEETS_CLIENT_EMAIL = 'checklive@thayfamily.iam.gserviceaccount.com';
const GOOGLE_SHEETS_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9oVUUyG9YBEYt\ntgt2oLEfrI69bGBOM7qc14pFeChaXtB6Oc/FrcqmXgty3NL0tpmKMy5dDWbFVWr7\nHkyA9oFxpGju8kldut70op1bvl724+wt585ERPbVvMQp99OnoGWa3QH8rTNI5L+A\nX0wAA+GcHoR57EZyc2Pj/awVBTre+2aM8+0iX1yPh7/3HVJEVcYYXxwweVDbFbWi\nkDYK34pVKX1DaEwSL+9kpaBJ7BVy2NkhGR5EhYDzYtUk5w2Mmu1bvCarhJPREs2A\nBB9aw2HIMfrpDFuka9uCq8HsRBWWOYs7GPlC11nUEJzQr3gXM04vi5j4Y9EninKt\nKu8DLG53AgMBAAECggEAJ2u6fC+OtgVtcWM+ztJo/+SnZ8l328n1KVXFcNuhx+ed\n/0q1XqraTeuPBbnSQP0Uvh4VrVJz4uH2821BCi40iqNbDRFhHxMR9lk3zTKuGzUW\njBR8VMTha11qii7y2Q4HEUKQfy6iUqz7AnzNF9O2uvW9JHtxyakjQuohM916d4//\n80VpHS2gMO9Gcl3JRd/NJ+bW7Iw8NMCAhuDba/Rhx7ibYiGNCKr4yvtUwQwlVhBW\n4l7dXPWp9m/hKhIqef90jFDOv8iTI0N6ZYDgkp25mzZmWReyapi5c1bq9Kd9Hm2q\nmCGdqUSXO83+v7iEjEUdqSLl/VAUrLtKbav869s8QQKBgQDnJumba3xKdgiQ9Iu7\n/LAv5rh5ASm9aj3TzMPPSoBTdUWmZhZSojunPbVME3XWJXq5Jt/KYslyqDyFog48\nG4oM7WZk//B7CWYdS0a2fCEvhs6y8v5hbSwYoJ2bOlXLKdHAr51q/J7hq9EXipGw\nXjU+XTg1AIKEisCqBjsOV+o2XQKBgQDSA8dX1DlBU/uDKPjKX4cqHgirigvqnAw+\n5Y5s0wQCySV43HnTXSnrcPhzjEeG9vnEOsE5gN6mfmAKxuFzj9iIa9RFV4+IP1uO\n0N0p+BH1Dm2fwmFXOP5x7tNoKzINlPC3WEsxeIlVbNjzzd8qZRS5azGVkiXPJxYD\naQih1j+C4wKBgQCcXVFXxp0cjb37uMGx2ByjOrL9gBDpRi4u0WyAFEi8rC8CgjqF\niaNK3c5/eQaUZ2QeTbLDaJIXUsEmMNrqRELdvdYvaocV4+TE2kAqf8u/J7U5jnEQ\nHNbgjf4vnIWe2lo+u02EqwEbbawS/bTSFthzqIG2MPMZj/cGzRI0ALq6LQKBgQC8\nyBbF9YguGC8LHKZfS/W1P2Atyp6hmvpLA5C+dASz+FoNxapg++r1sAw12dBmGtYz\ntVkBtrztzsXIijQY7CIJp1wdpPLp14IW49saodqKfRi/tjxH6nyWr8craUDKAqtL\nNDwLUT2qI3j114aWllxFvHzK5Z/FEW5xTFYtG+jlXwKBgGVOku5OqdezVdV+fFvz\nKjxplk4whdAp0+tP8wYXVuyupVMgGQc7D9fMoMfQSLLTjYceD8i9vOWRFFCicl2I\nbgcLYY9uJOwlYSgX2jgre6rMTjvpfhrnGa4G1ftlLX6aToV4Gc6K3QwEjReNhFDz\ng9PbaDCVawvPmq+dDD/GJS+8\n-----END PRIVATE KEY-----\n";
const SHEET_ID = '1GOXHENfSgzu0qUzRSobcEValk1bOLKCWCTh_W-7K_KE';

// Khởi tạo Google Sheets API client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: GOOGLE_SHEETS_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

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
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--incognito',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

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
        await page.screenshot({ path: 'technical-issue.png' });
        throw new Error('Canva detected automation. Please try manual login or use different approach.');
      }
      
      // Check for security block
      if (pageContent.includes('security reasons') || pageContent.includes('RRS‑') || pageContent.includes('different Wi-Fi')) {
        console.log('🚨 SECURITY BLOCK detected - Canva has blocked this IP/browser');
        await page.screenshot({ path: 'security-block.png' });
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
      await page.waitForSelector('input[type="text"], input[placeholder*="code"]', { timeout: 5000 });
      console.log('⚠️ Verification code required! Please enter manually.');
      await page.screenshot({ path: 'verification-required.png' });
      
      console.log('Waiting 60 seconds for manual verification...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      needsVerification = true;
    } catch (error) {
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