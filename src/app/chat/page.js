'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { FaBars } from 'react-icons/fa';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import Sidebar from '@/components/Sidebar';

function ChatPageContent() {
    const searchParams = useSearchParams();
    const conversationIdFromParams = searchParams.get('conversationId') || null;

    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [conversationId, setConversationId] = useState(conversationIdFromParams);
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await fetch('/api/memory?all=1');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setConversations(data.conversations || []);
            } catch (err) {
                console.error('❌ Failed to fetch conversations:', err);
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (conversationId) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/memory?conversationId=${conversationId}`);
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setMessages(data.messages || []);
                } catch (err) {
                    console.error('❌ Failed to fetch messages:', err);
                    setMessages([
                        {
                            _id: `error-messages-${conversationId}`,
                            role: 'system',
                            content: 'Failed to load conversation. Please try again.',
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                }
                setLoading(false);
            } else {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [conversationId]);

    const handleNewChat = async () => {
        setConversationId(null);
        setMessages([]);
        setIsSidebarOpen(false);
    };

    const handleDeleteConversation = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/memory?conversationId=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setConversations((prev) => prev.filter((conv) => conv._id !== id));
            if (conversationId === id) {
                setConversationId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('❌ Failed to delete conversation:', err);
            setMessages((prev) => [
                ...prev,
                {
                    _id: `error-delete-${id}`,
                    role: 'system',
                    content: 'Failed to delete conversation. Please try again.',
                    createdAt: new Date().toISOString(),
                },
            ]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('📝 Handle Submit Triggered:', { input, file });

        if (!input.trim() && !file) {
            console.warn('⚠️ Empty input and no file, aborting submission');
            return;
        }

        if (loading) {
            console.warn('⚠️ Submission already in progress, aborting');
            return;
        }

        setLoading(true);

        let fileUrl = null;
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadData.secure_url && !uploadData.url) {
                    throw new Error('File upload failed: No URL returned');
                }
                fileUrl = uploadData.secure_url || uploadData.url;
                console.log('📁 File uploaded:', fileUrl);
            } catch (uploadErr) {
                console.error('❌ File upload failed:', uploadErr);
                setMessages((prev) => [
                    ...prev,
                    {
                        _id: `error-upload-${Date.now()}`,
                        role: 'system',
                        content: 'Failed to upload file. Please try again.',
                        createdAt: new Date().toISOString(),
                    },
                ]);
                setLoading(false);
                return;
            }
        }

        const userMsg = {
            role: 'user',
            content: input,
            fileUrl: fileUrl || null,
            conversationId,
            replyTo: null,
        };

        let userMsgId = null;
        let theConversationId = conversationId || null;
        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userMsg),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.details || data.error);
            userMsgId = data.messageId;
            theConversationId = data.conversationId || conversationId;
            setConversationId(theConversationId);

            setMessages((prev) => [
                ...prev,
                { ...userMsg, _id: userMsgId, createdAt: new Date().toISOString(), replyTo: null },
            ]);
            console.log('✅ User message saved:', data);

            if (!conversationId && data.conversationId) {
                const newConvo = {
                    _id: data.conversationId,
                    title: input.split(/\s+/).slice(0, 6).join(' ') || 'New Conversation',
                };
                setConversations((prev) => [newConvo, ...prev]);
            }
        } catch (err) {
            console.error('❌ Failed to save user message:', err);
            setMessages((prev) => [
                ...prev,
                {
                    _id: `error-save-${Date.now()}`,
                    role: 'system',
                    content: err.message || 'Failed to send message. Please try again.',
                    createdAt: new Date().toISOString(),
                },
            ]);
            setLoading(false);
            return;
        }

        setInput('');
        setFile(null);

        try {
            console.log('📡 Sending to /api/memory?stream=1:', {
                content: input,
                fileUrl,
                conversationId: theConversationId,
                replyTo: userMsgId,
                role: 'user',
            });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const res = await fetch(`/api/memory?stream=1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: input,
                    fileUrl,
                    conversationId: theConversationId,
                    replyTo: userMsgId,
                    role: 'user',
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            if (res.body && window.ReadableStream) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let done = false;
                let assistantMsgId = null;
                let assistantContent = '';
                let fileUrlReply = null;

                setMessages((prev) => [
                    ...prev,
                    {
                        _id: userMsgId + '-assistant-stream',
                        role: 'assistant',
                        content: '',
                        fileUrl: null,
                        createdAt: new Date().toISOString(),
                        replyTo: userMsgId,
                    },
                ]);
                console.log('🔄 Streaming assistant reply started...');

                while (!done) {
                    try {
                        const { value, done: doneReading } = await reader.read();
                        done = doneReading;
                        if (value) {
                            const chunk = decoder.decode(value, { stream: true });
                            console.log('📥 Received stream chunk:', chunk);
                            chunk.split('\n').forEach((line) => {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.replace('data: ', ''));
                                        console.log('📦 Parsed stream data:', data);
                                        if (data.error) {
                                            throw new Error(data.details || data.error);
                                        }
                                        if (data.delta) {
                                            assistantContent += data.delta;
                                            setMessages((prev) =>
                                                prev.map((m) =>
                                                    m._id === userMsgId + '-assistant-stream'
                                                        ? { ...m, content: assistantContent }
                                                        : m
                                                )
                                            );
                                        }
                                        if (data.done) {
                                            assistantMsgId = data.messageId;
                                            fileUrlReply = data.fileUrl || null;
                                            console.log('✅ Assistant streaming finished:', {
                                                assistantMsgId,
                                                fileUrlReply,
                                            });
                                        }
                                    } catch (parseErr) {
                                        console.warn('⚠️ Chunk parse error:', parseErr);
                                    }
                                }
                            });
                        } else if (done) {
                            console.log('🔚 Stream ended without data');
                        }
                    } catch (readErr) {
                        console.error('❌ Stream read error:', readErr);
                        throw readErr;
                    }
                }

                if (!assistantMsgId && !assistantContent) {
                    throw new Error('No assistant response received');
                }

                setMessages((prev) =>
                    prev.map((m) =>
                        m._id === userMsgId + '-assistant-stream'
                            ? {
                                ...m,
                                _id: assistantMsgId || userMsgId + '-assistant',
                                content: assistantContent,
                                fileUrl: fileUrlReply,
                                replyTo: userMsgId,
                            }
                            : m
                    )
                );
            } else {
                const data = await res.json();
                if (data.error) throw new Error(data.details || data.error);
                if (!data.messageId || !data.reply) {
                    throw new Error('Invalid assistant response');
                }
                setMessages((prev) => [
                    ...prev,
                    {
                        _id: data.messageId,
                        role: 'assistant',
                        content: data.reply,
                        fileUrl: data.fileUrl || null,
                        createdAt: new Date().toISOString(),
                        replyTo: userMsgId,
                    },
                ]);
                console.log('💬 Assistant non-streamed reply:', data);
            }
        } catch (err) {
            console.error('❌ Failed to get assistant reply:', err);
            setMessages((prev) => [
                ...prev,
                {
                    _id: `error-stream-${Date.now()}`,
                    role: 'system',
                    content:
                        err.name === 'AbortError'
                            ? 'Request timed out. Please try again.'
                            : err.message || 'Failed to get assistant reply. Please try again.',
                    createdAt: new Date().toISOString(),
                },
            ]);
        }

        setLoading(false);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:transform-none lg:static lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <Sidebar
                    conversations={conversations}
                    setConversationId={(id) => {
                        setConversationId(id);
                        setIsSidebarOpen(false);
                    }}
                    handleNewChat={handleNewChat}
                    handleDeleteConversation={handleDeleteConversation}
                    loading={loading}
                />
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2 text-gray-900 dark:text-white"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <FaBars className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="flex items-center justify-start p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Chat Assistant</h1>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <ChatMessages messages={messages} loading={loading} />
                    <div ref={messagesEndRef} />
                </div>
                <ChatInput
                    input={input}
                    setInput={setInput}
                    file={file}
                    setFile={setFile}
                    handleSubmit={handleSubmit}
                    loading={loading}
                />
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>}>
            <ChatPageContent />
        </Suspense>
    );
}