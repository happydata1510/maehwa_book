"use client";
import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 기기 유형 감지
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedDeviceType = 'unknown';
    if (/android/.test(userAgent)) {
      detectedDeviceType = 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedDeviceType = 'ios';
    } else if (/windows|mac|linux/.test(userAgent)) {
      detectedDeviceType = 'desktop';
    }
    setDeviceType(detectedDeviceType as any);

    // PWA가 이미 설치되었는지 확인
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 리스너 (Android/Desktop)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 일정 시간 후 설치 버튼 표시 (beforeinstallprompt가 없어도)
    const timer = setTimeout(() => {
      if (!isStandalone && !isInWebAppiOS) {
        setShowInstallButton(true);
      }
    }, 1000); // 1초 후 표시

    // 개발/테스트용: 항상 버튼 표시 (PWA 조건 미충족시에도)
    if (!isStandalone && !isInWebAppiOS) {
      setShowInstallButton(true);
    }

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('Service Worker 등록 성공:', registration.scope);
        })
        .catch(function(error) {
          console.log('Service Worker 등록 실패:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    setShowModal(true);
  };

  const confirmInstall = async () => {
    setShowModal(false);

    if (deviceType === 'android' || deviceType === 'desktop') {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('사용자가 설치를 허용했습니다.');
          setShowInstallButton(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      }
    } else if (deviceType === 'ios') {
      // iOS 설치 안내 표시
      alert(`📱 홈화면에 추가하기:\n\n1. Safari 하단의 공유 버튼(↗️) 터치\n2. "홈 화면에 추가" 선택\n3. "추가" 버튼 터치`);
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'android':
        return '🤖';
      case 'ios':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '📲';
    }
  };

  const getDeviceName = () => {
    switch (deviceType) {
      case 'android':
        return '안드로이드';
      case 'ios':
        return '아이폰';
      case 'desktop':
        return '데스크탑';
      default:
        return '기기';
    }
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <>
      {/* 설치 버튼 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleInstallClick}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
        >
          {getDeviceIcon()}
          <span className="font-medium">{getDeviceName()}에 설치하기</span>
        </button>
      </div>

      {/* 설치 확인 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">{getDeviceIcon()}</div>
              <h3 className="text-lg font-bold mb-2">앱을 설치하시겠습니까?</h3>
              <p className="text-gray-600 text-sm mb-4">
                매화유치원 독서 기록 앱을 {getDeviceName()} 홈화면에 추가하면 더 편리하게 이용할 수 있습니다.
              </p>
              
              {deviceType === 'ios' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
                  <p className="font-medium mb-1">📋 설치 방법:</p>
                  <p>Safari 하단 공유 버튼(↗️) → &quot;홈 화면에 추가&quot;</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={confirmInstall}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  설치하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
