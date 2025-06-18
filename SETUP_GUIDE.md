# Hướng dẫn cấu hình chi tiết

## 1. Cấu hình Google Sheets API

### Bước 1: Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt Google Sheets API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google Sheets API" và enable

### Bước 2: Tạo Service Account
1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. **Bước 1 - Service account details:**
   - Service account name: `checklive-service`
   - Service account ID: sẽ tự động tạo
   - Description: `Service account for CheckLive app`
   - Click "CREATE AND CONTINUE"

4. **Bước 2 - Grant this service account access to project (Optional):**
   - Role: Chọn "Basic" > "Viewer" HOẶC có thể bỏ qua (skip)
   - Click "CONTINUE"
   
5. **Bước 3 - Grant users access to this service account (Optional):**
   - Có thể bỏ qua (skip)
   - Click "DONE"

6. Sau khi tạo xong, click vào service account vừa tạo
7. Vào tab "Keys" > "Add Key" > "Create new key" > chọn JSON
8. Download file JSON credentials

**Lưu ý quan trọng:** Quyền thực sự được cấp thông qua việc share Google Sheet với email service account, không phải thông qua IAM roles.

### Bước 3: Chia sẻ Google Sheet
1. Mở Google Sheet của bạn: [SHEET TOOL CANVA](https://docs.google.com/spreadsheets/d/1mSljCWqsqKIPQPZDPlQbiivG6zfkKwiR1Fno-CuM_OA/edit)
2. Click "Share" (nút màu xanh góc phải)
3. **Thêm email này**: `checklive@thayfamily.iam.gserviceaccount.com`
4. **Quyền**: Chọn "Viewer" (quyền xem)
5. Click "Send"
6. Đảm bảo sheet có 2 tab:
   - Tab "CANVAPRO": 
     - Cột A: Email addresses
     - Cột B: Team names
   - Tab "ADMIN FAM CANVA":
     - Cột A: Team names  
     - Cột B: Status (Live/Dead)

## 2. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc của project với nội dung:

```env
# Google Sheets Service Account Email (từ file JSON)
GOOGLE_SHEETS_CLIENT_EMAIL=checklive@thayfamily.iam.gserviceaccount.com

# Google Sheets Private Key (từ file JSON, nhớ thêm dấu ngoặc kép)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9oVUUyG9YBEYt\ntgt2oLEfrI69bGBOM7qc14pFeChaXtB6Oc/FrcqmXgty3NL0tpmKMy5dDWbFVWr7\nHkyA9oFxpGju8kldut70op1bvl724+wt585ERPbVvMQp99OnoGWa3QH8rTNI5L+A\nX0wAA+GcHoR57EZyc2Pj/awVBTre+2aM8+0iX1yPh7/3HVJEVcYYXxwweVDbFbWi\nkDYK34pVKX1DaEwSL+9kpaBJ7BVy2NkhGR5EhYDzYtUk5w2Mmu1bvCarhJPREs2A\nBB9aw2HIMfrpDFuka9uCq8HsRBWWOYs7GPlC11nUEJzQr3gXM04vi5j4Y9EninKt\nKu8DLG53AgMBAAECggEAJ2u6fC+OtgVtcWM+ztJo/+SnZ8l328n1KVXFcNuhx+ed\n/0q1XqraTeuPBbnSQP0Uvh4VrVJz4uH2821BCi40iqNbDRFhHxMR9lk3zTKuGzUW\njBR8VMTha11qii7y2Q4HEUKQfy6iUqz7AnzNF9O2uvW9JHtxyakjQuohM916d4//\n80VpHS2gMO9Gcl3JRd/NJ+bW7Iw8NMCAhuDba/Rhx7ibYiGNCKr4yvtUwQwlVhBW\n4l7dXPWp9m/hKhIqef90jFDOv8iTI0N6ZYDgkp25mzZmWReyapi5c1bq9Kd9Hm2q\nmCGdqUSXO83+v7iEjEUdqSLl/VAUrLtKbav869s8QQKBgQDnJumba3xKdgiQ9Iu7\n/LAv5rh5ASm9aj3TzMPPSoBTdUWmZhZSojunPbVME3XWJXq5Jt/KYslyqDyFog48\nG4oM7WZk//B7CWYdS0a2fCEvhs6y8v5hbSwYoJ2bOlXLKdHAr51q/J7hq9EXipGw\nXjU+XTg1AIKEisCqBjsOV+o2XQKBgQDSA8dX1DlBU/uDKPjKX4cqHgirigvqnAw+\n5Y5s0wQCySV43HnTXSnrcPhzjEeG9vnEOsE5gN6mfmAKxuFzj9iIa9RFV4+IP1uO\n0N0p+BH1Dm2fwmFXOP5x7tNoKzINlPC3WEsxeIlVbNjzzd8qZRS5azGVkiXPJxYD\naQih1j+C4wKBgQCcXVFXxp0cjb37uMGx2ByjOrL9gBDpRi4u0WyAFEi8rC8CgjqF\niaNK3c5/eQaUZ2QeTbLDaJIXUsEmMNrqRELdvdYvaocV4+TE2kAqf8u/J7U5jnEQ\nHNbgjf4vnIWe2lo+u02EqwEbbawS/bTSFthzqIG2MPMZj/cGzRI0ALq6LQKBgQC8\nyBbF9YguGC8LHKZfS/W1P2Atyp6hmvpLA5C+dASz+FoNxapg++r1sAw12dBmGtYz\ntVkBtrztzsXIijQY7CIJp1wdpPLp14IW49saodqKfRi/tjxH6nyWr8craUDKAqtL\nNDwLUT2qI3j114aWllxFvHzK5Z/FEW5xTFYtG+jlXwKBgGVOku5OqdezVdV+fFvz\nKjxplk4whdAp0+tP8wYXVuyupVMgGQc7D9fMoMfQSLLTjYceD8i9vOWRFFCicl2I\nbgcLYY9uJOwlYSgX2jgre6rMTjvpfhrnGa4G1ftlLX6aToV4Gc6K3QwEjReNhFDz\ng9PbaDCVawvPmq+dDD/GJS+8\n-----END PRIVATE KEY-----\n"

# Sheet ID (đã được cấu hình sẵn)
SHEET_TOOL_CANVA_ID=1mSljCWqsqKIPQPZDPlQbiivG6zfkKwiR1Fno-CuM_OA
```

### Thông tin từ file JSON của bạn:
- `client_email`: `checklive@thayfamily.iam.gserviceaccount.com` ✅
- `private_key`: Đã được cấu hình sẵn ✅
- `project_id`: `thayfamily` 

**Bước tiếp theo quan trọng**: Share Google Sheet với email `checklive@thayfamily.iam.gserviceaccount.com`

## 3. Cấu trúc dữ liệu trong Sheet

### Tab "CANVAPRO":
```
A               B
email1@mail.com Team1
email2@mail.com Team2
email3@mail.com Team1
```

### Tab "ADMIN FAM CANVA":
```
A       B
Team1   Live
Team2   Dead
Team3   Live
```

## 4. Chạy ứng dụng

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy development server:
```bash
npm run dev
```

3. Mở browser tại: http://localhost:3000

## 5. Test chức năng

1. Nhập email có trong tab "CANVAPRO"
2. System sẽ:
   - Tìm team của email đó
   - Check status của team trong tab "ADMIN FAM CANVA"
   - Nếu Live: hiển thị "Live"
   - Nếu Dead: hiển thị "Requires Update" và link mời mới

## Troubleshooting

### Lỗi "Error 403: Forbidden"
- Kiểm tra xem service account đã được share quyền truy cập Sheet chưa
- Kiểm tra Google Sheets API đã được enable chưa

### Lỗi "Error parsing private key"
- Đảm bảo private key được bao quanh bởi dấu ngoặc kép
- Đảm bảo các ký tự `\n` được giữ nguyên

### Không tìm thấy email/team
- Kiểm tra cấu trúc dữ liệu trong sheet
- Đảm bảo tên tab chính xác: "CANVAPRO" và "ADMIN FAM CANVA" 