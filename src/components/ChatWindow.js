import React, { useState } from "react";
import InputBox from "./InputBox";
import OutputBox from "./OutputBox";
import { detectLanguage, summarizeText, translateText } from "../api/chromeAI";
import "../styles/App.css";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Detect Language
    const detectedLang = await detectLanguage(text);

    // Add message to chat
    const newMessage = {
      id: messages.length + 1,
      text,
      language: detectedLang || "Unknown",
      summary: null,
      translation: null,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSummarize = async (id, text) => {
    const summary = await summarizeText(text);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, summary } : msg))
    );
  };

  const handleTranslate = async (id, text, targetLang) => {
    const translation = await translateText(text, targetLang);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, translation } : msg))
    );
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <OutputBox
            key={msg.id}
            message={msg}
            onSummarize={handleSummarize}
            onTranslate={handleTranslate}
          />
        ))}
      </div>
      <InputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
