/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GOOGLE_SCOPES: process.env.GOOGLE_SCOPES || 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.readonly https://mail.google.com/'
  }
}

module.exports = nextConfig 