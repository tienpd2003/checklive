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

// Khởi tạo sheets API với auth đã được cấu hình
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
      team: lastDataRow[6], // TÊN ĐỘI ở cột G (index 6)
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
      '--disable-dev-shm-usage', // Quan trọng cho VPS
      '--disable-gpu', // Tránh lỗi GPU trên VPS
      '--remote-debugging-port=9222',
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
    
    // Navigate to People page
    console.log('Navigating to People settings page...');
    await page.goto('https://www.canva.com/settings/people', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    // Wait additional time for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    let inviteLink = null;
    let maxRetries = 10; // Số lần thử tối đa
    let retryCount = 0;

    while (!inviteLink && retryCount < maxRetries) {
      try {
        retryCount++;
        console.log(`Thử lần ${retryCount} để mời người dùng...`);

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
        await new Promise(resolve => setTimeout(resolve, 4000));
        
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        
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
        // Try to get the invite link
        try {
          // Kiểm tra xem có text "Lời mời của [email]" không
          const inviteTextExists = await page.evaluate((emailToFind) => {
            const inviteTextPattern = `Lời mời của ${emailToFind}`;
            const allSpans = Array.from(document.querySelectorAll('span'));
            return allSpans.some(span => 
              span.textContent && span.textContent.includes(inviteTextPattern)
            );
          }, email);

          if (inviteTextExists) {
            // Nếu tìm thấy text, tiến hành copy link
            await page.evaluate((emailToFind) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const copyButton = buttons.find(btn => 
                btn.getAttribute('aria-label')?.includes('Sao chép liên kết duy nhất') ||
                btn.getAttribute('aria-label')?.includes('Copy unique link')
              );
              if (copyButton) {
                (copyButton as HTMLElement).click();
              }
            }, email);

            // Wait for clipboard operation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get invite link from clipboard
            inviteLink = await page.evaluate(async () => {
              try {
                return await navigator.clipboard.readText();
              } catch (error) {
                return null;
              }
            });

            if (inviteLink) {
              console.log('Successfully got invite link on try', retryCount);
              break; // Thoát khỏi vòng lặp vì đã tìm thấy và copy được link
            }
          }

          // Nếu không tìm thấy text hoặc không copy được link, tiếp tục vòng lặp
          console.log(`Invite text not found for email on try ${retryCount}, retrying...`);
          if (retryCount === maxRetries) {
            throw new Error(`Could not find invite text for email: ${email} after ${maxRetries} tries`);
          }
          
          // Đợi một chút trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Refresh trang để thử lại
          await page.reload({ waitUntil: 'networkidle2' });
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
          console.log(`Error in invitation process on try ${retryCount}:`, error);
          if (retryCount === maxRetries) {
            throw error;
          }
          // Đợi một chút trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Refresh trang để thử lại
          await page.reload({ waitUntil: 'networkidle2' });
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.log(`Error in invitation process on try ${retryCount}:`, error);
        if (retryCount === maxRetries) {
          throw error;
        }
        // Đợi một chút trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Refresh trang để thử lại
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000));
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

// Hàm update TEAM trong sheet CANVAPRO
async function updateTeamInSheet(email: string, newTeam: string) {
  try {
    // Lấy dữ liệu từ sheet CANVAPRO
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CANVAPRO!A:G',
    });

    const rows = response.data.values || [];
    
    // Tìm row chứa email
    let rowIndex = -1;
    for (let i = 2; i < rows.length; i++) {
      const currentEmail = rows[i][2];
      if (currentEmail?.toLowerCase() === email.toLowerCase()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Không tìm thấy email ${email} trong sheet CANVAPRO`);
    }

    // Update TEAM ở cột G
    const updateResult = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `CANVAPRO!G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newTeam]]
      }
    });

    console.log('Update sheet thành công:', updateResult.status === 200 ? '✅' : '❌');

  } catch (error) {
    console.error('Lỗi khi update sheet:', error instanceof Error ? error.message : 'Unknown error');
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

    try {
      // Chỉ update sheet khi đã có invite link thành công
      await updateTeamInSheet(email, credentials.team);
      
      return NextResponse.json({
        status: 'success',
        message: 'Đã chuyển team và cập nhật sheet thành công',
        data: {
          inviteLink,
          newTeam: credentials.team
        }
      });
    } catch (sheetError) {
      // Nếu update sheet lỗi nhưng đã có invite link
      console.error('Lỗi khi update sheet:', sheetError);
      return NextResponse.json({
        status: 'partial_success',
        message: 'Đã tạo link mời nhưng không thể cập nhật sheet',
        data: {
          inviteLink,
          newTeam: credentials.team
        }
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra trong quá trình chuyển team'
    });
  }
} 