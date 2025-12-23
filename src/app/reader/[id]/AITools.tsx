'use client';

import { useState, useCallback } from 'react';
import { Highlight, AIOutputType } from '@/lib/types';
import {
    generateAIResponse,
    saveAIOutput,
    getAITypeLabel,
    getAITypeDescription,
} from '@/lib/ai';

interface AIToolsProps {
    highlight: Highlight;
    onOutputGenerated?: () => void;
}

const AI_TYPES: AIOutputType[] = ['clarify', 'assumptions', 'questions'];

export default function AITools({ highlight, onOutputGenerated }: AIToolsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingType, setLoadingType] = useState<AIOutputType | null>(null);
    const [result, setResult] = useState<{ type: AIOutputType; content: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (type: AIOutputType) => {
        setIsLoading(true);
        setLoadingType(type);
        setError(null);
        setResult(null);

        try {
            // Get API key from localStorage if available
            const settings = localStorage.getItem('coreader_settings');
            const apiKey = settings ? JSON.parse(settings).openaiApiKey : null;

            const content = await generateAIResponse(type, highlight.text, undefined, apiKey);

            setResult({ type, content });
        } catch (err: any) {
            setError(err.message || 'Failed to generate response');
        } finally {
            setIsLoading(false);
            setLoadingType(null);
        }
    }, [highlight.text]);

    const handleSaveAsNote = useCallback(() => {
        if (!result) return;

        saveAIOutput(highlight.id, result.type, result.content);
        onOutputGenerated?.();

        // Keep the result visible but show confirmation
        setError(null);
    }, [result, highlight.id, onOutputGenerated]);

    const handleDismiss = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return (
        <div className="ai-tools">
            <div className="ai-tools-header">
                <h4 className="ai-tools-title">AI Co-Reader</h4>
            </div>

            {!result && (
                <div className="ai-tools-buttons">
                    {AI_TYPES.map((type) => (
                        <button
                            key={type}
                            className="ai-tool-btn"
                            onClick={() => handleGenerate(type)}
                            disabled={isLoading}
                        >
                            <span className="ai-tool-label">{getAITypeLabel(type)}</span>
                            <span className="ai-tool-desc">{getAITypeDescription(type)}</span>
                            {loadingType === type && (
                                <span className="ai-tool-loading">...</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <div className="ai-error">
                    {error}
                </div>
            )}

            {result && (
                <div className="ai-result">
                    <div className="ai-result-header">
                        <span className="ai-result-type">{getAITypeLabel(result.type)}</span>
                        <button className="ai-result-close" onClick={handleDismiss}>×</button>
                    </div>
                    <div className="ai-result-content">
                        {result.content.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                        ))}
                    </div>
                    <div className="ai-result-actions">
                        <button className="ai-result-save" onClick={handleSaveAsNote}>
                            Save as Note
                        </button>
                        <button className="ai-result-retry" onClick={() => handleGenerate(result.type)}>
                            Regenerate
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .ai-tools {
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-lg);
                    border-top: 1px solid var(--border-color);
                }

                .ai-tools-header {
                    margin-bottom: var(--spacing-sm);
                }

                .ai-tools-title {
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    margin: 0;
                }

                .ai-tools-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xs);
                }

                .ai-tool-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: var(--spacing-sm);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-align: left;
                }

                .ai-tool-btn:hover:not(:disabled) {
                    background: var(--bg-panel);
                    border-color: var(--hl-definition-solid);
                }

                .ai-tool-btn:disabled {
                    opacity: 0.6;
                    cursor: wait;
                }

                .ai-tool-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .ai-tool-desc {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-top: 2px;
                }

                .ai-tool-loading {
                    margin-left: auto;
                    color: var(--hl-definition-solid);
                }

                .ai-error {
                    padding: var(--spacing-sm);
                    font-size: 13px;
                    color: var(--hl-question-solid);
                    background: var(--hl-question);
                    border-radius: 4px;
                    margin-top: var(--spacing-sm);
                }

                .ai-result {
                    margin-top: var(--spacing-sm);
                    background: var(--bg-secondary);
                    border-radius: 6px;
                    overflow: hidden;
                }

                .ai-result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: var(--bg-panel);
                    border-bottom: 1px solid var(--border-color);
                }

                .ai-result-type {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--hl-definition-solid);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .ai-result-close {
                    width: 20px;
                    height: 20px;
                    padding: 0;
                    font-size: 16px;
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .ai-result-close:hover {
                    color: var(--text-primary);
                }

                .ai-result-content {
                    padding: var(--spacing-md);
                    font-size: 14px;
                    line-height: 1.6;
                    color: var(--text-primary);
                    max-height: 300px;
                    overflow-y: auto;
                }

                .ai-result-content p {
                    margin: 0 0 var(--spacing-xs) 0;
                }

                .ai-result-content p:last-child {
                    margin-bottom: 0;
                }

                .ai-result-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-top: 1px solid var(--border-color);
                }

                .ai-result-save,
                .ai-result-retry {
                    flex: 1;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    font-size: 13px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .ai-result-save {
                    color: white;
                    background: var(--hl-definition-solid);
                    border: none;
                }

                .ai-result-save:hover {
                    opacity: 0.9;
                }

                .ai-result-retry {
                    color: var(--text-secondary);
                    background: transparent;
                    border: 1px solid var(--border-color);
                }

                .ai-result-retry:hover {
                    background: var(--bg-panel);
                }
            `}</style>
        </div>
    );
}
