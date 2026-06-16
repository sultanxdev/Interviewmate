import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Layout = ({ children, backendStatus }) => {
  const { isSignedIn, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            Interview<span>Mate</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-only">
          <a href="#features">Features</a>
          <a href="#recruiters">Recruiters</a>
          <a href="#workflow">How It Works</a>
          <a href="#faq">FAQ</a>
          {!isSignedIn ? (
            <Link to="/signin">
              <button className="btn-primary">Sign In</button>
            </Link>
          ) : (
            <div className="nav-actions">
              <Link to="/dashboard">
                <button className="btn-secondary">Dashboard</button>
              </Link>
              <button className="btn-primary-outline" onClick={logout}>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Mobile Navigation Dropdown */}
        <div className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`}>
          <a href="#features" onClick={closeMobileMenu}>Features</a>
          <a href="#recruiters" onClick={closeMobileMenu}>Recruiters</a>
          <a href="#workflow" onClick={closeMobileMenu}>How It Works</a>
          <a href="#faq" onClick={closeMobileMenu}>FAQ</a>
          {!isSignedIn ? (
            <Link to="/signin" onClick={closeMobileMenu}>
              <button className="btn-primary w-full">Sign In</button>
            </Link>
          ) : (
            <div className="mobile-actions">
              <Link to="/dashboard" onClick={closeMobileMenu}>
                <button className="btn-secondary w-full">Dashboard</button>
              </Link>
              <button className="btn-primary-outline w-full" onClick={() => { logout(); closeMobileMenu(); }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="main-content-wrapper">
        {children}
      </div>

      <footer className="footer-premium">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="logo">
              Interview<span>Mate</span>
            </Link>
            <p className="footer-tagline">
              The ultimate conversational AI mock interview coach. Prepare, practice, and perfect your responses with low-latency voice agents.
            </p>
            <div className="footer-status">
              <span className={`status-indicator-dot ${backendStatus?.includes("Online") ? "active" : "inactive"}`}></span>
              <span className="status-text">{backendStatus || "Checking API..."}</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#recruiters">AI Recruiters</a></li>
              <li><a href="#workflow">Process Flow</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Features</h4>
            <ul>
              <li><span className="footer-text-link">Voice Simulation</span></li>
              <li><span className="footer-text-link">MERN Dashboard</span></li>
              <li><span className="footer-text-link">AI Reports</span></li>
              <li><span className="footer-text-link">Custom Agents</span></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Developer</h4>
            <ul>
              <li><span className="footer-text-link">Vapi.ai Integration</span></li>
              <li><span className="footer-text-link">OpenRouter LLM</span></li>
              <li><span className="footer-text-link">React 19 Frontend</span></li>
              <li><span className="footer-text-link">MongoDB Atlas</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} InterviewMate. All rights reserved. Built with passion for final year project.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
