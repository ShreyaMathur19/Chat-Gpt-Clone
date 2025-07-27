// app/api/chat/route.js

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req) {
    try {
        const { content, fileUrl } = await req.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        const messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: content + (fileUrl ? `\n\nAttached file: ${fileUrl}` : '') },
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
        });

        const reply = response.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (err) {
        console.error('Chat API error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
