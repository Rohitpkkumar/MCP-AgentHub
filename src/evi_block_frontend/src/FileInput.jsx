import React, { useId, useState, forwardRef, useImperativeHandle } from "react";
import styled from "styled-components";

const FileInput = forwardRef(({
  label = "Upload file...",
  onChange,
  required = false,
  accept = "*",
  multiple = false,
}, ref) => {
  const id = useId();
  const [fileName, setFileName] = useState("");
  const inputRef = React.useRef(null);

  // Expose reset method through ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setFileName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }));

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setFileName(
        files.length === 1 ? files[0].name : `${files.length} files selected`
      );
    } else {
      setFileName("");
    }
    onChange?.(e);
  };

  return (
    <StyledWrapper>
      <div className={`file-box ${fileName ? "has-file" : ""}`}>
        <input
          type="file"
          id={id}
          onChange={handleChange}
          required={required}
          accept={accept}
          multiple={multiple}
          ref={inputRef}
        />
        <label htmlFor={id}>
          <span className="label-text">{label}</span>
          {fileName && <span className="file-name">{fileName}</span>}
        </label>
      </div>
    </StyledWrapper>
  );
});

const StyledWrapper = styled.div`
  .file-box {
    position: relative;
    border: 2px dashed #3b82f6; /* blue-500 */
    background-color: #92c5ff;
    border-radius: 10px;
    height: 180px;
    padding: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: border-color 0.3s ease;
    transition: background 0.3s ease;
    cursor: pointer;
  }

  .file-box:hover {
    border-color: #1739bc; /* blue-600 */
    background: #d9edff;
    transition: background 0.3s ease;
  }

  input[type="file"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  label {
    z-index: 1;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label-text {
    font-size: 1rem;
    font-weight: 600;
    color: #111f55; /* Stronger blue */
    transition: transform 0.25s ease, font-size 0.25s ease, color 0.25s ease;
  }

  .file-box.has-file .label-text {
    transform: translateY(-1.2em);
    font-size: 0.85rem;
    color: #1d4ed8; /* blue-700 */
  }

  .file-name {
    margin-top: 0.5em;
    font-size: 0.95rem;
    color: #1e3a8a; /* blue-900 */
    max-width: 90%;
    word-break: break-word;
    text-align: center;
  }
`;

export default FileInput;