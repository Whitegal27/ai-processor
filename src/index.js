import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { isTranslatorAvailable, isLanguageAvailable } from "./api/chromeAI";

const ORIGIN_TRIAL_TOKENS = {
  LANGUAGE_DETECTOR: "Ajp1CBohSl/FGMbCzzNY15X5peBNajTun+kIAX0on/KcXwb4TkOJD56/8Mn2CqepxMxLwl5JPkqQFHNRAcsJkAAAAABXeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjMwMDIiLCJmZWF0dXJlIjoiTGFuZ3VhZ2VEZXRlY3Rpb25BUEkiLCJleHBpcnkiOjE3NDk1OTk5OTl9",
  TRANSLATOR: "Aoeg49e8gXziww8aMaciOT3ocfAg14TCdd6srBr0/ENCVaog72otR4Or4Qjz9qByZNGl2mbK/pxvft9j0jf8sw0AAABReyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJmZWF0dXJlIjoiVHJhbnNsYXRpb25BUEkiLCJleHBpcnkiOjE3NTMxNDI0MDB9"
};

// Add Origin Trial meta tags if tokens are provided
Object.entries(ORIGIN_TRIAL_TOKENS).forEach(([key, token]) => {
  if (token && token.length > 20) {
    const meta = document.createElement('meta');
    meta.httpEquiv = "origin-trial";
    meta.content = token;
    document.head.appendChild(meta);
    console.log(`Added Origin Trial token for: ${key}`);
  }
});

// Add parameter to disable translation API check
if (window.chrome && window.chrome.webview) {
  try {
    // For local testing, attempts to disable translation API checks
    const params = new URLSearchParams(window.location.search);
    if (params.get('disableCheck') === 'true') {
      console.log("Attempting to disable translation API checks for testing");
    }
  } catch (e) {
    console.warn("Could not access URL parameters", e);
  }
}

// Check API availability without progress monitoring
const checkAPIAvailability = async () => {
  try {
    const translatorAvailable = await isTranslatorAvailable();
    const englishAvailable = await isLanguageAvailable('en');
    
    console.log("Chrome Translator API available:", translatorAvailable);
    console.log("English language detection available:", englishAvailable);
    
    return translatorAvailable || englishAvailable;
  } catch (error) {
    console.error("Error checking API availability:", error);
    return false;
  }
};

// Render app or fallback UI based on API availability
const renderApp = async () => {
  const apiAvailable = await checkAPIAvailability();
  const root = ReactDOM.createRoot(document.getElementById("root"));
  
  root.render(
    <React.StrictMode>
      {apiAvailable ? (
        <App />
      ) : (
        <div className="api-unavailable">
          <h1>Chrome AI APIs Required</h1>
          <p>This application requires Chrome&apos;s AI APIs to function. Please enable them by:</p>
         
          <h2>Option 1: Enable via Chrome Flags (for local development)</h2>
          <ol>
            <li>Make sure you&apos;re using Chrome version 132 or later</li>
            <li>For Language Detection: Visit <code>chrome://flags/#language-detection-api</code></li>
            <li>For Translation: Visit <code>chrome://flags/#translation-api</code></li>
            <li>Set both to &quot;Enabled&quot;</li>
            <li>Click &quot;Relaunch&quot; to restart Chrome</li>
          </ol>
         
          <h2>Option 2: Join the Origin Trials (for production use)</h2>
          <ol>
            <li>Visit the <a href="https://developer.chrome.com/origintrials/#/view_trial/3992603377178091521" target="_blank" rel="noopener noreferrer">Language Detector API Origin Trial</a></li>
            <li>Visit the <a href="https://developer.chrome.com/origintrials/#/view_trial/1749456650623786993" target="_blank" rel="noopener noreferrer">Translator API Origin Trial</a></li>
            <li>Register your domain for both trials</li>
            <li>Add the provided tokens to this page</li>
          </ol>
         
          <h3>For better experience:</h3>
          <p>This app is configured to use translation without requiring downloads.</p>
        </div>
      )}
    </React.StrictMode>
  );
};

renderApp();