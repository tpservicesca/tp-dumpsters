"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE = "👋 Hi! I'm the TP Dumpsters assistant. I can help you with:\n\n• Dumpster sizes & pricing\n• Booking a rental\n• Service areas\n• Any questions about our services\n\nHow can I help you today?";

const WELCOME_MESSAGE_ES = "👋 ¡Hola! Soy el asistente de TP Dumpsters. Puedo ayudarte con:\n\n• Tamaños y precios de contenedores\n• Reservar un dumpster\n• Áreas de servicio\n• Cualquier pregunta sobre nuestros servicios\n\n¿En qué puedo ayudarte?";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Demo response — will be replaced with API call
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thanks for your message! 🚧 This chat is being set up — a real AI assistant will be here soon to help you with dumpster rentals, pricing, and booking.\n\nIn the meantime, call us at **(510) 650-0080** or visit our [booking page](/booking)!",
        },
      ]);
    }, 1500);
  };

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[15px] left-[15px] md:bottom-[30px] md:left-[30px] z-[99999] w-[60px] h-[60px] rounded-full bg-red-600 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-red-700 hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Open chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-[15px] left-[15px] md:bottom-[30px] md:left-[30px] z-[99999] w-[calc(100vw-30px)] max-w-[380px] h-[500px] md:h-[550px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden bg-white border border-gray-200">
          {/* Header */}
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                TP
              </div>
              <div>
                <p className="font-semibold text-sm">TP Dumpsters</p>
                <p className="text-xs text-red-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
                  Online — Typically replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Language Toggle */}
          <div className="px-4 py-1.5 bg-white border-t border-gray-100 flex gap-2 justify-center">
            <button
              onClick={() =>
                setMessages([{ role: "assistant", content: WELCOME_MESSAGE }])
              }
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              🇺🇸 English
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() =>
                setMessages([
                  { role: "assistant", content: WELCOME_MESSAGE_ES },
                ])
              }
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              🇲🇽 Español
            </button>
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-200 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
