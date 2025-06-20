import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Bước 1: Tìm TEAM của email trong sheet CANVAPRO
async function findTeamForEmail(email: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CANVAPRO!A:G', // Đọc từ cột A đến G
    });

    const rows = response.data.values || [];
    
    // Bỏ qua 2 dòng đầu tiên (header)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (row[2]?.toLowerCase() === email.toLowerCase()) { // Email ở cột C (index 2)
        console.log('✅ Found email:', email, 'Team:', row[6], 'TTKH:', row[5]);
        return {
          team: row[6], // TEAM ở cột G (index 6)
          ttkh: row[5], // TTKH ở cột F (index 5)
          maDonHang: row[1], // MÃ ĐƠN HÀNG ở cột B (index 1) - đổi từ A sang B
          options: row[0], // OPTIONS ở cột A (index 0) - đổi từ B sang A
          ngayHetHan: row[3], // NGÀY HẾT HẠN ở cột D (index 3)
          con: row[4], // CÒN ở cột E (index 4)
          currentRow: row
        };
      }
    }

    return null; // Không tìm thấy email
  } catch (error) {
    console.error('Error in findTeamForEmail:', error);
    throw error;
  }
}

// Bước 2: Kiểm tra trạng thái của TEAM trong sheet ADMIN FAM CANVA
async function checkTeamStatus(teamCode: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'ADMIN FAM CANVA!A:G', // Đọc từ cột A đến G
    });

    const rows = response.data.values || [];
    
    // Bỏ qua dòng đầu tiên (header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[6]?.toLowerCase() === teamCode?.toLowerCase()) { // TÊN ĐỘI ở cột G (index 6)
        const isLive = row[3]?.toLowerCase() !== 'die'; // Die/Live ở cột D (index 3)
        console.log('🔍 Team status:', teamCode, isLive ? '✅ LIVE' : '❌ DIE');
        return {
          isLive,
          account: row[1], // TÀI KHOẢN ở cột B (index 1)
          pass: row[2], // PASS ở cột C (index 2)
          dateRenew: row[5], // DATE RENEW ở cột F (index 5)
          newTeam: isLive ? null : await findAvailableTeam(rows) // Nếu die thì tìm team mới
        };
      }
    }

    return null; // Không tìm thấy team
  } catch (error) {
    console.error('Error in checkTeamStatus:', error);
    throw error;
  }
}

// Tìm team còn live để chuyển người dùng sang
async function findAvailableTeam(adminRows: any[]) {
  try {
    // Bỏ qua dòng đầu tiên (header)
    for (let i = 1; i < adminRows.length; i++) {
      const row = adminRows[i];
      if (row[3]?.toLowerCase() !== 'die') { // Kiểm tra cột Die/Live ở cột D (index 3)
        console.log('🔄 Found replacement team:', row[6]);
        return {
          teamCode: row[6], // TÊN ĐỘI ở cột G (index 6)
          account: row[1], // TÀI KHOẢN ở cột B (index 1)
          pass: row[2] // PASS ở cột C (index 2)
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error in findAvailableTeam:', error);
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

    // Bước 1: Tìm team của email
    const teamInfo = await findTeamForEmail(email);
    
    if (!teamInfo) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Bước 2: Kiểm tra trạng thái team
    const status = await checkTeamStatus(teamInfo.team);
    
    if (!status) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Team không tồn tại trong hệ thống'
      });
    }

    // Trả về kết quả
    if (status.isLive) {
      return NextResponse.json({
        status: 'live',
        message: 'Tài khoản đang hoạt động',
        data: {
          maDonHang: teamInfo.maDonHang,
          ttkh: teamInfo.ttkh,
          options: teamInfo.options,
          ngayHetHan: teamInfo.ngayHetHan,
          con: teamInfo.con,
          team: teamInfo.team,
          account: status.account,
          dateRenew: status.dateRenew
        }
      });
    } else {
      const newTeamInfo = status.newTeam;
      if (!newTeamInfo) {
        return NextResponse.json({
          status: 'error',
          message: 'Không tìm thấy team mới để chuyển'
        });
      }
      
      return NextResponse.json({
        status: 'die',
        message: 'Die',
        data: {
          oldTeam: teamInfo.team,
          ttkh: teamInfo.ttkh,
          newTeam: newTeamInfo.teamCode,
          newAccount: newTeamInfo.account,
          newPassword: newTeamInfo.pass
        }
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
}

export async function GET() {
  try {
    // Test Gmail access by listing some recent messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5
    });

    const messages = response.data.messages || [];
    const messageDetails = [];

    // Get details for each message
    for (const message of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!
      });
      
      const headers = details.data.payload?.headers;
      const subject = headers?.find(h => h.name === 'Subject')?.value;
      const from = headers?.find(h => h.name === 'From')?.value;

      messageDetails.push({
        id: message.id,
        subject,
        from
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully accessed Gmail',
      recentEmails: messageDetails
    });

  } catch (error: any) {
    console.error('Error accessing Gmail:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 