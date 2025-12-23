'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReaderSettings } from '@/lib/types';

interface TopBarProps {
    title: string;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onToggleMargin: () => void;
    settings: ReaderSettings;
    onSettingsChange: (settings: Partial<ReaderSettings>) => void;
}

export default function TopBar({
    title,
    theme,
    onToggleTheme,
    onToggleMargin,
    settings,
    onSettingsChange,
}: TopBarProps) {
    const router = useRouter();
    const [isHidden, setIsHidden] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const lastScrollY = useRef(0);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Auto-hide on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsHidden(true);
            } else {
                setIsHidden(false);
            }

            lastScrollY.current = currentScrollY;
        };

        // Show on mouse movement near top
        const handleMouseMove = (e: MouseEvent) => {
            if (e.clientY < 60) {
                setIsHidden(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Close settings on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    const handleBack = useCallback(() => {
        router.push('/');
    }, [router]);

    return (
        <>
            <header className={`topbar ${isHidden ? 'hidden' : ''}`}>
                <div className="topbar-left">
                    <button className="topbar-btn" onClick={handleBack} aria-label="Back to library">
                        ←
                    </button>
                    <span className="topbar-title">{title}</span>
                </div>

                <div className="topbar-controls">
                    <button
                        className="topbar-btn"
                        onClick={() => setShowSettings(prev => !prev)}
                        aria-label="Reading settings"
                    >
                        Aa
                    </button>
                    <button
                        className="topbar-btn"
                        onClick={onToggleTheme}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button
                        className="topbar-btn"
                        onClick={onToggleMargin}
                        aria-label="Toggle notes panel"
                    >
                        ☰
                    </button>
                </div>
            </header>

            {showSettings && (
                <div className="settings-panel" ref={settingsRef}>
                    <div className="settings-row">
                        <span className="settings-label">Font Size</span>
                        <input
                            type="range"
                            className="settings-slider"
                            min="14"
                            max="24"
                            value={settings.fontSize}
                            onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
                        />
                    </div>
                    <div className="settings-row">
                        <span className="settings-label">Line Height</span>
                        <input
                            type="range"
                            className="settings-slider"
                            min="1.4"
                            max="2.0"
                            step="0.1"
                            value={settings.lineHeight}
                            onChange={(e) => onSettingsChange({ lineHeight: Number(e.target.value) })}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
        .topbar-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
      `}</style>
        </>
    );
}
