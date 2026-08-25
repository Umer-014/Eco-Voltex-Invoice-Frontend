import React, { useState } from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import InvoiceCreate from "./InvoiceCreate";
import SavedInvoices from "./SavedInvoices";
import QuoteCreate from "./Quotation/QuoteCreate";
import SavedQuotes from "./Quotation/SavedQuotes";
import Admin from "./Admin";
import Login from "./Login";
import { useAuth } from "../context/AuthContext";
import "./Main.css";

const Main = () => {
  const { user, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading)
    return <div style={{ padding: 24 }}>Checking authentication...</div>;

  // If not logged in, force them to the Login page for any route
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-container">
          {/* Welcome Message / Branding */}
          <div className="navbar-brand">
            <span className="welcome-text">
              Welcome, <strong>{user.name || user.username || "User"}</strong>
            </span>
          </div>

          {/* Hamburger Menu Button for Mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span
              className={`hamburger-icon ${isMobileMenuOpen ? "open" : ""}`}
            ></span>
          </button>

          {/* Navbar Links & User Actions */}
          <ul className={`navbar-list ${isMobileMenuOpen ? "active" : ""}`}>
            <li className="navbar-item">
              <NavLink
                to="/create-invoice"
                className="navbar-link"
                onClick={closeMenu}
              >
                Create Invoice
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink
                to="/saved-invoices"
                className="navbar-link"
                onClick={closeMenu}
              >
                Saved Invoices
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink
                to="/create-quote"
                className="navbar-link"
                onClick={closeMenu}
              >
                Create Quote
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink
                to="/saved-quotes"
                className="navbar-link"
                onClick={closeMenu}
              >
                Saved Quotes
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/admin" className="navbar-link" onClick={closeMenu}>
                Admin
              </NavLink>
            </li>

            {/* Logout Button inside Navbar */}
            <li className="navbar-item mobile-logout-container">
              <button
                className="logout-btn"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/create-invoice" element={<InvoiceCreate />} />
          <Route path="/saved-invoices" element={<SavedInvoices />} />
          <Route path="/create-quote" element={<QuoteCreate />} />
          <Route path="/saved-quotes" element={<SavedQuotes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/create-invoice" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Main;
