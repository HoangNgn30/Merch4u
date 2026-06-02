import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { fetchDataFromApi, deleteData } from "../../utils/api";
import { FiMessageSquare, FiX, FiRefreshCw, FiClock, FiTrash2, FiSend } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

const CHAT_SESSION_KEY = "merch4u_admin_chat_session_id";

function parseMarkdown(text) {
    if (!text) return "";

    // Escape basic HTML to prevent injection, but keep it readable
    let safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Parse Markdown Tables
    const tableRegex = /((?:^\|.+(?:\r?\n|$))+)/gm;
    safeText = safeText.replace(tableRegex, (match) => {
        const lines = match.trim().split(/\r?\n/);
        if (lines.length < 2) return match;

        let tableHtml = '<div class="chat-table-wrapper"><table class="chat-table">';
        let hasHeader = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith("|")) continue;

            // Check if it's a separator line (e.g. |---|---|)
            if (/^[|\s\-:]+$/.test(line)) {
                hasHeader = true;
                continue;
            }

            let cells = line.split("|").map(c => c.trim()).slice(1);
            if (cells.length > 0 && cells[cells.length - 1] === "") {
                cells.pop();
            }
            const tag = (i === 0 && !hasHeader) || (i === 0) ? "th" : "td";

            tableHtml += "<tr>";
            for (const cell of cells) {
                tableHtml += `<${tag}>${cell}</${tag}>`;
            }
            tableHtml += "</tr>";
        }
        tableHtml += "</table></div>";
        return tableHtml;
    });

    // Parse bold, italic, links, lists, newlines
    safeText = safeText
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="chat-link">$1</a>')
        .replace(/^[\-•]\s(.+)/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
        .replace(/\n/g, "<br/>");

    return safeText;
}

export default function AdminAIChatBot() {
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
    const [quickQuestions] = useState([
        "Báo cáo doanh thu & đơn hàng",
        "Sản phẩm nào sắp hết hàng?",
        "Liệt kê 5 đơn hàng gần đây",
        "Xem danh sách thành viên mới",
        "Xem các mã giảm giá",
        "Tình trạng slider trang chủ",
    ]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const prevLoginRef = useRef(isLogin);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cleanup or reset on auth change
    useEffect(() => {
        const wasLoggedIn = prevLoginRef.current;
        prevLoginRef.current = isLogin;

        if (!isLogin) {
            setMessages([]);
            setHasGreeted(false);
            setSessionId("");
            setSessions([]);
            setShowHistory(false);
            localStorage.removeItem(CHAT_SESSION_KEY);
        } else if (!wasLoggedIn && isLogin) {
            setMessages([]);
            setHasGreeted(false);
            setSessionId("");
            localStorage.removeItem(CHAT_SESSION_KEY);
        }
    }, [isLogin]);

    // Greet admin on open
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            const name = userData?.name ? userData.name.split(" ").pop() : "Sếp";
            const greeting = `Chào sếp **${name}**! Tôi là trợ lý ảo **Merch4u Admin Co-pilot**. 

Tôi có thể giúp sếp thống kê doanh thu, kiểm tra đơn hàng gần đây, kiểm soát tồn kho thấp, xem danh sách thành viên, mã giảm giá, slider trang chủ và hỗ trợ sếp quản trị toàn bộ hệ thống. Sếp cần báo cáo mảng nào hôm nay ạ?`;

            setMessages((prev) => [...prev, { role: "ai", text: greeting, id: Date.now() }]);
            setHasGreeted(true);
        }
    }, [isOpen, hasGreeted, userData]);

    // Fetch sessions history
    const fetchSessions = useCallback(() => {
        if (!isLogin) {
            setSessions([]);
            return;
        }
        setLoadingSessions(true);
        fetchDataFromApi("/api/ai/admin-chat-sessions").then((res) => {
            if (res?.success) {
                setSessions(res.sessions || []);
            }
            setLoadingSessions(false);
        }).catch(() => setLoadingSessions(false));
    }, [isLogin]);

    useEffect(() => {
        if (showHistory && isLogin) {
            fetchSessions();
        }
    }, [showHistory, isLogin, fetchSessions]);

    // Start a brand new session
    const handleNewChat = () => {
        setMessages([]);
        setHasGreeted(false);
        setSessionId("");
        setShowHistory(false);
        localStorage.removeItem(CHAT_SESSION_KEY);
    };

    // Load an old session
    const handleLoadSession = (sid) => {
        if (!sid) return;
        fetchDataFromApi(`/api/ai/admin-chat-sessions/${sid}`).then((res) => {
            if (res?.success && res.session) {
                const loadedMessages = (res.session.messages || []).map((msg, i) => ({
                    role: msg.role,
                    text: msg.text || "",
                    id: Date.now() + i,
                }));
                setMessages(loadedMessages);
                setSessionId(sid);
                setHasGreeted(true);
                setShowHistory(false);
                localStorage.setItem(CHAT_SESSION_KEY, sid);
            }
        });
    };

    // Delete a session
    const handleDeleteSession = (sid) => {
        if (!window.confirm("Sếp có chắc chắn muốn xóa lịch sử cuộc trò chuyện này không?")) return;
        deleteData(`/api/ai/admin-chat-sessions/${sid}`).then((res) => {
            if (res?.success) {
                setSessions((prev) => prev.filter((s) => s._id !== sid));
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

    // Post custom click navigate handler
    const handleBubbleClick = (e) => {
        const link = e.target.closest("a");
        if (link) {
            const href = link.getAttribute("href");
            if (href && href.startsWith("/")) {
                e.preventDefault();
                navigate(href);
                setIsOpen(false); // Close bot on navigation
            }
        }
    };

    const sendMessage = async (overrideText) => {
        const text = (overrideText || inputValue).trim();
        if (!text || isStreaming) return;

        const userMsg = { role: "user", text, id: Date.now() };
        const aiMsgId = Date.now() + 1;

        setMessages((prev) => [
            ...prev,
            userMsg,
            { role: "ai", text: "", id: aiMsgId, isTyping: true },
        ]);
        setInputValue("");
        setIsStreaming(true);

        try {
            abortControllerRef.current = new AbortController();
            const token = localStorage.getItem("accessToken");
            const headers = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const apiUrl = import.meta.env.VITE_API_URL;
            const cleanApiUrl = apiUrl?.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

            const response = await fetch(`${cleanApiUrl}/api/ai/admin-chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: text, sessionId }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                let errMsg = "Trợ lý ảo đang bận. Sếp thử lại sau nhé!";
                try {
                    const errData = await response.json();
                    errMsg = errData?.message || errMsg;
                } catch {
                    /* ignore */
                }
                updateAIMessage(aiMsgId, { text: errMsg, isTyping: false });
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
                }
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                updateAIMessage(aiMsgId, {
                    text: "Xin lỗi sếp, hệ thống AI đang bận. Sếp vui lòng thử lại sau nhé!",
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

    const formatSessionDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return d.toLocaleDateString("vi-VN");
    };

    // Render nothing if user is not authenticated as admin
    if (!["ADMIN", "SUPERBOSS"].includes(userData?.role)) {
        return null;
    }

    return (
        <>
            <style>{`
                .chat-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    margin: 10px 0;
                    border-radius: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                }
                .chat-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 0.8rem;
                }
                .chat-table th {
                    background-color: #f8fafc;
                    color: #334155;
                    font-weight: 600;
                    padding: 8px 12px;
                    border-bottom: 2px solid rgba(0, 0, 0, 0.05);
                }
                .chat-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
                    color: #475569;
                }
                .chat-table tr:nth-child(even) {
                    background-color: rgba(248, 250, 252, 0.6);
                }
                .chat-table tr:hover {
                    background-color: rgba(255, 82, 82, 0.05);
                }
                .chat-link {
                    color: #ff5252;
                    font-weight: 600;
                    text-decoration: underline;
                    transition: color 0.2s;
                }
                .chat-link:hover {
                    color: #e04848;
                }
                .chat-msg-text ul {
                    list-style-type: disc;
                    margin-left: 1.25rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .chat-msg-text li {
                    margin-bottom: 0.25rem;
                }
                .chat-viewport::-webkit-scrollbar {
                    width: 6px !important;
                }
                .chat-viewport::-webkit-scrollbar-thumb {
                    background: #cbd5e1 !important;
                    border-radius: 3px !important;
                }
                .chat-viewport::-webkit-scrollbar-track {
                    background: transparent !important;
                }
            `}</style>

            {/* Toggle Button */}
            <button
                className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff5252] to-[#ff7676] hover:from-[#e04848] hover:to-[#ff5252] shadow-lg shadow-red-500/25 flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:scale-105 z-[9999] border border-white/10"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Admin AI Assistant"
                title="Admin AI Co-pilot"
            >
                {isOpen ? <FiX className="text-2xl" /> : <FaRobot className="text-2xl animate-pulse" />}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-24 left-6 w-[380px] h-[500px] max-h-[calc(100vh-120px)] max-w-[calc(100vw-32px)] flex flex-col backdrop-blur-md bg-white/95 border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden z-[9999] transition-all duration-300 origin-bottom-left ${
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 pointer-events-none"
                }`}
            >
                {/* Header */}
                <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex justify-between items-center text-slate-800">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5252] flex items-center justify-center shadow-md shadow-red-500/10">
                            <FaRobot className="text-lg text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-800">Merch Co-pilot</div>
                            <div className="text-xs text-slate-500 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                                {isStreaming ? "Đang phản hồi sếp..." : "Trực tuyến"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        {/* History Panel Toggle */}
                        <button
                            className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                                showHistory ? "bg-slate-100 text-slate-800" : ""
                            }`}
                            onClick={() => setShowHistory(!showHistory)}
                            title="Lịch sử báo cáo"
                        >
                            <FiClock className="text-base" />
                        </button>
                        {/* Start New Chat */}
                        <button
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            onClick={handleNewChat}
                            title="Báo cáo mới"
                        >
                            <FiRefreshCw className="text-base" />
                        </button>
                    </div>
                </div>

                {/* History list view */}
                {showHistory ? (
                    <div className="flex-1 flex flex-col bg-white text-slate-800 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch sử thống kê & báo cáo</h4>
                            <button
                                className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
                                onClick={() => setShowHistory(false)}
                            >
                                Quay lại
                            </button>
                        </div>
                        {loadingSessions ? (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                                <span className="animate-pulse">Đang tải lịch sử báo cáo...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                <FiClock className="text-3xl mb-2 text-slate-300" />
                                <div className="text-sm">Chưa có phiên làm việc nào được lưu</div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-viewport">
                                {sessions.map((s) => (
                                    <div
                                        key={s._id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                            sessionId === s._id
                                                ? "bg-red-50/50 border-[#ff5252]/40"
                                                : "bg-slate-50/50 border-slate-200/50 hover:bg-slate-100/50"
                                        }`}
                                    >
                                        <div
                                            className="flex-1 min-w-0 pr-3"
                                            onClick={() => handleLoadSession(s._id)}
                                        >
                                            <div className="text-sm font-semibold text-slate-700 truncate">
                                                {s.title || "Yêu cầu báo cáo"}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {formatSessionDate(s.updatedAt)}
                                            </div>
                                        </div>
                                        <button
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSession(s._id);
                                            }}
                                            title="Xóa phiên này"
                                        >
                                            <FiTrash2 className="text-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Messages Viewport */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-slate-50/40 chat-viewport"
                            onClick={handleBubbleClick}
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-start ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "ai" && (
                                        <div className="w-7 h-7 rounded-md bg-[#ff5252] flex items-center justify-center shadow-md shadow-red-500/10 mr-2 mt-1 flex-shrink-0">
                                            <FaRobot className="text-xs text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm border ${
                                            msg.role === "user"
                                                ? "bg-gradient-to-r from-[#3872fa] to-[#5a8dfc] border-[#3872fa] text-white rounded-tr-none"
                                                : "bg-white border-slate-200/60 text-slate-800 rounded-tl-none"
                                        }`}
                                    >
                                        {msg.isTyping && !msg.text ? (
                                            <div className="flex items-center space-x-1.5 py-1">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        ) : (
                                            <div
                                                className="chat-msg-text leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestion Chips */}
                        {messages.length <= 1 && !isStreaming && (
                            <div className="px-4 py-2 bg-slate-50/40 flex flex-wrap gap-1.5 border-t border-slate-100">
                                {quickQuestions.map((q) => (
                                    <button
                                        key={q}
                                        className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-red-50/80 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 shadow-sm transition-all duration-200 cursor-pointer"
                                        onClick={() => sendMessage(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Panel */}
                        <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                            <textarea
                                ref={inputRef}
                                className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-red-500/50 rounded-xl px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none resize-none text-sm leading-relaxed max-h-24 min-h-[38px] transition-all focus:bg-white"
                                placeholder="Hỏi trợ lý AI của sếp..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={isStreaming}
                            />
                            {isStreaming ? (
                                <button
                                    className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                                    onClick={handleStop}
                                    title="Dừng phản hồi"
                                >
                                    <div className="w-3.5 h-3.5 bg-white rounded-sm" />
                                </button>
                            ) : (
                                <button
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                                        inputValue.trim()
                                            ? "bg-[#ff5252] hover:bg-[#e04848] text-white cursor-pointer shadow-red-500/10"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }`}
                                    onClick={() => sendMessage()}
                                    disabled={!inputValue.trim()}
                                >
                                    <FiSend className="text-base" />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
