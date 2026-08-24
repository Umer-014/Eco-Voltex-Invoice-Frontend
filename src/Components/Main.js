import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import InvoiceCreate from './InvoiceCreate';
import SavedInvoices from './SavedInvoices';
import QuoteCreate from './Quotation/QuoteCreate';
import SavedQuotes from './Quotation/SavedQuotes';
import Admin from './Admin';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import './Main.css';

const Main = () => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{padding: 24}}>Checking authentication...</div>;

  // If not logged in, force them to the Login page for any route
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <ul className="navbar-list">
          <li className="navbar-item"><NavLink to="/create-invoice" className="navbar-link">Create Invoice</NavLink></li>
          <li className="navbar-item"><NavLink to="/saved-invoices" className="navbar-link">Saved Invoices</NavLink></li>
          <li className="navbar-item"><NavLink to="/admin" className="navbar-link">Admin</NavLink></li>
          <li className="navbar-item"><NavLink to="/create-quote" className="navbar-link">Create Quote</NavLink></li>
          <li className="navbar-item"><NavLink to="/saved-quotes" className="navbar-link">Saved Quotes</NavLink></li>
        </ul>
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

export default Main; // Or export default Main;