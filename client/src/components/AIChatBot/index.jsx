import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { API_URL, fetchDataFromApi, deleteData } from "../../utils/api";
import "./style.css";

const CHAT_SESSION_KEY = "merch4u_chat_session_id";

function parseMarkdown(text) {
    if (!text) return "";

    // Escape basic HTML to prevent injection, but keep it readable
    let safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const lines = safeText.split(/\r?\n/);
    let html = "";
    let inTable = false;
    let tableRows = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            html += '<ul style="list-style-type: disc; margin-left: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">' + listItems.join("") + "</ul>";
            listItems = [];
        }
        inList = false;
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            let separatorIndex = -1;
            for (let i = 0; i < tableRows.length; i++) {
                const row = tableRows[i].trim();
                const cleanRow = row.replace(/^\||\|$/g, "").trim();
                if (cleanRow && /^[|\s\-:]+$/.test(cleanRow)) {
                    separatorIndex = i;
                    break;
                }
            }

            let tableHtml = '<div class="chat-table-wrapper"><table class="chat-table">';
            for (let i = 0; i < tableRows.length; i++) {
                if (i === separatorIndex) continue; // Skip separator row

                const row = tableRows[i].trim();
                let cleanRow = row;
                if (cleanRow.startsWith("|")) cleanRow = cleanRow.slice(1);
                if (cleanRow.endsWith("|")) cleanRow = cleanRow.slice(0, -1);

                let cells = cleanRow.split("|").map(c => c.trim());
                
                // If it's before the separator or there is no separator and it's the first row, it's a header
                const isHeader = (separatorIndex !== -1 && i < separatorIndex) || (separatorIndex === -1 && i === 0);
                const tag = isHeader ? "th" : "td";

                tableHtml += "<tr>";
                for (const cell of cells) {
                    tableHtml += `<${tag}>${parseInlineMarkdown(cell)}</${tag}>`;
                }
                tableHtml += "</tr>";
            }
            tableHtml += "</table></div>";
            html += tableHtml;
            tableRows = [];
        }
        inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check for table row
        const isTableRow = trimmed.includes("|") && !trimmed.startsWith("-") && !trimmed.startsWith("*") && !trimmed.startsWith("•");

        if (isTableRow) {
            flushList();
            inTable = true;
            tableRows.push(line);
            continue;
        } else {
            flushTable();
        }

        // Check for list item
        const listMatch = trimmed.match(/^[\-•\*]\s+(.+)/);
        if (listMatch) {
            inList = true;
            let itemText = listMatch[1];
            listItems.push(`<li style="margin-bottom: 0.25rem;">${parseInlineMarkdown(itemText)}</li>`);
            continue;
        } else {
            flushList();
        }

        // Regular text line
        if (trimmed === "") {
            html += "<br/>";
        } else {
            html += parseInlineMarkdown(line) + "<br/>";
        }
    }

    flushList();
    flushTable();

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["a", "br", "em", "li", "strong", "ul", "table", "thead", "tbody", "tr", "th", "td", "div"],
        ALLOWED_ATTR: ["class", "href", "style"],
    });
}

function parseInlineMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="chat-link">$1</a>');
}

function ChatProductCards({ products = [], onView, onAdd }) {
    if (!products.length) return null;

    return (
        <div className="chatbot-product-cards">
            {products.map((product) => (
                <div className="chatbot-product-card" key={product._id}>
                    <button
                        type="button"
                        className="chatbot-product-image"
                        onClick={() => onView(product._id)}
                        aria-label={`Xem ${product.name}`}
                    >
                        {product?.images?.[0] && <img src={product.images[0]} alt={product.name} />}
                    </button>
                    <div className="chatbot-product-info">
                        <button
                            type="button"
                            className="chatbot-product-name"
                            onClick={() => onView(product._id)}
                        >
                            {product.name}
                        </button>
                        <div className="chatbot-product-price">
                            {Number(product.price || 0).toLocaleString("vi-VN")}đ
                        </div>
                        <div className="chatbot-product-actions">
                            <button type="button" onClick={() => onView(product._id)}>
                                Xem
                            </button>
                            <button type="button" onClick={() => onAdd(product)}>
                                Thêm giỏ
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AIChatBot() {
    const context = useContext(MyContext);
    const { isLogin, userData } = context;
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [quickQuestions, setQuickQuestions] = useState([
        "Có áo BTS không?",
        "Sản phẩm sale hôm nay?",
        "Gợi ý quà sinh nhật",
    ]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const prevLoginRef = useRef(isLogin);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // On logout: clear everything visible
    // On login: load a fresh new chat (history stays in DB)
    useEffect(() => {
        const wasLoggedIn = prevLoginRef.current;
        prevLoginRef.current = isLogin;

        if (!isLogin) {
            // Logged out → wipe visible state
            setMessages([]);
            setHasGreeted(false);
            setSessionId("");
            setSessions([]);
            setShowHistory(false);
            localStorage.removeItem(CHAT_SESSION_KEY);
        } else if (!wasLoggedIn && isLogin) {
            // Just logged in → start fresh chat, don't restore old session
            setMessages([]);
            setHasGreeted(false);
            setSessionId("");
            localStorage.removeItem(CHAT_SESSION_KEY);
        }
    }, [isLogin]);

    // Greeting on open
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            const name = userData?.name ? userData.name.split(" ").pop() : null;
            const greeting = name
                ? `Chào ${name}! Mình là trợ lý AI của **Merch4u**. Bạn đang tìm merchandise của idol nào vậy?`
                : "Xin chào! Mình là trợ lý AI của **Merch4u**. Hỏi mình về sản phẩm, quà tặng hoặc đơn hàng nhé.";

            setMessages((prev) => [...prev, { role: "ai", text: greeting, id: Date.now() }]);
            setHasGreeted(true);
        }
    }, [isOpen, hasGreeted, userData]);

    // Quick suggestions on open
    useEffect(() => {
        if (!isOpen) return;

        setTimeout(() => inputRef.current?.focus(), 150);

        const currentProductId = localStorage.getItem("merch4u_current_product_id");
        const query = currentProductId ? `?productId=${currentProductId}` : "";

        fetchDataFromApi(`/api/ai/suggestions${query}`).then((res) => {
            if (res?.error === false && res?.suggestions?.length) {
                setQuickQuestions(res.suggestions);
            }
        });
    }, [isOpen]);

    // Fetch chat sessions list (for logged-in users)
    const fetchSessions = useCallback(() => {
        if (!isLogin) {
            setSessions([]);
            return;
        }
        setLoadingSessions(true);
        fetchDataFromApi("/api/ai/chat-sessions").then((res) => {
            if (res?.success) {
                setSessions(res.sessions || []);
            }
            setLoadingSessions(false);
        }).catch(() => setLoadingSessions(false));
    }, [isLogin]);

    // Fetch sessions when history panel is opened
    useEffect(() => {
        if (showHistory && isLogin) {
            fetchSessions();
        }
    }, [showHistory, isLogin, fetchSessions]);

    const handleToggle = () => setIsOpen((prev) => !prev);

    // Start a brand new chat
    const handleNewChat = () => {
        setMessages([]);
        setHasGreeted(false);
        setSessionId("");
        setShowHistory(false);
        localStorage.removeItem(CHAT_SESSION_KEY);
    };

    // Load an old session from history
    const handleLoadSession = (sid) => {
        if (!sid) return;
        fetchDataFromApi(`/api/ai/chat-sessions/${sid}`).then((res) => {
            if (res?.success && res.session) {
                const loadedMessages = (res.session.messages || []).map((msg, i) => ({
                    role: msg.role,
                    text: msg.text || "",
                    id: Date.now() + i,
                    products: msg.products || [],
                }));
                setMessages(loadedMessages);
                setSessionId(sid);
                setHasGreeted(true);
                setShowHistory(false);
                localStorage.setItem(CHAT_SESSION_KEY, sid);
            }
        });
    };

    // Delete a session from history
    const handleDeleteSession = (sid) => {
        if (!window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;
        deleteData(`/api/ai/chat-sessions/${sid}`).then((res) => {
            if (res?.success) {
                setSessions((prev) => prev.filter((s) => s._id !== sid));
                // If we're currently viewing the deleted session, start fresh
                if (sessionId === sid) {
                    handleNewChat();
                }
            }
        });
    };

    const updateAIMessage = (aiMsgId, patch) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === aiMsgId ? { ...message, ...patch } : message
            )
        );
    };

    const sendMessage = async (overrideText) => {
        const text = (overrideText || inputValue).trim();
        if (!text || isStreaming) return;

        const userMsg = { role: "user", text, id: Date.now() };
        const aiMsgId = Date.now() + 1;

        setMessages((prev) => [
            ...prev,
            userMsg,
            { role: "ai", text: "", id: aiMsgId, isTyping: true, products: [] },
        ]);
        setInputValue("");
        setIsStreaming(true);

        try {
            abortControllerRef.current = new AbortController();
            const token = localStorage.getItem("accessToken");
            const headers = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: text, sessionId }),
                signal: abortControllerRef.current.signal,
            });

            const contentType = response.headers.get("content-type") || "";

            if (!response.ok) {
                let errMsg = "AI đang bận. Bạn thử lại sau nhé!";
                try {
                    const errData = await response.json();
                    errMsg = errData?.message || errMsg;
                } catch {
                    /* ignore */
                }
                updateAIMessage(aiMsgId, { text: errMsg, isTyping: false });
                return;
            }

            if (!contentType.includes("text/event-stream") || !response.body) {
                const data = await response.json();
                updateAIMessage(aiMsgId, {
                    text: data?.message || data?.error || "Không nhận được phản hồi từ AI.",
                    isTyping: false,
                });
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = "";
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split("\n\n");
                buffer = events.pop() || "";

                for (const event of events) {
                    const line = event.split("\n").find((item) => item.startsWith("data: "));
                    if (!line) continue;

                    let data;
                    try {
                        data = JSON.parse(line.replace("data: ", ""));
                    } catch {
                        continue;
                    }
                    if (data.sessionId) {
                        setSessionId(data.sessionId);
                        if (isLogin) {
                            localStorage.setItem(CHAT_SESSION_KEY, data.sessionId);
                        }
                    }
                    if (data.error) {
                        aiText = data.error;
                        updateAIMessage(aiMsgId, { text: aiText, isTyping: false });
                    }
                    if (data.text) {
                        aiText += data.text;
                        updateAIMessage(aiMsgId, { text: aiText, isTyping: false });
                    }
                    if (data.cards) {
                        updateAIMessage(aiMsgId, { products: data.cards, isTyping: false });
                    }
                }
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                updateAIMessage(aiMsgId, {
                    text: "Xin lỗi, AI đang bận. Bạn thử lại sau nhé!",
                    isTyping: false,
                });
            }
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
    };

    const handleViewProduct = (productId) => {
        if (!productId) return;
        setIsOpen(false);
        navigate(`/product/${productId}`);
    };

    const handleAddProduct = (product) => {
        context?.addToCart(
            {
                ...product,
                image: product?.images?.[0],
            },
            userData?._id,
            1
        );
    };

    const formatSessionDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return d.toLocaleDateString("vi-VN");
    };

    return (
        <>
            <button
                id="ai-chatbot-toggle"
                className={`chatbot-toggle-btn ${isOpen ? "chatbot-open" : ""}`}
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

            <div className={`chatbot-window ${isOpen ? "chatbot-window--open" : ""}`} id="ai-chatbot-window">
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="chatbot-avatar">AI</div>
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
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {/* History toggle (only for logged-in users) */}
                        {isLogin && (
                            <button
                                className={`chatbot-close-btn ${showHistory ? 'chatbot-btn-active' : ''}`}
                                onClick={() => setShowHistory((prev) => !prev)}
                                aria-label="Lịch sử chat"
                                title="Lịch sử chat"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </button>
                        )}
                        {/* New chat */}
                        <button className="chatbot-close-btn" onClick={handleNewChat} aria-label="Chat mới" title="Bắt đầu chat mới">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                        {/* Close */}
                        <button className="chatbot-close-btn" onClick={handleToggle} aria-label="Đóng">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* History Panel (slides over messages) */}
                {showHistory && (
                    <div className="chatbot-history-panel">
                        <div className="chatbot-history-header">
                            <h4>Lịch sử trò chuyện</h4>
                            <button className="chatbot-history-back" onClick={() => setShowHistory(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        {loadingSessions ? (
                            <div className="chatbot-history-loading">Đang tải...</div>
                        ) : sessions.length === 0 ? (
                            <div className="chatbot-history-empty">
                                Chưa có cuộc trò chuyện nào được lưu
                            </div>
                        ) : (
                            <div className="chatbot-history-list">
                                {sessions.map((s) => (
                                    <div
                                        key={s._id}
                                        className={`chatbot-history-item ${sessionId === s._id ? 'chatbot-history-item--active' : ''}`}
                                    >
                                        <button
                                            className="chatbot-history-item-content"
                                            onClick={() => handleLoadSession(s._id)}
                                        >
                                            <span className="chatbot-history-title">
                                                {s.title || "Cuộc trò chuyện"}
                                            </span>
                                            <span className="chatbot-history-time">
                                                {formatSessionDate(s.updatedAt)}
                                            </span>
                                        </button>
                                        <button
                                            className="chatbot-history-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSession(s._id);
                                            }}
                                            title="Xóa cuộc trò chuyện"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Messages */}
                {!showHistory && (
                    <>
                        <div className="chatbot-messages" id="chatbot-messages-list">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                                    {msg.role === "ai" && <div className="chatbot-msg-avatar">AI</div>}
                                    <div className="chatbot-msg-bubble">
                                        {msg.isTyping && !msg.text ? (
                                            <div className="chatbot-typing-indicator">
                                                <span /><span /><span />
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="chatbot-msg-text"
                                                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                                                />
                                                <ChatProductCards
                                                    products={msg.products || []}
                                                    onView={handleViewProduct}
                                                    onAdd={handleAddProduct}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length <= 2 && !isStreaming && (
                            <div className="chatbot-quick-questions">
                                {quickQuestions.map((question) => (
                                    <button
                                        key={question}
                                        className="chatbot-quick-btn"
                                        onClick={() => sendMessage(question)}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="chatbot-input-area">
                            {!isLogin && (
                                <div className="chatbot-login-notice">
                                    Đăng nhập để lưu lịch sử chat và AI nhớ thông tin mua hàng của bạn.
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
                                        onClick={() => sendMessage()}
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
                    </>
                )}
            </div>
        </>
    );
}
