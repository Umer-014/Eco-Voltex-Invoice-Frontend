import React, { useState, useRef } from "react";
import api from "../lib/lib";
import "./InvoiceCreate.css";

const InvoiceCreate = () => {
  const [clientType, setClientType] = useState("new");
  const [suggestions, setSuggestions] = useState([]);
  const [searchName, setSearchName] = useState("");
  const debounceRef = useRef(null);
  const [showSiteAddress, setShowSiteAddress] = useState(false);

  const [hasMaterial, setHasMaterial] = useState(false);

  // Loading States
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    postCode: "",
    siteAddress: "",
    sitePostCode: "",
    paymentOption: "Bank Transfer", // ✅ Default to Bank Transfer
    category: "",
    workType: [], // ✅ Multiple work types stored as an array
    services: [{ name: "", price: "", quantity: 1 }], // ✅ Default quantity 1
    hasMaterial: false,
    materials: [{ name: "", price: "", quantity: 1 }], // ✅ Default quantity 1
    paidAmount: 0, // ✅ Default initial amount 0
    date: new Date().toISOString().split("T")[0],
    discount: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // ✅ Handle Multiple Work Type Checkboxes
  const handleWorkTypeChange = (e) => {
    const { value, checked } = e.target;
    let updatedWorkTypes = [...form.workType];
    if (checked) {
      updatedWorkTypes.push(value);
    } else {
      updatedWorkTypes = updatedWorkTypes.filter((type) => type !== value);
    }
    setForm({ ...form, workType: updatedWorkTypes });
  };

  // 🔎 Search Existing Client
  const searchClient = (value) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/clients/", { params: { name: value } });
        setSuggestions(
          Array.isArray(res.data) ? res.data : res.data ? [res.data] : [],
        );
      } catch (error) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
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
      services: [...form.services, { name: "", price: "", quantity: 1 }],
    });
  };

  const removeService = (index) => {
    const updatedServices = form.services.filter((_, i) => i !== index);
    setForm({ ...form, services: updatedServices });
  };

  // Material Handlers
  const handleMaterialChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMaterials = [...form.materials];
    updatedMaterials[index][name] = value;
    setForm({ ...form, materials: updatedMaterials });
  };

  const addMaterial = () => {
    setForm({
      ...form,
      materials: [...form.materials, { name: "", price: "", quantity: 1 }],
    });
  };

  const removeMaterial = (index) => {
    const updatedMaterials = form.materials.filter((_, i) => i !== index);
    setForm({ ...form, materials: updatedMaterials });
  };

  const toggleMaterialSection = () => {
    const nextState = !hasMaterial;
    setHasMaterial(nextState);
    setForm({ ...form, hasMaterial: nextState });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/invoices", form);

      alert(response.data.message);

      if (response.status === 201) {
        setForm({
          clientName: "",
          clientPhone: "",
          clientAddress: "",
          siteAddress: "",
          sitePostCode: "",
          postCode: "",
          paymentOption: "Bank Transfer",
          category: "",
          workType: [],
          services: [{ name: "", price: "", quantity: 1 }],
          hasMaterial: false,
          materials: [{ name: "", price: "", quantity: 1 }],
          paidAmount: 0,
          date: new Date().toISOString().split("T")[0],
          discount: "",
        });

        setClientType("new");
        setSearchName("");
        setSuggestions([]);
        setShowSiteAddress(false);
        setHasMaterial(false);
      }
    } catch (error) {
      alert("Error creating invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Create Invoice</h2>
        <h3>Client Details</h3>

        <div className="client-top-bar">
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
              padding: "10px 16px",
              border: "none",
              cursor: "pointer",
              background: clientType === "new" ? "#007bff" : "#ccc",
              color: "#fff",
              borderRadius: "8px",
              height: "46px",
            }}
          >
            New Client
          </button>

          <button
            type="button"
            onClick={() => setClientType("existing")}
            style={{
              padding: "10px 16px",
              border: "none",
              cursor: "pointer",
              background: clientType === "existing" ? "#007bff" : "#ccc",
              color: "#fff",
              borderRadius: "8px",
              height: "46px",
            }}
          >
            Existing Client
          </button>

          {clientType === "existing" && (
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
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
                      setIsSearching(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    height: "46px",
                    margin: 0,
                    boxSizing: "border-box",
                  }}
                />
                {isSearching && (
                  <div
                    style={{
                      position: "absolute",
                      right: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className="spinner-small"
                      style={{ borderTopColor: "#007bff" }}
                    ></span>
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "0 0 8px 8px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {suggestions.map((client, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "10px 12px",
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

        <div className="client-fields-grid">
          <input
            type="text"
            name="clientName"
            placeholder="Name"
            value={form.clientName}
            onChange={handleInputChange}
            required
          />

          <input
            type="text"
            name="clientPhone"
            placeholder="Phone No / Email"
            value={form.clientPhone}
            onChange={handleInputChange}
          />

          <input
            type="text"
            name="clientAddress"
            placeholder="Address"
            value={form.clientAddress}
            onChange={handleInputChange}
            required
          />

          <input
            type="text"
            name="postCode"
            placeholder="Post Code"
            value={form.postCode}
            onChange={handleInputChange}
            required
          />

          <button
            type="button"
            style={{
              padding: "0 16px",
              border: "none",
              cursor: "pointer",
              background: showSiteAddress ? "#343a40" : "#6c757d",
              color: "#fff",
              borderRadius: "8px",
              height: "46px",
              whiteSpace: "nowrap",
            }}
            onClick={() => setShowSiteAddress((prev) => !prev)}
          >
            {showSiteAddress ? "Remove Site Address" : "Add Site Address"}
          </button>

          {showSiteAddress && (
            <>
              <input
                type="text"
                name="siteAddress"
                placeholder="Site Address"
                value={form.siteAddress}
                onChange={handleInputChange}
                required
              />

              <input
                type="text"
                name="sitePostCode"
                placeholder="Site Post Code"
                value={form.sitePostCode}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          <select
            name="paymentOption"
            value={form.paymentOption}
            onChange={handleInputChange}
            required
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Check">Check</option>
            <option value="Cash">Cash</option>
          </select>

          <input
            type="number"
            name="paidAmount"
            placeholder="Initial Paid Amount"
            value={form.paidAmount}
            onChange={handleInputChange}
            min="0"
            required
          />

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

        {/* ✅ Multiple Work Types Selection Checkboxes */}
        <div
          style={{
            margin: "15px 0",
            background: "#f8f9fa",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#444",
            }}
          >
            Select Work Type(s) *
          </label>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {["Electrical", "CCTV", "Fire Alarm"].map((type) => (
              <label
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                <input
                  type="checkbox"
                  value={type}
                  checked={form.workType.includes(type)}
                  onChange={handleWorkTypeChange}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Services section with Rich Bullet-point ready Textarea */}
        <h3>Services</h3>
        {form.services.map((service, index) => (
          <div
            className="service-group"
            key={index}
            style={{ alignItems: "flex-start" }}
          >
            <div className="service-name-input" style={{ flex: 2 }}>
              <textarea
                name="name"
                placeholder="Service Name / Detailed Bullet Points (e.g., • Installed panel&#10;• Tested wiring)"
                value={service.name}
                onChange={(e) => handleServiceChange(index, e)}
                rows={3}
                style={{ height: "80px", resize: "vertical" }}
                required
              />
            </div>

            <div className="service-price-input" style={{ flex: 1 }}>
              <input
                type="number"
                name="price"
                placeholder="Price (£)"
                value={service.price}
                onChange={(e) => handleServiceChange(index, e)}
                required
              />
            </div>

            <div className="service-qty-input" style={{ flex: 1 }}>
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
                style={{ height: "80px" }}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-service-btn" onClick={addService}>
          + Add Service
        </button>

        {/* Materials Toggle Section */}
        <div style={{ margin: "20px 0" }}>
          <button
            type="button"
            className="add-service-btn"
            style={{ backgroundColor: hasMaterial ? "#dc3545" : "#17a2b8" }}
            onClick={toggleMaterialSection}
          >
            {hasMaterial ? "Remove Materials Section" : "+ Add Materials"}
          </button>
        </div>

        {/* Collapsible Materials Section */}
        {hasMaterial && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              marginBottom: "20px",
            }}
          >
            <h3>Materials</h3>
            {form.materials.map((material, index) => (
              <div
                className="service-group"
                key={index}
                style={{ alignItems: "flex-start" }}
              >
                <div className="service-name-input" style={{ flex: 2 }}>
                  <textarea
                    name="name"
                    placeholder="Material Name / Specs (e.g., • 4mp Camera&#10;• Cat6 Cable)"
                    value={material.name}
                    onChange={(e) => handleMaterialChange(index, e)}
                    rows={2}
                    style={{ height: "60px", resize: "vertical" }}
                    required={hasMaterial}
                  />
                </div>

                <div className="service-price-input" style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (£)"
                    value={material.price}
                    onChange={(e) => handleMaterialChange(index, e)}
                    required={hasMaterial}
                  />
                </div>

                <div className="service-qty-input" style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={material.quantity}
                    onChange={(e) => handleMaterialChange(index, e)}
                    min="1"
                    required={hasMaterial}
                  />
                </div>

                {form.materials.length > 1 && (
                  <button
                    type="button"
                    className="remove-service-btn"
                    onClick={() => removeMaterial(index)}
                    style={{ height: "60px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="add-service-btn"
              onClick={addMaterial}
            >
              + Add Another Material
            </button>
          </div>
        )}

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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner"></span> Generating Invoice...
            </>
          ) : (
            "Generate Invoice"
          )}
        </button>
      </form>
    </div>
  );
};

export default InvoiceCreate;
