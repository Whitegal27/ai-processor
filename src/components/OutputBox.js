import React, { useState } from "react";

const OutputBox = ({ message, onSummarize, onTranslate }) => {
  const [selectedLang, setSelectedLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    setIsTranslating(true);
    await onTranslate(message.id, message.text, selectedLang);
    setIsTranslating(false);
  };

  return (
    <div className="message">
      <p><strong>Input:</strong> {message.text}</p>
      <p><em>Language Detected:</em> {message.language}</p>

      {/* Summarization - fixed comparison to lowercase */}
      {message.text.length > 150 && message.language.toLowerCase() === "en" && (
        <button 
          className="action-button"
          onClick={() => onSummarize(message.id, message.text)}
        >
          Summarize
        </button>
      )}
      {message.summary && (
        <div className="summary-container">
          <p><strong>Summary:</strong> {message.summary}</p>
        </div>
      )}

      {/* Translation */}
      <div className="translation-controls">
        <select 
          className="language-selector"
          value={selectedLang} 
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          <option value="en">English</option>
          <option value="pt">Portuguese</option>
          <option value="es">Spanish</option>
          <option value="ru">Russian</option>
          <option value="tr">Turkish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
        <button 
          className="translate-button"
          onClick={handleTranslate}
          disabled={isTranslating}
        >
          {isTranslating ? "Translating..." : "Translate"}
        </button>
      </div>
      
      {message.translation && (
        <div className="translation-result">
          <p><strong>Translation:</strong> {message.translation}</p>
        </div>
      )}
    </div>
  );
};

export default OutputBox;