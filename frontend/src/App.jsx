import { useEffect, useState, useRef } from "react";
import { Send, User, MessageCircle } from "lucide-react";

const SERVER_URL = "http://18.231.246.119:3000"; // replace with other VM IP

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState("User1");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/messages`);
      const data = await res.json();
      setMessages(data);
      setIsOnline(true);
    } catch (err) {
      console.error(err);
      setIsOnline(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setIsTyping(true);
    try {
      await fetch(`${SERVER_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, text: text.trim() }),
      });
      setText("");
      fetchMessages();
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      setIsOnline(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4">
      <div className="w-full max-w-4xl h-[95vh] sm:h-[85vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">VM Chat</h1>
              <p className="text-xs sm:text-sm text-blue-100">
                {isOnline ? "Connected" : "Reconnecting..."}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1.5">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{user}</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isCurrentUser = msg.user === user;
              return (
                <div
                  key={idx}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                  style={{
                    animation: "fadeIn 0.3s ease-in",
                  }}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                        : "bg-white text-gray-800 shadow-md"
                    } rounded-2xl px-4 py-3 space-y-1 transform transition-all hover:scale-[1.02]`}
                  >
                    {!isCurrentUser && (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {msg.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-indigo-600">
                          {msg.user}
                        </span>
                      </div>
                    )}
                    <p className="text-sm sm:text-base break-words leading-relaxed">
                      {msg.text}
                    </p>
                    <span
                      className={`text-xs ${
                        isCurrentUser ? "text-blue-100" : "text-gray-400"
                      } block text-right`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isTyping || !isOnline}
                className="w-full p-3 sm:p-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!text.trim() || isTyping || !isOnline}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 sm:p-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* User Name Input */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2" />
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Your name"
              className="flex-1 bg-transparent p-2 focus:outline-none text-sm sm:text-base text-gray-700"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}