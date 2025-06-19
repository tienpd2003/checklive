/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: true
  },
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    SHEET_ID: process.env.SHEET_ID,
    GOOGLE_SCOPES: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.readonly https://mail.google.com/'
  }
}

module.exports = nextConfig 