import React, { useId } from "react";
import styled from "styled-components";

const Input = ({
  label = "Write here...",
  value,
  onChange,
  required = false,
}) => {
  const id = useId();

  return (
    <StyledWrapper>
      <div className="input-container">
        <input
          type="text"
          id={id}
          className="styled_input_bar"
          placeholder=" "
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="off"
        />
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .input-container {
    position: relative;
    width: 100%; /* Stretch full width */
    @import url("https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");
font-family: "Space Mono", monospace;
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    margin-bottom: 1.5em;
  }

  .styled_input_bar {
    width: 100%;
    padding: 1.15em 1em 0.85em 1em;
    font-size: 1rem;
    border: 2px solid #2563eb;
    border-radius: 8px;
    background-color: #92c5ff;
    color: #111827;
    transition: all 0.25s ease;
    box-sizing: border-box;
    appearance: none;
  }

  .styled_input_bar:focus {
    outline: none;
    border-color: #1e3a8a;
    background-color: #d9edff;
  }

  .styled_input_bar::placeholder {
    color: transparent;
  }

  .input-label {
    position: absolute;
    top: 50%;
    left: 1em;
    transform: translateY(-50%);
    font-size: 1rem;
    color: #111f55;
    background-color: #92c5ff;
    padding: 0 0.4em;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  .styled_input_bar:focus + .input-label,
  .styled_input_bar:not(:placeholder-shown) + .input-label {
    top: -0.8em;
    left: 0.8em;
    font-size: 0.75rem;
    color: #111f55;
  }
`;

export default Input;
