# Hướng dẫn Deploy lên Railway

## Bước 1: Chuẩn bị Repository

1. Commit và push tất cả thay đổi lên GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Bước 2: Tạo Project trên Railway

1. Truy cập [railway.app](https://railway.app)
2. Đăng nhập bằng GitHub account
3. Click "New Project"
4. Chọn "Deploy from GitHub repo"
5. Chọn repository `CheckLive`
6. Railway sẽ tự động detect Next.js và bắt đầu build

## Bước 3: Cấu hình Environment Variables

Trong Railway dashboard, vào tab **Variables** và thêm các biến sau:

```
GOOGLE_CLIENT_ID=757073440374-rj3a9a7dja0iabl6fs0saesectomvguf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//0g59U2_RHB2SeCgYIARAAGBASNwF-L9Irc3s2n4jNeez9tqWabBN5Fg7md6lHARqE9mJTK_cADD5kNSeX4vP3NEZBiwV2829SKcw
SHEET_ID=1nNfRFr83wepWMlgoBAasPVV5hCjR7w2ZaAU0bjWEEq4
GOOGLE_SCOPES=https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.readonly https://mail.google.com/
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Bước 4: Cập nhật Google OAuth Redirect URIs

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Vào **APIs & Services** → **Credentials**
3. Click vào OAuth 2.0 Client ID của bạn
4. Trong **Authorized redirect URIs**, thêm:
   ```
   https://your-app-name.railway.app/api/auth/callback
   ```
   (Thay `your-app-name` bằng domain Railway cung cấp)

## Bước 5: Deploy

1. Railway sẽ tự động deploy khi có thay đổi trên GitHub
2. Kiểm tra logs trong tab **Deployments**
3. Domain sẽ có dạng: `https://your-app-name.railway.app`

## Lưu ý quan trọng:

- **Puppeteer**: Railway có thể không hỗ trợ Puppeteer headless browser do giới hạn tài nguyên
- **Memory**: Ứng dụng có thể cần nâng cấp plan do sử dụng Puppeteer
- **Timeout**: Railway có timeout 30 giây cho requests, có thể cần tối ưu

## Troubleshooting:

1. **Build fails**: Kiểm tra logs trong tab Deployments
2. **Puppeteer error**: Có thể cần thêm dependencies hoặc chuyển sang plan cao hơn
3. **Timeout**: Tối ưu code để giảm thời gian xử lý

## Alternative cho Puppeteer:

Nếu Puppeteer không hoạt động trên Railway, có thể cân nhắc:
- Sử dụng Playwright
- Chuyển sang service riêng biệt cho automation
- Sử dụng browser automation service như Browserless 