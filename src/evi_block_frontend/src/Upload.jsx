import React from "react";
import styled from "styled-components";

const ModernButton = ({ text = "Upload" }) => {
  return (
    <StyledWrapper>
      <button className="animated-button">
        <svg
          viewBox="0 0 24 24"
          className="arr-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
        <span className="text">{text}</span>
        <span className="circle" />
        <svg
          viewBox="0 0 24 24"
          className="arr-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;

  .border-wrapper {
    padding: 4px;
    border-radius: 12px;
    background: linear-gradient(270deg, #3b82f6, #6366f1, #3b82f6);
    background-size: 600% 600%;
    animation: animatedBorder 6s ease infinite;
  }

  .animated-button {
    @import url("https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");
    font-family: "Space Mono", monospace;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1rem;
    border: none;
    font-size: 1rem;
    background-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    z-index: 1;
    transition: all 0.3s ease-in-out;
  }

  @keyframes animatedBorder {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .animated-button svg {
    position: absolute;
    width: 20px;
    fill: #ffffff;
    z-index: 2;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button .arr-1 {
    right: 16px;
  }

  .animated-button .arr-2 {
    left: -25%;
  }

  .animated-button .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background-color: #ffffff;
    border-radius: 50%;
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button .text {
    position: relative;
    z-index: 1;
    transform: translateX(-8px);
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button:hover {
    background-color: #2563eb;
  }

  .animated-button:hover .arr-1 {
    right: -25%;
  }

  .animated-button:hover .arr-2 {
    left: 16px;
  }

  .animated-button:hover .text {
    transform: translateX(12px);
  }

  .animated-button:active {
    scale: 0.95;
    background-color: #1e40af;
  }

  .animated-button:hover .circle {
    width: 220px;
    height: 220px;
    opacity: 0.1;
  }
`;

export default ModernButton;
