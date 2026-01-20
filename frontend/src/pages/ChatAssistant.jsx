import { useState, useEffect, useRef } from "react";
import { sendChatMessage, clearChatHistory } from "../services/api";
import "./ChatAssistant.css";
import ReactMarkdown from "react-markdown";

export default function ChatAssistant({ prediction, shapExplanation, simulation, location }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      handleSendMessage("hello", true);
    }
  }, []);

  const handleSendMessage = async (messageText = null, isAutomatic = false) => {
    const textToSend = messageText || inputMessage.trim();
    
    if (!textToSend) return;

    if (!isAutomatic) {
      // Add user message to UI
      setMessages(prev => [...prev, {
        role: "user",
        message: textToSend,
        timestamp: new Date().toISOString()
      }]);
      
      setInputMessage("");
    }
    
    setLoading(true);
    setError(null);

    try {
      // Prepare context
      const context = {
        prediction: prediction || null,
        shap_explanation: shapExplanation || null,
        simulation: simulation || null,
        location: location || null
      };

      // Send to chatbot API
      const response = await sendChatMessage(textToSend, context);

      // Add assistant response to UI
      setMessages(prev => [...prev, {
        role: "assistant",
        message: response.message,
        type: response.type,
        confidence: response.confidence,
        timestamp: response.timestamp
      }]);
    } catch (err) {
      setError(err.message || "Failed to get response from assistant");
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      setError(null);
      // Reload welcome message
      handleSendMessage("hello", true);
    } catch (err) {
      setError("Failed to clear chat history");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    handleSendMessage(question);
  };

  const quickQuestions = [
    "What about Mumbai?",
    "Tell me about Delhi",
    "Show data for Chennai",
    "Flood risk in Bangalore?",
    "Why is risk high?",
    "Explain SHAP values",
    "Feature contributions?",
    "How does simulation work?",
    "Compare prediction vs simulation",
    "What external context helps?",
    "Recent weather alerts?",
    "Risk in my area?"
  ];

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const hasContext = prediction || shapExplanation || simulation || location;

  return (
    <div className="chat-page">
      <div className="chat-shell card glass-card">
        <div className="chat-header-row">
          <div className="chat-header-main">
            <h2 className="chat-title">💬 AI Flood Assistant</h2>
            <p className="chat-subtitle">
              Ask about predictions, SHAP explanations, and simulations.
            </p>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-icon-btn"
              onClick={handleClearHistory}
              disabled={loading}
              title="Clear history"
            >
              🗑
            </button>
            <button
              className="chat-icon-btn"
              onClick={() => handleSendMessage("help", true)}
              disabled={loading}
              title="Help"
            >
              ❔
            </button>
          </div>
        </div>

        <div className="chat-disclaimer">
          ⚠️ <strong>Important:</strong> This assistant provides explanations and
          interpretations only. It does not provide evacuation instructions or
          official guidance.
        </div>

        {hasContext && (
          <div className="context-indicator">
            <span className="context-dot" />
            <div>
              <strong>Context Available:</strong>
              {prediction && " Prediction"}
              {shapExplanation && " • SHAP Explanation"}
              {simulation && " • Simulation"}
              {location && ` • Location: ${location}`}
            </div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">🌊</div>
            <h3>Start a conversation</h3>
            <p>
              Ask about flood risk at a location, why the model predicted a
              certain risk level, or how simulations behave.
            </p>
          </div>
        )}

        <div className="chat-messages modern-scroll">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message-row ${msg.role === "user" ? "align-right" : "align-left"}`}
            >
              <div
                className={`chat-message-bubble ${msg.role === "user" ? "user-bubble" : "assistant-bubble"}`}
              >
                <div className="message-header">
                  <span className="message-role">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  <span className="message-timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  <ReactMarkdown>{msg.message}</ReactMarkdown>
                </div>
                {msg.type && msg.role === "assistant" && (
                  <div className="message-type-badge">
                    {msg.type.replace(/_/g, " ")}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message-row align-left">
              <div className="chat-message-bubble assistant-bubble typing-bubble">
                <span>Assistant is typing</span>
                <div className="chat-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && (
          <div className="quick-questions">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="quick-question-btn"
                onClick={() => handleQuickQuestion(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-bar">
          <textarea
            className="chat-input modern-scroll"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about flood predictions, SHAP values, simulations..."
            disabled={loading}
            rows={2}
          />
          <button
            className="chat-send-fab"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
          >
            {loading ? "…" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}
