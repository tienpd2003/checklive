#!/bin/bash

echo "🚀 Setting up VPS for Puppeteer with GUI support..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install essential packages
sudo apt install -y \
    wget \
    curl \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install Xvfb for virtual display (if no desktop environment)
sudo apt install -y xvfb

# Install fonts (prevent font-related issues)
sudo apt install -y \
    fonts-liberation \
    fonts-roboto \
    fonts-noto-color-emoji \
    fonts-noto-cjk

# Optional: Install lightweight desktop environment
# sudo apt install -y xfce4 xfce4-goodies

# Set environment variables
echo 'export DISPLAY=:99' >> ~/.bashrc
echo 'export CHROME_BIN=/usr/bin/google-chrome' >> ~/.bashrc

# Create systemd service for Xvfb (virtual display)
sudo tee /etc/systemd/system/xvfb.service > /dev/null <<EOF
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -screen 0 1366x768x24
Restart=on-abort
User=root

[Install]
WantedBy=multi-user.target
EOF

# Enable and start Xvfb service
sudo systemctl enable xvfb
sudo systemctl start xvfb

# Install PM2 for process management
sudo npm install -g pm2

echo "✅ VPS setup completed!"
echo "📝 Next steps:"
echo "1. Clone your project"
echo "2. Run: npm install"
echo "3. Set up environment variables"
echo "4. Start with: pm2 start npm --name 'checklive' -- start"
echo ""
echo "🔍 Useful commands:"
echo "- Check Xvfb: sudo systemctl status xvfb"
echo "- Test Chrome: google-chrome --version"
echo "- Set display: export DISPLAY=:99" 