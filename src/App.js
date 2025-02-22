import React, { useState, useEffect } from "react";
import {
  detectLanguage,
  translateText,
  isTranslatorAvailable,
  getSupportedTargetLanguages,
  checkLanguagePairAvailability
} from "./api/chromeAI";
import "./App.css";

function App() {
  // State declarations - removed downloadProgress state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [translatorAvailable, setTranslatorAvailable] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState({});

  // useEffect to check API availability
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isTranslatorAvailable();
      setTranslatorAvailable(available);
      
      if (available) {
        const languages = await getSupportedTargetLanguages();
        setSupportedLanguages(languages);
      }
    };
    
    checkAvailability();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const detectedLanguage = await detectLanguage(inputText);
      const newMessage = {
        id: Date.now(),
        text: inputText,
        language: detectedLanguage,
        translations: {}
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText("");
    } catch (error) {
      setError(`Failed to process text: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId, text, sourceLanguage, targetLanguage) => {
    if (!targetLanguage) {
      setError("Please select a target language.");
      return;
    }

    // Simplified availability check - either available or not
    const availability = await checkLanguagePairAvailability(sourceLanguage, targetLanguage);
    
    if (availability === 'no') {
      setError(`Translation from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)} is not available.`);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Removed progress callback parameter
      const translatedText = await translateText(
        text,
        targetLanguage,
        sourceLanguage
      );
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                translations: {
                  ...msg.translations,
                  [targetLanguage]: translatedText
                }
              }
            : msg
        )
      );
    } catch (error) {
      setError(`Translation failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chrome AI Translator</h1>
        {!translatorAvailable && (
          <div className="api-notice">
            <p>⚠️ Chrome Translator API is not available in your browser.</p>
            <p>Enable it at chrome://flags/#translation-api or join the origin trial.</p>
          </div>
        )}
      </header>

      <div className="message-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Enter text to detect language and translate</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="message-card">
              <div className="original-text">
                <p>{message.text}</p>
                <div className="language-badge">
                  Detected: {getLanguageName(message.language)}
                </div>
              </div>

              {translatorAvailable && (
                <div className="translation-controls">
                  <select
                    className="language-selector"
                    onChange={(e) => handleTranslate(
                      message.id,
                      message.text,
                      message.language,
                      e.target.value
                    )}
                    disabled={loading}
                    defaultValue=""
                  >
                    <option value="">Translate to...</option>
                    {Object.entries(supportedLanguages).map(([code, availability]) => (
                      availability !== 'no' && code !== message.language && (
                        <option key={code} value={code}>
                          {getLanguageName(code)}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              )}

              {Object.entries(message.translations).map(([langCode, translation]) => (
                <div key={langCode} className="translation-result">
                  <h4>{getLanguageName(langCode)}</h4>
                  <p>{translation}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="input-area">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text (minimum 3 characters for reliable detection)"
          rows="4"
          disabled={loading}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={loading || inputText.trim().length < 3}
        >
          {loading ? "Processing..." : "Detect Language"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <footer className="app-footer">
        <p>Using Chrome&apos;s AI Language APIs for client-side translation</p>
        <p>No language model downloads required</p>
      </footer>
    </div>
  );
}

// Helper function remains the same
function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese (Simplified)',
    'zh-Hant': 'Chinese (Traditional)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'bn': 'Bengali',
    'nl': 'Dutch',
    'pl': 'Polish'
  };
  
  return languages[code] || code;
}

export default App;