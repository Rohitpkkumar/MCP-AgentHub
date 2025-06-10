// Header.js
import "./index.scss";


export default function Header({ setActivePage }) {
  return (
    <header className="site-header">
      <div className="logo-title">
        <img src="/EviBlockLogo.svg" alt="Eviblock Logo" className="logo" />
        <h1 className="site-title">EviBlock</h1>
      </div>
      <nav className="nav-links">
        <button onClick={() => setActivePage("home")}>Home</button>
        <button onClick={() => setActivePage("about")}>About</button>
      </nav>
    </header>
  );
}
