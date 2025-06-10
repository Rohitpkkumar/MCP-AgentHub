import { evi_block_backend } from "declarations/evi_block_backend";
import { useState, useRef } from "react";
import ModernButton from "./Upload";
import FileInput from "./FileInput";
import Input from "./TextInput";
import "./index.scss";
import Particles from "./Particles";
import TrueFocus from "./TrueFocus ";
import Squares from "./Squares";
import ToggleButtons from "./ToggleButtons";
import Header from "./header";
import "./AboutPage.scss";
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";

async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function App() {
  const [caseNo, setCaseNo] = useState("");
  const [userId, setUserId] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [verifyCaseNo, setVerifyCaseNo] = useState("");
  const [verifyFileHash, setVerifyFileHash] = useState("");
  const [uploadResponse, setUploadResponse] = useState("");
  const [verifyResponse, setVerifyResponse] = useState("");
  const [activeCard, setActiveCard] = useState("upload");
  const [activePage, setActivePage] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Add refs for the file inputs
  const uploadFileInputRef = useRef(null);
  const verifyFileInputRef = useRef(null);

  const teamMembers = [
    {
      name: "Vibhas Dutta",
      role: "EviBlock Backend/Frontend Developer",
      description: "Enjoys designing secure, scalable systems on the blockchain.",
      photo: "team_pic/a coder boy wit defefb84-ae3d-40.png",
      links: {
        linkedin: "https://www.linkedin.com/in/vibhas-dutta-366119248/",
        github: "https://github.com/vibhasdutta",
      },
    },
    {
      name: "Abhinav Rajpati",
      role: "EviBlock Backend Engineer",
      description: "Driven by solving complex problems through smart contracts and AI logic.",
      photo: "team_pic/1689217388902.jpeg",
      links: {
        linkedin: "https://www.linkedin.com/in/abhinav-rajpati-551544250/",
        github: "https://github.com/Surventurer",
      },
    },
    {
      name: "Diwakar Pareek",
      role: "EviBlock Frontend Developer",
      description: "Passionate about crafting seamless user experiences with attention to detail.",
      photo: "team_pic/1700014817193.jpeg",
      links: {
        linkedin: "https://www.linkedin.com/in/diwakar-pareek-b20a2a28a/",
        github: "https://github.com/Deepdiwa",
      },
    },
    {
      name: "Rajeev.",
      role: "EviBlock Frontend Developer",
      description: "Loves building clean and interactive user interfaces.",
      photo: "team_pic/1694630906556.jpeg",
      links: {
        linkedin: "https://www.linkedin.com/in/rajeev-error404/",
        github: "https://github.com/rajeev-cyber",
      },
    },
  ];

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const hash = await hashFile(file);
      setFileHash(hash);
    }
  }

  async function handleVerifyFile(event) {
    const file = event.target.files[0];
    if (file) {
      const hash = await hashFile(file);
      setVerifyFileHash(hash);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!fileHash || !selectedFile) {
      setUploadResponse("Please select a file first.");
      return;
    }

    try {
      const timestamp = BigInt(Date.now()) * 1_000_000n;
      const response = await evi_block_backend.upload_evidence(
        caseNo,
        userId,
        fileHash,
        timestamp
      );
      const readableTime = new Date(Number(timestamp / 1_000_000n)).toLocaleString();
      setUploadResponse(
        `✅ ${selectedFile.name} uploaded by ${userId} at ${readableTime}`
      );
      
      // Reset form fields after successful upload
      setCaseNo("");
      setUserId("");
      setFileHash("");
      setSelectedFile(null);
      
      // Reset file input using the custom reset method
      if (uploadFileInputRef.current) {
        uploadFileInputRef.current.reset();
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadResponse("Error uploading evidence");
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (!verifyFileHash) {
      setVerifyResponse("Please select a file first.");
      return;
    }
    try {
      const response = await evi_block_backend.verify_evidence(
        verifyCaseNo,
        verifyFileHash
      );
      const timestampMatch = response.match(/At: (\d+)/);
      if (timestampMatch) {
        const ns = BigInt(timestampMatch[1]);
        const readableTime = new Date(Number(ns / 1_000_000n)).toLocaleString();
        const formattedResponse = response.replace(/At: \d+/, `At: ${readableTime}`);
        setVerifyResponse(formattedResponse);
        
        // Reset form fields after successful verification
        setVerifyCaseNo("");
        setVerifyFileHash("");
        
        // Reset file input using the custom reset method
        if (verifyFileInputRef.current) {
          verifyFileInputRef.current.reset();
        }
      } else {
        setVerifyResponse(response);
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setVerifyResponse("Error verifying evidence");
    }
  }

  return (
    <main className="app-wrapper">
      <Header setActivePage={setActivePage} />
      <div className="backani-container">
        <Squares speed={1.5} squareSize={100} direction="right" borderColor="#2452ff" hoverFillColor="#222" />
      </div>
      
      {activePage === "home" && (
        <>
          <ToggleButtons activeCard={activeCard} setActiveCard={setActiveCard} />

          <div className="card-row">
            {activeCard === "upload" && (
              <div className="card upload-card">
                <div className="card-bg">
                  <Particles particleColors={["#2452ff", "#92c5ff"]} particleCount={300} particleSpread={10} speed={0.1} particleBaseSize={290} moveParticlesOnHover={false} alphaParticles={false} disableRotation={false} />
                </div>
                <div className="card-content">
                  <TrueFocus sentence="Upload Evidence" blurAmount={4} borderColor="#2452ff" />
                  <h2></h2>
                  <form onSubmit={handleUpload}>
                    <Input label="Case Number:" value={caseNo} onChange={(e) => setCaseNo(e.target.value)} required />
                    <Input label="User ID:" value={userId} onChange={(e) => setUserId(e.target.value)} required />
                    <FileInput 
                      label="Upload File" 
                      onChange={handleFileUpload} 
                      required 
                      ref={uploadFileInputRef}
                    />
                    <ModernButton text="Upload Evidence" />
                  </form>
                  {uploadResponse && <p className="response-msg">{uploadResponse}</p>}
                </div>
              </div>
            )}

            {activeCard === "verify" && (
              <div className="card verify-card">
                <div className="card-bg">
                  <Particles particleColors={["#2452ff", "#92c5ff"]} particleCount={300} particleSpread={10} speed={0.1} particleBaseSize={290} moveParticlesOnHover={false} alphaParticles={false} disableRotation={false} />
                </div>
                <div className="card-content">
                  <TrueFocus sentence="Verify Evidence" blurAmount={4} borderColor="#2452ff" />
                  <h2></h2>
                  <form onSubmit={handleVerify}>
                    <Input label="Case Number:" value={verifyCaseNo} onChange={(e) => setVerifyCaseNo(e.target.value)} required />
                    <FileInput 
                      label="Upload File for Verification" 
                      onChange={handleVerifyFile} 
                      required 
                      ref={verifyFileInputRef}
                    />
                    <ModernButton text="Verify Evidence" />
                  </form>
                  {verifyResponse && <p className="response-msg">{verifyResponse}</p>}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activePage === "about" && (
        <div className="about-page">
          <h2>About Us</h2>
          <p>
            Eviblock is a blockchain-based digital evidence verification platform. Upload and verify the authenticity of your files using decentralized trust.
          </p>
          <p>
            This tool ensures a tamper-proof chain of custody for files related to cybercrime and legal evidence handling. Built with security, simplicity, and transparency in mind.
          </p>
          <div className="scroll-down">↓ Scroll Down to Meet the Team ↓</div>

          <div className="team-section">
            {teamMembers.map((member, index) => (
              <div className="team-card" key={index}>
                <img src={member.photo} alt={`${member.name}'s avatar`} className="avatar" />
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
                <p className="desc">{member.description}</p>
                <div className="social-links">
                  {member.links.linkedin && <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>}
                  {member.links.github && <a href={member.links.github} target="_blank" rel="noopener noreferrer"><FaGithub /></a>}
                  {member.links.twitter && <a href={member.links.twitter} target="_blank" rel="noopener noreferrer"><FaTwitter /></a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
