# Hướng dẫn Deploy lên Render

## Chuẩn bị

1. **Push code lên GitHub** (nếu chưa có):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Deploy lên Render

### Cách 1: Sử dụng render.yaml (Khuyến nghị)

1. Truy cập [Render.com](https://render.com)
2. Đăng nhập và kết nối GitHub repository
3. Chọn "New" > "Blueprint" 
4. Chọn repository `CheckLive`
5. Render sẽ tự động đọc file `render.yaml`

### Cách 2: Manual Setup

1. Truy cập [Render.com](https://render.com)
2. Chọn "New" > "Web Service"
3. Kết nối GitHub repository `CheckLive`
4. Cấu hình:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free

## Cấu hình Environment Variables

Sau khi tạo service, vào Settings > Environment và thêm các biến:

```
GOOGLE_CLIENT_ID=757073440374-rj3a9a7dja0iabl6fs0saesectomvguf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//0g59U2_RHB2SeCgYIARAAGBASNwF-L9Irc3s2n4jNeez9tqWabBN5Fg7md6lHARqE9mJTK_cADD5kNSeX4vP3NEZBiwV2829SKcw
SHEET_ID=1nNfRFr83wepWMlgoBAasPVV5hCjR7w2ZaAU0bjWEEq4
GOOGLE_SCOPES=https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.readonly https://mail.google.com/


NODE_ENV=production
```

## Lưu ý quan trọng

1. **Puppeteer**: Render free plan có thể không hỗ trợ Puppeteer. Nếu gặp lỗi, có thể cần upgrade plan.

2. **Memory Limit**: Free plan có giới hạn 512MB RAM. Nếu app crash, cần optimize hoặc upgrade.

3. **Auto-Deploy**: Render sẽ tự động deploy lại khi bạn push code mới lên GitHub.

## Troubleshooting

### Nếu build fail:
1. Kiểm tra logs trong Render dashboard
2. Đảm bảo tất cả environment variables đã được set
3. Kiểm tra Node.js version compatibility

### Nếu Puppeteer lỗi:
1. Sử dụng Docker deployment (với Dockerfile đã tạo)
2. Hoặc upgrade lên paid plan của Render

## Alternative: Docker Deployment

Nếu Render free plan không hoạt động, bạn có thể deploy trên:
- Railway.app
- Vercel (nhưng có giới hạn với Puppeteer)
- DigitalOcean App Platform
- Heroku (có Docker support)

Sử dụng Dockerfile đã được tạo sẵn trong project. 