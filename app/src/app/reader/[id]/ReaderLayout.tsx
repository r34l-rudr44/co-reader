'use client';

import { useState, useCallback } from 'react';
import { Document as DocType, Highlight, ReaderSettings } from '@/lib/types';
import TopBar from './TopBar';
import ReaderPane from './ReaderPane';
import MarginNotesPanel from './MarginNotesPanel';

interface ReaderLayoutProps {
    document: DocType;
    pdfData: string | null;
    htmlContent: string | null;
}

export default function ReaderLayout({ document, pdfData, htmlContent }: ReaderLayoutProps) {
    const [marginOpen, setMarginOpen] = useState(false);
    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [settings, setSettings] = useState<ReaderSettings>({
        fontSize: 18,
        lineHeight: 1.7,
        theme: 'light',
    });

    const handleToggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        setSettings(prev => ({ ...prev, theme: newTheme }));

        // Update HTML data-theme attribute
        if (typeof window !== 'undefined') {
            window.document.documentElement?.setAttribute('data-theme', newTheme);
        }
    }, [theme]);

    const handleToggleMargin = useCallback(() => {
        setMarginOpen(prev => !prev);
        if (marginOpen) {
            setSelectedHighlight(null);
        }
    }, [marginOpen]);

    const handleHighlightClick = useCallback((highlight: Highlight) => {
        setSelectedHighlight(highlight);
        setMarginOpen(true);
    }, []);

    const handleCloseMargin = useCallback(() => {
        setMarginOpen(false);
        setSelectedHighlight(null);
    }, []);

    const handleSettingsChange = useCallback((newSettings: Partial<ReaderSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    return (
        <div
            className="reader-layout"
            data-margin-open={marginOpen}
            data-theme={theme}
        >
            <TopBar
                title={document.title}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                onToggleMargin={handleToggleMargin}
                settings={settings}
                onSettingsChange={handleSettingsChange}
            />

            <div className="reader-main">
                <MarginNotesPanel
                    isOpen={marginOpen}
                    highlight={selectedHighlight}
                    onClose={handleCloseMargin}
                />

                <ReaderPane
                    docData={document}
                    pdfData={pdfData}
                    htmlContent={htmlContent}
                    settings={settings}
                    onHighlightClick={handleHighlightClick}
                />
            </div>

            <style jsx>{`
        .reader-layout {
          min-height: 100vh;
          background: var(--bg-primary);
          transition: background var(--transition-normal);
        }

        .reader-main {
          display: flex;
          min-height: calc(100vh - var(--topbar-height));
        }
      `}</style>
        </div>
    );
}
