import React, { useState } from "react";

const InputBox = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="input-area">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your text..."
      />
      <button onClick={handleSend}>➤</button>
    </div>
  );
};

export default InputBox;
