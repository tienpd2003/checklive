/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GOOGLE_CLIENT_ID: '757073440374-rj3a9a7dja0iabl6fs0saesectomvguf.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: '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',
    GOOGLE_REFRESH_TOKEN: '1//0g59U2_RHB2SeCgYIARAAGBASNwF-L9Irc3s2n4jNeez9tqWabBN5Fg7md6lHARqE9mJTK_cADD5kNSeX4vP3NEZBiwV2829SKcw',
    SHEET_ID: '1nNfRFr83wepWMlgoBAasPVV5hCjR7w2ZaAU0bjWEEq4',
    GOOGLE_SCOPES: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.readonly https://mail.google.com/'
  }
}

module.exports = nextConfig 