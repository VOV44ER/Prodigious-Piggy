import { ENV } from '@/config/env';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatCompletionResponse {
    content: string;
    error?: string;
}

export const sendChatMessage = async (
    messages: ChatMessage[],
    systemPrompt?: string
): Promise<ChatCompletionResponse> => {
    const apiKey = ENV.OPENAI_API_KEY;

    if (!apiKey) {
        return {
            content: '',
            error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.',
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: systemPrompt
                    ? [{ role: 'system', content: systemPrompt }, ...messages]
                    : messages,
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                content: '',
                error: errorData.error?.message || `API error: ${response.status} ${response.statusText}`,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        return { content };
    } catch (error) {
        return {
            content: '',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

