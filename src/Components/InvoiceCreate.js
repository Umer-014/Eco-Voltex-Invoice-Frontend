import React, { useState, useRef } from "react";
import axios from "axios";
import "./InvoiceCreate.css";

const InvoiceCreate = () => {
  const [clientType, setClientType] = useState("new");
  const [suggestions, setSuggestions] = useState([]);
  const [searchName, setSearchName] = useState("");
  const debounceRef = useRef(null);

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    postCode: "",
    paymentOption: "",
    category: "",
    services: [{ name: "", price: "", quantity: "" }],
    paidAmount: "",
    date: new Date().toISOString().split("T")[0],
    advance: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔎 Search Existing Client
  const searchClient = (value) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/clients/search?name=${value}`,
        );
        setSuggestions(res.data);
      } catch (error) {
        console.error("Search failed");
      }
    }, 400);
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedServices = [...form.services];
    updatedServices[index][name] = value;
    setForm({ ...form, services: updatedServices });
  };

  const addService = () => {
    setForm({
      ...form,
      services: [...form.services, { name: "", price: "", quantity: "" }],
    });
  };

  const removeService = (index) => {
    const updatedServices = form.services.filter((_, i) => i !== index);
    setForm({ ...form, services: updatedServices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/invoices/create",
        form,
      );

      alert(response.data.message);

      if (response.status === 201) {
        setForm({
          clientName: "",
          clientPhone: "",
          clientAddress: "",
          postCode: "",
          paymentOption: "",
          category: "",
          services: [{ name: "", price: "", quantity: "" }],
          paidAmount: "",
          date: new Date().toISOString().split("T")[0],
        });

        setClientType("new");
        setSearchName("");
        setSuggestions([]);
      }
    } catch (error) {
      alert("Error creating invoice");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Create Invoice</h2>
        <h3>Client Details</h3>

        {/* ✅ New / Existing Layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setClientType("new");
              setSuggestions([]);
              setSearchName("");
              setForm({
                ...form,
                clientName: "",
                clientPhone: "",
                clientAddress: "",
                postCode: "",
              });
            }}
            style={{
              padding: "8px 14px",
              border: "none",
              cursor: "pointer",
              background: clientType === "new" ? "#2c3e50" : "#ccc",
              color: "#fff",
            }}
          >
            New Client
          </button>

          <button
            type="button"
            onClick={() => setClientType("existing")}
            style={{
              padding: "8px 14px",
              border: "none",
              cursor: "pointer",
              background: clientType === "existing" ? "#2c3e50" : "#ccc",
              color: "#fff",
            }}
          >
            Existing Client
          </button>

          {/* 🔥 Right Side Search Field */}
          {clientType === "existing" && (
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search Existing Client Name..."
                value={searchName}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchName(value);

                  if (value.length > 1) {
                    searchClient(value);
                  } else {
                    setSuggestions([]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                }}
              />

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ddd",
                    maxHeight: "150px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {suggestions.map((client, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() => {
                        setForm({
                          ...form,
                          clientName: client.clientName,
                          clientPhone: client.clientPhone || "",
                          clientAddress: client.clientAddress || "",
                          postCode: client.postCode || "",
                        });
                        setSearchName(client.clientName);
                        setSuggestions([]);
                      }}
                    >
                      {client.clientName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🔹 Your Original Form Fields (Untouched) */}
        <div className="service-group">
          <div className="service-input">
            <input
              type="text"
              name="clientName"
              placeholder="Name"
              value={form.clientName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="service-input">
            <input
              type="text"
              name="clientPhone"
              placeholder="Phone No / Email"
              value={form.clientPhone}
              onChange={handleInputChange}
            />
          </div>

          <div className="service-input">
            <input
              type="text"
              name="clientAddress"
              placeholder="Address"
              value={form.clientAddress}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="service-input">
            <input
              type="text"
              name="postCode"
              placeholder="Post Code"
              value={form.postCode}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="service-input">
            <select
              name="paymentOption"
              value={form.paymentOption}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Payment Option</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="service-input">
            <input
              type="number"
              name="paidAmount"
              placeholder="Initial Paid Amount"
              value={form.paidAmount || ""}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>

          <div className="service-input">
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select category</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
        </div>
        {/* Services section remains EXACTLY your original logic */}
        <h3>Services</h3>
        {form.services.map((service, index) => (
          <div className="service-group" key={index}>
            <div className="service-input">
              <textarea
                name="name"
                placeholder="Service Name"
                value={service.name}
                onChange={(e) => handleServiceChange(index, e)}
                rows={3}
                style={{ width: "85%", resize: "vertical" }}
                required
              />
            </div>

            <div className="service-input">
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={service.price}
                onChange={(e) => handleServiceChange(index, e)}
                required
              />
            </div>

            <div className="service-input">
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={service.quantity}
                onChange={(e) => handleServiceChange(index, e)}
                min="1"
                required
              />
            </div>

            {form.services.length > 1 && (
              <button
                type="button"
                className="remove-service-btn"
                onClick={() => removeService(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-service-btn" onClick={addService}>
          Add Service
        </button>

        <div className="service-group">
          <div className="service-input">
            <input
              type="number"
              name="discount"
              placeholder="Discount (£ flat)"
              value={form.discount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="service-input">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <button type="submit">Generate Invoice</button>
      </form>
    </div>
  );
};

export default InvoiceCreate;
