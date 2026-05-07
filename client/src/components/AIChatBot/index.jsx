import React, { useState, useRef, useEffect, useContext } from 'react';
import { MyContext } from '../../App';
import './style.css';

/**
 * Parse markdown đơn giản: **bold**, *italic*, dấu gạch đầu dòng, xuống dòng
 */
function parseMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="chat-link" style="color: #6c63ff; font-weight: 600; text-decoration: underline;">$1</a>')
        .replace(/^[\-•]\s(.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br/>');
}

const API_URL = import.meta.env.VITE_API_URL;

export default function AIChatBot() {
    const context = useContext(MyContext);
    const { isLogin, userData } = context;

    console.log("%c🤖 AI ChatBot is mounting...", "color: #6c63ff; font-weight: bold; font-size: 14px;");

    const [isOpen, setIsOpen] = useState(false);
    
    // Khôi phục tin nhắn từ localStorage hoặc mảng rỗng
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('merch4u_chat_history');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    
    // Khôi phục trạng thái đã chào
    const [hasGreeted, setHasGreeted] = useState(() => {
        return localStorage.getItem('merch4u_chat_greeted') === 'true';
    });

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Tự động lưu tin nhắn và trạng thái chào vào localStorage
    useEffect(() => {
        localStorage.setItem('merch4u_chat_history', JSON.stringify(messages));
        localStorage.setItem('merch4u_chat_greeted', hasGreeted.toString());
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, hasGreeted]);

    // RESET khi Đăng xuất: Chỉ xóa nếu thực sự không còn accessToken trong localStorage
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setMessages([]);
            setHasGreeted(false);
            localStorage.removeItem('merch4u_chat_history');
            localStorage.removeItem('merch4u_chat_greeted');
        }
    }, [isLogin]); // Vẫn theo dõi isLogin để kích hoạt khi Header thay đổi state này
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            const name = userData?.name ? userData.name.split(' ').pop() : null;
            const greeting = name
                ? `Chào ${name}! 👋 Mình là trợ lý AI của **Merch4u**. Bạn đang tìm merchandise của idol nào vậy? Mình sẽ tìm ngay cho bạn! 🎵`
                : `Xin chào! 👋 Mình là trợ lý AI của **Merch4u** — chuyên đồ Merchandise chính hãng. Hỏi mình bất cứ điều gì nhé!`;

            const greetingMsg = { role: 'ai', text: greeting, id: Date.now() };
            setMessages(prev => [...prev, greetingMsg]);
            setHasGreeted(true);
        }
    }, [isOpen, hasGreeted, userData]);

    // Auto scroll xuống cuối
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input khi mở
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleToggle = () => setIsOpen((prev) => !prev);

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || isStreaming) return;

        // Thêm tin nhắn user
        const userMsg = { role: 'user', text, id: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsStreaming(true);

        // Placeholder AI đang gõ
        const aiMsgId = Date.now() + 1;
        setMessages((prev) => [
            ...prev,
            { role: 'ai', text: '', id: aiMsgId, isTyping: true },
        ]);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({ message: text }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('API lỗi');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.done) break;
                        if (data.error) {
                            aiText = data.error;
                            break;
                        }
                        if (data.text) {
                            aiText += data.text;
                            // Cập nhật tin nhắn AI theo từng chunk
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === aiMsgId ? { ...m, text: aiText, isTyping: false } : m
                                )
                            );
                        }
                    } catch (_) { /* bỏ qua line parse lỗi */ }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === aiMsgId
                            ? { ...m, text: 'Xin lỗi, mình đang bận, thử lại sau nhé! 😅', isTyping: false }
                            : m
                    )
                );
            }
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
    };

    // Gợi ý câu hỏi nhanh
    const quickQuestions = [
        'Có áo BTS không?', 'Sản phẩm sale hôm nay?', 'Gợi ý quà sinh nhật',
    ];

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                id="ai-chatbot-toggle"
                className={`chatbot-toggle-btn ${isOpen ? 'chatbot-open' : ''}`}
                onClick={handleToggle}
                aria-label="Mở AI Chat"
                title="Chat với AI"
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <circle cx="9" cy="10" r="1" fill="currentColor" />
                        <circle cx="12" cy="10" r="1" fill="currentColor" />
                        <circle cx="15" cy="10" r="1" fill="currentColor" />
                    </svg>
                )}
                {!isOpen && <span className="chatbot-pulse" />}
            </button>

            {/* Chat Window */}
            <div className={`chatbot-window ${isOpen ? 'chatbot-window--open' : ''}`} id="ai-chatbot-window">
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="chatbot-avatar">🤖</div>
                        <div>
                            <div className="chatbot-name">Merch AI</div>
                            <div className="chatbot-status">
                                {isStreaming ? (
                                    <><span className="status-dot typing" />Đang trả lời...</>
                                ) : (
                                    <><span className="status-dot online" />Trực tuyến</>
                                )}
                            </div>
                        </div>
                    </div>
                    <button className="chatbot-close-btn" onClick={handleToggle} aria-label="Đóng">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="chatbot-messages" id="chatbot-messages-list">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                            {msg.role === 'ai' && <div className="chatbot-msg-avatar">🤖</div>}
                            <div className="chatbot-msg-bubble">
                                {msg.isTyping && !msg.text ? (
                                    <div className="chatbot-typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                ) : (
                                    <div
                                        className="chatbot-msg-text"
                                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick questions (chỉ khi chưa có nhiều tin nhắn) */}
                {messages.length <= 1 && !isStreaming && (
                    <div className="chatbot-quick-questions">
                        {quickQuestions.map((q) => (
                            <button
                                key={q}
                                className="chatbot-quick-btn"
                                onClick={() => { setInputValue(q); setTimeout(handleSend, 50); }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="chatbot-input-area">
                    {!isLogin && (
                        <div className="chatbot-login-notice">
                            💡 Đăng nhập để AI tư vấn cá nhân hóa hơn!
                        </div>
                    )}
                    <div className="chatbot-input-row">
                        <textarea
                            ref={inputRef}
                            id="chatbot-input"
                            className="chatbot-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi... (Enter để gửi)"
                            rows={1}
                            disabled={isStreaming}
                        />
                        {isStreaming ? (
                            <button className="chatbot-send-btn chatbot-stop-btn" onClick={handleStop} aria-label="Dừng">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                className="chatbot-send-btn"
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                aria-label="Gửi"
                                id="chatbot-send-btn"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
