import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/conversation';
import Message from '@/models/message';

export async function GET(req) {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const all = searchParams.get('all');

    if (all === '1') {
        try {
            const conversations = await Conversation.find().sort({ createdAt: -1 }).lean();
            console.log('📚 Fetched all conversations:', conversations.length);
            return NextResponse.json({ conversations });
        } catch (err) {
            //   Common crawl failed: Network error occurred.See the Network tab for more information.
            console.error('❌ Error fetching conversations:', err);
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }
    }

    if (conversationId) {
        try {
            const messages = await Message.find({ conversationId })
                .sort({ createdAt: 1 })
                .lean();
            console.log('📜 Fetched messages for conversation:', conversationId);
            return NextResponse.json({ messages });
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function DELETE(req) {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    try {
        await Conversation.findByIdAndDelete(conversationId);
        await Message.deleteMany({ conversationId });
        console.log('🗑️ Deleted conversation:', conversationId);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('❌ Error deleting conversation:', err);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}

// Existing POST handler remains unchanged
export async function POST(req) {
    await dbConnect();

    let body;
    try {
        body = await req.json();
        console.log('📦 Received POST /api/memory body:', body);
    } catch (err) {
        console.error('❌ Invalid JSON body in POST /api/memory:', err);
        return NextResponse.json({ error: 'Invalid JSON body', details: err.message }, { status: 400 });
    }

    const { content, fileUrl, role, conversationId, replyTo } = body;
    const isStreaming = new URL(req.url).searchParams.get('stream') === '1';

    if (role === 'user' && !content?.trim() && !fileUrl) {
        console.warn('⚠️ Invalid user message: no content or file');
        return NextResponse.json({ error: 'Message content or file required' }, { status: 400 });
    }

    if (!conversationId && role === 'user') {
        console.log('🆕 Creating new conversation...');
        try {
            const newTitle = content?.trim()?.split(/\s+/).slice(0, 6).join(' ') || 'New Conversation';
            const convo = await Conversation.create({ title: newTitle });
            const msg = await Message.create({
                conversationId: convo._id,
                role: 'user',
                content: content || '',
                fileUrl: fileUrl || null,
            });
            await convo.updateOne({ $push: { messages: msg._id } });

            console.log('✅ Created new conversation and initial message:', {
                conversationId: convo._id,
                messageId: msg._id,
            });
            return NextResponse.json({ conversationId: convo._id, messageId: msg._id });
        } catch (err) {
            console.error('❌ Error creating conversation and message:', err);
            return NextResponse.json({ error: 'Failed to create conversation', details: err.message }, { status: 500 });
        }
    }

    if (conversationId && role === 'user' && !isStreaming) {
        console.log('✍️ Adding user message to existing conversation:', conversationId);
        try {
            const convo = await Conversation.findById(conversationId);
            if (!convo) {
                console.warn('⚠️ Conversation not found:', conversationId);
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }
            const msg = await Message.create({
                conversationId,
                role: 'user',
                content: content || '',
                fileUrl: fileUrl || null,
            });
            await Conversation.findByIdAndUpdate(conversationId, { $push: { messages: msg._id } });

            console.log('✅ Saved user message:', msg._id);
            return NextResponse.json({ messageId: msg._id, conversationId });
        } catch (err) {
            console.error('❌ Error saving user message:', err);
            return NextResponse.json({ error: 'Failed to save message', details: err.message }, { status: 500 });
        }
    }

    if (conversationId && isStreaming) {
        console.log('🤖 Handling assistant reply for conversation:', conversationId, 'replyTo:', replyTo);
        try {
            const convo = await Conversation.findById(conversationId).populate('messages');
            if (!convo) {
                console.warn('⚠️ Conversation not found:', conversationId);
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            const sortedMessages = convo.messages.sort((a, b) => a.createdAt - b.createdAt);
            const chatHistory = [
                { role: 'system', content: 'You are a helpful assistant.' },
                ...sortedMessages.map((msg) => ({
                    role: msg.role,
                    content: msg.content + (msg.fileUrl ? `\n\nAttached file: ${msg.fileUrl}` : ''),
                })),
            ];

            const trimmedMessages = chatHistory.length > 20
                ? [chatHistory[0], ...chatHistory.slice(-19)]
                : chatHistory;

            console.log('📜 Chat history for assistant:', trimmedMessages);

            console.log('📡 Starting streaming assistant response...');
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    let fullContent = '';
                    try {
                        console.log('🚀 Initiating OpenAI stream...');
                        const completion = await openai.chat.completions.create({
                            model: 'gpt-3.5-turbo',
                            messages: trimmedMessages,
                            stream: true,
                        });

                        for await (const chunk of completion) {
                            const delta = chunk.choices?.[0]?.delta?.content || '';
                            console.log('📥 Stream chunk:', delta);
                            if (delta) {
                                fullContent += delta;
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                            }
                        }

                        const msg = await Message.create({
                            conversationId,
                            role: 'assistant',
                            content: fullContent,
                            fileUrl: fileUrl || null,
                            replyTo: replyTo || null,
                        });
                        await Conversation.findByIdAndUpdate(conversationId, { $push: { messages: msg._id } });

                        console.log('✅ Streaming complete. Assistant message saved:', msg._id);
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    done: true,
                                    messageId: msg._id,
                                    fileUrl: fileUrl || null,
                                })}\n\n`
                            )
                        );
                    } catch (err) {
                        console.error('❌ Streaming assistant error:', err);
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ error: 'Streaming error', details: err.message })}\n\n`)
                        );
                    }
                    controller.close();
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } catch (err) {
            console.error('❌ Error generating assistant reply:', err);
            return NextResponse.json({ error: 'Failed to generate reply', details: err.message }, { status: 500 });
        }
    }

    console.warn('⚠️ No matching logic triggered for request body:', body);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}