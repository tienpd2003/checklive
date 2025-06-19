import { google } from 'googleapis';

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
);

// Set scopes
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  scope: 'https://mail.google.com/ https://www.googleapis.com/auth/gmail.readonly'
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function getCanvaVerificationCode(emailAddress: string): Promise<string | null> {
  try {
    console.log('Searching for verification email...');
    // Tìm email mới nhất từ Canva
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `from:canva.com subject:"Your Canva code" newer_than:1h`,
      maxResults: 5
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('No verification email found');
      return null;
    }

    console.log(`Found ${response.data.messages.length} potential verification emails`);

    // Lấy và kiểm tra từng email, bắt đầu từ email mới nhất
    for (const messageInfo of response.data.messages) {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageInfo.id!,
        format: 'full'
      });

      // Lấy subject của email
      const subject = message.data.payload?.headers?.find(
        header => header.name?.toLowerCase() === 'subject'
      )?.value || '';

      console.log('Processing email with subject:', subject);

      // Tìm mã xác thực trong subject
      const subjectMatch = subject.match(/Your Canva code is (\d{6})/);
      if (subjectMatch) {
        const code = subjectMatch[1];
        console.log('Found verification code in subject:', code);
        return code;
      }

      // Nếu không tìm thấy trong subject, tìm trong nội dung
      const emailBody = message.data.payload?.parts?.[0]?.body?.data || 
                       message.data.payload?.body?.data || '';
      const decodedBody = Buffer.from(emailBody, 'base64').toString('utf-8');
      
      // Tìm mã 6 chữ số trong nội dung email
      const bodyMatch = decodedBody.match(/\b\d{6}\b/);
      if (bodyMatch) {
        console.log('Found verification code in body:', bodyMatch[0]);
        return bodyMatch[0];
      }
    }

    console.log('No verification code found in any recent emails');
    return null;
  } catch (error) {
    console.error('Error reading Gmail:', error);
    return null;
  }
} 