import React from "react";
import { BrowserRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import InvoiceCreate from "./InvoiceCreate";
import SavedInvoices from "./SavedInvoices";
import './Main.css'; // Custom styles

const Main = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <ul className="navbar-list">
            <li className="navbar-item">
              <NavLink
                to="/create-invoice"
                className="navbar-link"
              >
                Create Invoice
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink
                to="/saved-invoices"
                className="navbar-link"
              >
                Saved Invoices
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="main-content">
          <Routes>
            <Route path="/create-invoice" element={<InvoiceCreate />} />
            <Route path="/saved-invoices" element={<SavedInvoices />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default Main;
