import { useState, useEffect, useRef } from "react";
import { sendChatMessage, clearChatHistory } from "../services/api";
import "./ChatAssistant.css";
import ReactMarkdown from 'react-markdown';

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

  const hasContext = prediction || shapExplanation || simulation;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2 className="chat-title">
          💬 Flood Risk Insight Assistant
        </h2>
        <p className="chat-subtitle">
          Ask questions about flood predictions, SHAP explanations, and model behavior
        </p>
        <div className="chat-disclaimer">
          ⚠️ <strong>Important:</strong> This assistant provides explanations and interpretations only.
          It does NOT provide evacuation instructions or authoritative guidance.
          Always consult official emergency services for action decisions.
        </div>
      </div>

      {hasContext && (
        <div className="context-indicator">
          <span>✓</span>
          <div>
            <strong>Context Available:</strong>
            {prediction && " Prediction"}
            {shapExplanation && " • SHAP Explanation"}
            {simulation && " • Simulation"}
            {location && ` • Location: ${location}`}
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
                <span className="message-timestamp">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              <div className="message-bubble">
                <ReactMarkdown>{msg.message}</ReactMarkdown>
                {msg.type && msg.role === "assistant" && (
                  <div className="message-type-badge">
                    {msg.type.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="chat-loading">
              <span>Assistant is thinking</span>
              <div className="chat-loading-dots">
                <span></span>
                <span></span>
                <span></span>
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

        <div className="chat-controls">
          <button
            className="chat-control-btn"
            onClick={handleClearHistory}
            disabled={loading}
          >
            Clear History
          </button>
          <button
            className="chat-control-btn"
            onClick={() => handleSendMessage("help", true)}
            disabled={loading}
          >
            Help
          </button>
        </div>

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about flood predictions, SHAP values, simulations..."
            disabled={loading}
            rows={2}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
