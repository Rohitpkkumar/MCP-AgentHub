import React from "react";
import "./ToggleButtons.css";

const ToggleButtons = ({ activeCard, setActiveCard }) => {
  return (
    <div className="toggle-container">
      <button
        className={activeCard === "upload" ? "active" : ""}
        onClick={() => setActiveCard("upload")}
      >
        Upload Evidence
      </button>
      <button
        className={activeCard === "verify" ? "active" : ""}
        onClick={() => setActiveCard("verify")}
      >
        Verify Evidence
      </button>
    </div>
  );
};

export default ToggleButtons;
