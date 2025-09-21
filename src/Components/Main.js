import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import InvoiceCreate from './InvoiceCreate';
import SavedInvoices from './SavedInvoices';
import Admin from './Admin';
import Login from './Login'
import PrivateRoute from '../routes/PrivateRoute';
import './Main.css';

const Main = () => (
  <div className="app-container">
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item"><NavLink to="/create-invoice" className="navbar-link">Create Invoice</NavLink></li>
        <li className="navbar-item"><NavLink to="/saved-invoices" className="navbar-link">Saved Invoices</NavLink></li>
        <li className="navbar-item"><NavLink to="/admin" className="navbar-link">Login</NavLink></li>
      </ul>
    </nav>

    <div className="main-content">
      <Routes>
        <Route path="/create-invoice" element={<InvoiceCreate />} />
        <Route path="/saved-invoices" element={<SavedInvoices />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }

        />
        <Route path="/login" element={<
          Login/>} />
        <Route path="/" element={<InvoiceCreate />} />
      </Routes>
    </div>
  </div>
);

export default Main;
