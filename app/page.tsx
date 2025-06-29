'use client';

import { useState } from 'react';
import { ClipboardIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

type ResponseData = {
  status: 'live' | 'die' | 'error';
  message: string;
  data?: {
    team?: string;
    ttkh?: string;
    account?: string;
    password?: string;
    dateRenew?: string;
    maDonHang?: string;
    options?: string;
    ngayHetHan?: string;
    con?: string;
    oldTeam?: string;
    newTeam?: string;
    newAccount?: string;
    newPassword?: string;
    inviteLink?: string;
  };
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ResponseData | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [showNotification, setShowNotification] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCheck = async () => {
    if (!email) return;
    
    // Show notification when starting check
    setShowNotification(true);
    setStatus('loading');
    
    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setResult(data);
      setStatus('success');
      setLastCheck(new Date().toLocaleString());
      // Hide notification when getting result
      setShowNotification(false);
    } catch (error) {
      setStatus('error');
      setResult(null);
      // Hide notification when getting error
      setShowNotification(false);
    }
  };

  const handleTransferTeam = async () => {
    if (!email) return;
    
    setTransferStatus('loading');
    try {
      const response = await fetch('/api/transfer-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setResult(prev => ({
          ...prev!,
          data: {
            ...prev!.data,
            inviteLink: data.data.inviteLink,
            newTeam: data.data.newTeam
          }
        }));
        setTransferStatus('success');
      } else {
        setTransferStatus('error');
      }
    } catch (error) {
      setTransferStatus('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const texts = {
    vi: {
      home: 'Trang Chủ',
      checkStatus: 'Kiểm Tra Trạng Thái CheckLive',
      emailPlaceholder: 'Nhập email của bạn',
      checkAccount: 'Kiểm Tra Trạng Thái Tài Khoản',
      checking: 'Đang kiểm tra...',
      lastCheck: 'Kiểm tra lần cuối:',
      reload: 'TẢI LẠI TRANG',
      accountLimit: 'Hạn sử dụng tài khoản đến ngày:',
      darkMode: 'Dark Mode',
      checkingNotification: 'Đang kiểm tra thông tin tài khoản. Vui lòng đợi một lát!'
    },
    en: {
      home: 'Home',
      checkStatus: 'Check CheckLive Status',
      emailPlaceholder: 'Enter your email',
      checkAccount: 'Check Account Status',
      checking: 'Checking...',
      lastCheck: 'Last check:',
      reload: 'RELOAD PAGE',
      accountLimit: 'Account usage limit until:',
      darkMode: 'Dark Mode',
      checkingNotification: 'Checking account information. Please wait a moment!'
    }
  };

  const t = texts[language];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700'
    }`}>
      {/* Header */}
      <header className={`${
        isDarkMode ? 'bg-gray-800/50' : 'bg-white/10'
      } backdrop-blur-sm border-b ${
        isDarkMode ? 'border-gray-700' : 'border-white/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-2">
              <div 
                className={`flex items-center space-x-1 text-sm cursor-pointer transition-opacity hover:opacity-80 ${
                  isDarkMode ? 'text-gray-300' : 'text-white/80'
                }`}
                onClick={() => window.location.href = '/'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t.home}</span>
              </div>
            </div>

            {/* Language and Dark Mode */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                    language === 'vi'
                      ? isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                      : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-semibold">🇻🇳 VI</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                    language === 'en'
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-semibold">🇺🇸 EN</span>
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-blue-600' : 'bg-gray-400'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-white/80'
                }`}>
                  {t.darkMode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className={`${
          isDarkMode ? 'bg-gray-800/60' : 'bg-white/90'
        } backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold text-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {t.checkStatus}
            </h2>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Email Input */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                        : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                  <button
                    onClick={() => copyToClipboard(email)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-opacity-20 ${
                      isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <ClipboardIcon className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={handleCheck}
                  disabled={status === 'loading' || !email}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {status === 'loading' ? t.checking : t.checkAccount}
                </button>
              </div>

              {/* Last Check Info */}
              {lastCheck && (
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.lastCheck} {lastCheck}
                    </span>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>{t.reload}</span>
                  </button>
                </div>
              )}

              {/* Results */}
              {status === 'success' && result && (
                <div className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Status:
                    </span>
                    <span className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider ${
                      result.status === 'live' 
                        ? 'bg-green-500 text-white' 
                        : result.status === 'die' 
                        ? 'bg-red-500 text-white'
                        : isDarkMode 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-400 text-white'
                    }`}>
                      {result.status === 'live' ? 'Live' : result.status === 'die' ? 'Die' : 'Error'}
                    </span>
                  </div>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {result.message}
                  </p>
                  
                  {result.data && (
                    <div className="space-y-4">
                      {result.status === 'live' && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>MÃ ĐƠN HÀNG:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.maDonHang}</p>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>TTKH:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.ttkh}</p>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>OPTIONS:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.options}</p>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>NGÀY HẾT HẠN:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.ngayHetHan}</p>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>CÒN:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.con}</p>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>TEAM:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.team}</p>
                          
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Date Renew:</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.dateRenew}</p>
                        </div>
                      )}

                      {result.status === 'die' && (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Team:</p>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.oldTeam}</p>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>TTKH:</p>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{result.data.ttkh}</p>
                            
                          </div>

                          <div className="mt-6 space-y-4">
                            <button
                              onClick={handleTransferTeam}
                              disabled={transferStatus === 'loading'}
                              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {transferStatus === 'loading' ? 'Đang chuyển team...' : 'Chuyển Team'}
                            </button>

                            {result.data.inviteLink && (
                              <div className={`p-4 rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Link mời:</p>
                                  <button
                                    onClick={() => {
                                      const textToCopy = `Link mời:\n${result.data?.inviteLink || ''}\n\nĐã chuyển sang team: ${result.data?.newTeam || ''}`;
                                      navigator.clipboard.writeText(textToCopy)
                                        .then(() => {
                                          // Đổi icon thành dấu tích
                                          setIsCopied(true);
                                          
                                          // Hiển thị thông báo nhỏ
                                          const toast = document.createElement('div');
                                          toast.className = `fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300`;
                                          toast.textContent = 'Đã copy thành công!';
                                          document.body.appendChild(toast);
                                          
                                          // Đổi lại icon copy sau 2 giây
                                          setTimeout(() => {
                                            setIsCopied(false);
                                          }, 2000);
                                          
                                          // Xóa thông báo sau 2 giây
                                          setTimeout(() => {
                                            toast.style.opacity = '0';
                                            setTimeout(() => {
                                              document.body.removeChild(toast);
                                            }, 300);
                                          }, 2000);
                                        })
                                        .catch(() => {
                                          // Hiển thị thông báo lỗi nếu có
                                          const toast = document.createElement('div');
                                          toast.className = `fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300`;
                                          toast.textContent = 'Không thể copy!';
                                          document.body.appendChild(toast);
                                          
                                          setTimeout(() => {
                                            toast.style.opacity = '0';
                                            setTimeout(() => {
                                              document.body.removeChild(toast);
                                            }, 300);
                                          }, 2000);
                                        });
                                    }}
                                    className={`p-1 rounded hover:bg-opacity-20 ${
                                      isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                    } ${isCopied ? 'bg-green-500 text-white' : ''}`}
                                    title="Copy tất cả thông tin"
                                  >
                                    {isCopied ? (
                                      <CheckIcon className="h-4 w-4" />
                                    ) : (
                                      <ClipboardIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <p className={`mt-2 text-sm break-all ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {result.data.inviteLink}
                                </p>
                                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <span className="font-bold">Đã chuyển sang team:</span> {result.data.newTeam}
                                </p>
                              </div>
                            )}

                            {transferStatus === 'error' && (
                              <p className="text-red-500">Có lỗi xảy ra khi chuyển team. Vui lòng thử lại.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                  {result?.message || 'An error occurred while checking the status. Please try again.'}
                </div>
              )}

              {/* Account Usage Limit */}
              <div className={`text-center p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.accountLimit}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className={`mt-2 flex items-center justify-center space-x-2 mx-auto px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                      : 'bg-cyan-500 text-white hover:bg-cyan-600'
                  }`}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>{t.reload}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 border-blue-500 max-w-sm ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-blue-400' 
              : 'bg-white text-gray-900 border-blue-500'
          }`}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {t.checkingNotification}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className={`ml-auto pl-3 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 