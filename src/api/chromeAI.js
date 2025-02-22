import React, { useState, useEffect } from 'react';

// Language detector instance
let detector = null;
const translatorCache = new Map();

/**
 * Check if Chrome's Translator API is available
 */
export async function isTranslatorAvailable() {
  return 'ai' in window && 'translator' in window.ai;
}

/**
 * Check if a specific language is available for detection
 */
export async function isLanguageAvailable(languageCode) {
  if (!('ai' in window && 'languageDetector' in window.ai)) {
    return false;
  }
  
  try {
    const capabilities = await window.ai.languageDetector.capabilities();
    return capabilities.languageAvailable(languageCode) !== 'no';
  } catch (error) {
    console.error("Error checking language availability:", error);
    return false;
  }
}

/**
 * Initialize language detector
 */
export async function initializeLanguageDetector() {
  if (!('ai' in window && 'languageDetector' in window.ai)) {
    throw new Error("Language Detector API is not available");
  }

  try {
    const capabilities = await window.ai.languageDetector.capabilities();
    if (capabilities.available === 'no') {
      throw new Error("Language detector isn't usable on this device");
    }

    detector = await window.ai.languageDetector.create();
    await detector.ready;
    return true;
  } catch (error) {
    console.error("Failed to initialize language detector:", error);
    throw error;
  }
}

/**
 * Check language pair availability - simplified to avoid download checks
 */
export async function checkLanguagePairAvailability(sourceLanguage, targetLanguage) {
  if (!await isTranslatorAvailable()) {
    return 'no';
  }
  
  try {
    const capabilities = await window.ai.translator.capabilities();
    const availability = capabilities.languagePairAvailable(sourceLanguage, targetLanguage);
    
    // Treat 'after-download' as 'yes' to avoid download prompts
    return availability === 'after-download' ? 'yes' : availability;
  } catch (error) {
    console.error(`Error checking availability for ${sourceLanguage} to ${targetLanguage}:`, error);
    return 'no';
  }
}

/**
 * Get supported target languages - simplified to avoid download indicators
 */
export async function getSupportedTargetLanguages() {
  if (!await isTranslatorAvailable()) {
    return {};
  }
  
  const commonLanguages = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ja', 'tr', 'hi', 'vi', 'bn'];
  const result = {};
  
  const userLanguages = navigator.languages || [navigator.language];
  userLanguages.forEach(lang => {
    const baseCode = lang.split('-')[0];
    if (!commonLanguages.includes(baseCode)) {
      commonLanguages.push(baseCode);
    }
  });
  
  const sourceLanguage = 'en';
  for (const lang of commonLanguages) {
    try {
      const availability = await checkLanguagePairAvailability(sourceLanguage, lang);
      // Simplify - just mark as available or not
      result[lang] = availability !== 'no' ? 'yes' : 'no';
    } catch (error) {
      result[lang] = 'no';
    }
  }
  
  return result;
}

/**
 * Detect language
 */
export async function detectLanguage(text) {
  if (!detector) {
    await initializeLanguageDetector();
  }

  try {
    const results = await detector.detect(text);
    const topResult = results[0];
    return topResult.language;
  } catch (error) {
    console.error("Language detection failed:", error);
    // Fallback to browser language
    return navigator.language.split('-')[0];
  }
}

/**
 * Get translator instance - simplified to avoid progress tracking for downloads
 */
export async function getTranslator(sourceLang, targetLang) {
  if (!await isTranslatorAvailable()) {
    throw new Error("Translator API is not available");
  }

  const cacheKey = `${sourceLang}-${targetLang}`;
  if (translatorCache.has(cacheKey)) {
    return translatorCache.get(cacheKey);
  }

  try {
    const translator = await window.ai.translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      // Remove progress monitor to avoid download UI
    });

    translatorCache.set(cacheKey, translator);
    return translator;
  } catch (error) {
    console.error("Failed to create translator:", error);
    throw new Error(`Translation from ${sourceLang} to ${targetLang} not available`);
  }
}

/**
 * Translate text with fallback options
 */
export async function translateText(text, targetLanguage, sourceLanguage = null) {
  if (!text) {
    throw new Error("Text cannot be empty");
  }
  
  // Determine source language if not provided
  const actualSourceLanguage = sourceLanguage || await detectLanguage(text);
  if (!actualSourceLanguage) {
    throw new Error("Could not determine source language");
  }
  
  // No need to translate if languages match
  if (actualSourceLanguage === targetLanguage) {
    return text;
  }
  
  try {
    // Try using Chrome's translator API without download tracking
    const translator = await getTranslator(actualSourceLanguage, targetLanguage);
    return await translator.translate(text);
  } catch (error) {
    console.error("Chrome API Translation Error:", error);
    
    // Fallback to a URL-based translation if Chrome API fails
    // This doesn't actually perform translation but provides a fallback error message
    // In a production app, you might integrate with an online translation service
    throw new Error("Translation unavailable. Please try again later.");
  }
}

// Enhanced chat window component without download progress tracking
export function EnhancedChatWindow() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeLanguageDetector().catch(err => {
      setError("Failed to initialize language detector: " + err.message);
    });
  }, []);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const detectedLang = await detectLanguage(text);
      
      const newMessage = {
        id: Date.now(),
        text,
        language: detectedLang,
        translations: {},
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    } catch (err) {
      setError("Failed to process message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId, text, sourceLang, targetLang) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setLoading(true);
    setError('');

    try {
      const translation = await translateText(text, targetLang, sourceLang);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              translations: {
                ...msg.translations,
                [targetLang]: translation
              }
            }
          : msg
      ));
    } catch (err) {
      setError("Translation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className="message-box">
            <div className="original-text">
              <p>{message.text}</p>
              <span className="language-label">
                Detected: {message.language}
              </span>
            </div>

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
              >
                <option value="">Translate to...</option>
                {['en', 'es', 'fr', 'de', 'ja', 'zh', 'ru', 'pt', 'tr'].map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {Object.entries(message.translations).map(([lang, text]) => (
              <div key={lang} className="translation-result">
                <span className="language-code">{lang.toUpperCase()}: </span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-area">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={loading || !inputText.trim()}
        >
          {loading ? "Processing..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default EnhancedChatWindow;