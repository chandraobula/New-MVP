// src/components/Buttons.js
import React from "react";
import "./Buttons.css"; // Create and import CSS for styling

const Button = ({ className, text, onClick }) => {
  return (
    <button className={`button ${className}`} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
