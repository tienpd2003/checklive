import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cấu hình trực tiếp Google Sheets credentials
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

// Bước 1: Tìm TEAM của email trong sheet CANVAPRO
async function findTeamForEmail(email: string) {
  try {
    console.log('Searching for email:', email);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CANVAPRO!A:G', // Đọc từ cột A đến G
    });

    const rows = response.data.values || [];
    console.log('Total rows in CANVAPRO:', rows.length);
    
    // Bỏ qua 2 dòng đầu tiên (header)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      console.log('Checking row:', i, 'Email in sheet:', row[2], 'Looking for:', email);
      if (row[2]?.toLowerCase() === email.toLowerCase()) { // Email ở cột C (index 2)
        console.log('Found email match at row:', i);
        console.log('Team:', row[6], 'TTKH:', row[5]); // Team ở cột G (index 6), TTKH ở cột F (index 5)
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

    console.log('Email not found in sheet');
    return null; // Không tìm thấy email
  } catch (error) {
    console.error('Error in findTeamForEmail:', error);
    throw error;
  }
}

// Bước 2: Kiểm tra trạng thái của TEAM trong sheet ADMIN FAM CANVA
async function checkTeamStatus(teamCode: string) {
  try {
    console.log('Checking status for team:', teamCode);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'ADMIN FAM CANVA!A:G', // Đọc từ cột A đến G
    });

    const rows = response.data.values || [];
    console.log('Total rows in ADMIN FAM CANVA:', rows.length);
    
    // Bỏ qua dòng đầu tiên (header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Log thêm thông tin để debug
      console.log('Row data:', row);
      console.log('Checking row:', i, 'Team in sheet:', row[6], 'Looking for:', teamCode); // TÊN ĐỘI ở cột G (index 6)
      if (row[6]?.toLowerCase() === teamCode?.toLowerCase()) { // TÊN ĐỘI ở cột G (index 6)
        const isLive = row[3]?.toLowerCase() !== 'die'; // Die/Live ở cột D (index 3)
        console.log('Found team match at row:', i, 'Status:', row[3]);
        return {
          isLive,
          account: row[1], // TÀI KHOẢN ở cột B (index 1)
          pass: row[2], // PASS ở cột C (index 2)
          dateRenew: row[5], // DATE RENEW ở cột F (index 5)
          newTeam: isLive ? null : await findAvailableTeam(rows) // Nếu die thì tìm team mới
        };
      }
    }

    console.log('Team not found in sheet');
    return null; // Không tìm thấy team
  } catch (error) {
    console.error('Error in checkTeamStatus:', error);
    throw error;
  }
}

// Tìm team còn live để chuyển người dùng sang
async function findAvailableTeam(adminRows: any[]) {
  try {
    console.log('Looking for available live team');
    // Bỏ qua dòng đầu tiên (header)
    for (let i = 1; i < adminRows.length; i++) {
      const row = adminRows[i];
      console.log('Checking row:', i, 'Status:', row[3]);
      if (row[3]?.toLowerCase() !== 'die') { // Kiểm tra cột Die/Live ở cột D (index 3)
        console.log('Found live team at row:', i, 'Team:', row[6]);
        return {
          teamCode: row[6], // TÊN ĐỘI ở cột G (index 6)
          account: row[1], // TÀI KHOẢN ở cột B (index 1)
          pass: row[2] // PASS ở cột C (index 2)
        };
      }
    }
    console.log('No available live team found');
    return null;
  } catch (error) {
    console.error('Error in findAvailableTeam:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request');
    const { email } = await request.json();
    console.log('Email from request:', email);
    
    if (!email) {
      console.log('No email provided');
      return NextResponse.json({ 
        status: 'error',
        message: 'Email is required'
      });
    }

    // Bước 1: Tìm team của email
    console.log('Step 1: Finding team for email');
    const teamInfo = await findTeamForEmail(email);
    console.log('Team info result:', teamInfo);
    
    if (!teamInfo) {
      console.log('Email not found in CANVAPRO sheet');
      return NextResponse.json({ 
        status: 'error',
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Bước 2: Kiểm tra trạng thái team
    console.log('Step 2: Checking team status');
    const status = await checkTeamStatus(teamInfo.team);
    console.log('Team status result:', status);
    
    if (!status) {
      console.log('Team not found in ADMIN FAM CANVA sheet');
      return NextResponse.json({ 
        status: 'error',
        message: 'Team không tồn tại trong hệ thống'
      });
    }

    // Trả về kết quả
    console.log('Preparing response');
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
        message: 'Tài khoản đã die, đã chuyển sang team mới',
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