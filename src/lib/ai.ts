// AI Co-Reader Utilities
// Controlled AI features for reading augmentation

import { Highlight, AIOutput, AIOutputType } from './types';
import { v4 as uuidv4 } from 'uuid';

const AI_OUTPUTS_KEY = 'coreader_ai_outputs';

// ============================================
// AI Prompt Templates
// ============================================

const PROMPT_TEMPLATES: Record<AIOutputType, (text: string, context?: string) => string> = {
    clarify: (text) => `
Rephrase the following passage in simpler, clearer language while preserving the original meaning.
Do not add new information or interpretations. Keep the same logical structure.

Passage:
"${text}"

Rephrased version:`.trim(),

    assumptions: (text) => `
Identify 2-4 implicit assumptions in the following passage.
Focus on unstated premises the author takes for granted.
Be specific and concise. Format as a numbered list.

Passage:
"${text}"

Implicit assumptions:`.trim(),

    questions: (text) => `
Generate 2-4 discussion questions based on the following passage.
Questions should encourage deeper thinking about the ideas, not simple comprehension.
Format as a numbered list.

Passage:
"${text}"

Discussion questions:`.trim(),

    synthesis: (text, context) => `
Create a brief synthesis of the following highlighted passages from a document.
Connect the ideas, identify common themes, and note any tensions or contradictions.
Keep the synthesis concise (2-3 paragraphs maximum).

${context ? `Document context: ${context}\n\n` : ''}Highlighted passages:
${text}

Synthesis:`.trim(),
};

// ============================================
// AI Output Storage
// ============================================

/**
 * Get all AI outputs
 */
export function getAllAIOutputs(): AIOutput[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(AI_OUTPUTS_KEY);
    if (!stored) return [];

    try {
        const outputs = JSON.parse(stored);
        return outputs.map((o: AIOutput) => ({
            ...o,
            createdAt: new Date(o.createdAt),
        }));
    } catch {
        return [];
    }
}

/**
 * Get AI outputs for a specific highlight
 */
export function getAIOutputsByHighlight(highlightId: string): AIOutput[] {
    return getAllAIOutputs().filter(o => o.highlightId === highlightId);
}

/**
 * Save AI output
 */
export function saveAIOutput(
    highlightId: string,
    type: AIOutputType,
    content: string
): AIOutput {
    const output: AIOutput = {
        id: uuidv4(),
        highlightId,
        type,
        content,
        createdAt: new Date(),
    };

    const outputs = getAllAIOutputs();
    outputs.push(output);

    if (typeof window !== 'undefined') {
        localStorage.setItem(AI_OUTPUTS_KEY, JSON.stringify(outputs));
    }

    return output;
}

/**
 * Delete AI output
 */
export function deleteAIOutput(id: string): boolean {
    const outputs = getAllAIOutputs();
    const filtered = outputs.filter(o => o.id !== id);

    if (filtered.length === outputs.length) return false;

    if (typeof window !== 'undefined') {
        localStorage.setItem(AI_OUTPUTS_KEY, JSON.stringify(filtered));
    }

    return true;
}

/**
 * Delete all AI outputs for a highlight
 */
export function deleteAIOutputsByHighlight(highlightId: string): void {
    const outputs = getAllAIOutputs();
    const filtered = outputs.filter(o => o.highlightId !== highlightId);

    if (typeof window !== 'undefined') {
        localStorage.setItem(AI_OUTPUTS_KEY, JSON.stringify(filtered));
    }
}

// ============================================
// AI Generation (Mock Implementation)
// ============================================

/**
 * Generate AI response
 * 
 * Note: This is a placeholder implementation. 
 * In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
 * The API key would be configured by the user in settings.
 */
export async function generateAIResponse(
    type: AIOutputType,
    text: string,
    context?: string,
    apiKey?: string
): Promise<string> {
    const prompt = PROMPT_TEMPLATES[type](text, context);

    // If API key is provided, use real API
    if (apiKey) {
        return callAIAPI(prompt, apiKey);
    }

    // Otherwise, return a helpful placeholder
    return generatePlaceholderResponse(type, text);
}

/**
 * Call AI API (placeholder - would integrate with actual provider)
 */
async function callAIAPI(prompt: string, apiKey: string): Promise<string> {
    // This is where you would integrate with OpenAI, Anthropic, etc.
    // Example for OpenAI:
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a thoughtful reading assistant helping a reader engage more deeply with texts. Be concise and insightful.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
        console.error('AI API error:', error);
        throw new Error('Failed to generate AI response. Please check your API key.');
    }
}

/**
 * Generate placeholder response for demo purposes
 */
function generatePlaceholderResponse(type: AIOutputType, text: string): string {
    const wordCount = text.split(/\s+/).length;

    switch (type) {
        case 'clarify':
            return `[AI Clarification would appear here]\n\nTo enable AI features, add your OpenAI API key in Settings.\n\nOriginal text (${wordCount} words) would be rephrased in simpler language.`;

        case 'assumptions':
            return `[AI Assumption Analysis would appear here]\n\n1. First implicit assumption in the passage\n2. Second implicit assumption\n3. Third implicit assumption\n\nTo enable AI features, add your OpenAI API key in Settings.`;

        case 'questions':
            return `[AI Discussion Questions would appear here]\n\n1. What are the implications of this perspective?\n2. How does this connect to broader themes?\n3. What counterarguments might exist?\n\nTo enable AI features, add your OpenAI API key in Settings.`;

        case 'synthesis':
            return `[AI Synthesis would appear here]\n\nThis synthesis would connect the highlighted passages, identify common themes, and note any tensions.\n\nTo enable AI features, add your OpenAI API key in Settings.`;
    }
}

/**
 * Get AI feature label
 */
export function getAITypeLabel(type: AIOutputType): string {
    switch (type) {
        case 'clarify': return 'Clarification';
        case 'assumptions': return 'Assumptions';
        case 'questions': return 'Discussion Questions';
        case 'synthesis': return 'Synthesis';
    }
}

/**
 * Get AI feature description
 */
export function getAITypeDescription(type: AIOutputType): string {
    switch (type) {
        case 'clarify': return 'Rephrase in simpler language';
        case 'assumptions': return 'Identify implicit assumptions';
        case 'questions': return 'Generate discussion questions';
        case 'synthesis': return 'Synthesize multiple highlights';
    }
}
