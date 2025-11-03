import React, { useState } from "react";
import axios from "axios";
import "../InvoiceCreate.css"; // reuse existing styles

const QuoteCreate = () => {
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    postCode: "",
    category: "",
    services: [{ name: "", price: "", quantity: "" }],
    materials: [], // NEW
    discount: "", // flat £ amount
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    notes: "",
  });

  const [showMaterials, setShowMaterials] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (key, index, e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const list = [...prev[key]];
      list[index][name] = value;
      return { ...prev, [key]: list };
    });
  };

  const addRow = (key) =>
    setForm((p) => ({
      ...p,
      [key]: [...p[key], { name: "", price: "", quantity: "" }],
    }));

  const removeRow = (key, index) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Guards: services must be valid
    if (!form.services.length) {
      alert("Please add at least one service.");
      return;
    }
    for (const [i, s] of form.services.entries()) {
      const qty = Number(s.quantity);
      const price = Number(s.price);
      if (!s.name?.trim()) {
        alert(`Service #${i + 1}: name is required.`);
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        alert(`Service #${i + 1}: price must be ≥ 0.`);
        return;
      }
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        alert(`Service #${i + 1}: quantity must be an integer ≥ 1.`);
        return;
      }
    }

    // --- Guards: materials (if any) must be valid
    for (const [i, m] of (form.materials || []).entries()) {
      const qty = Number(m.quantity);
      const price = Number(m.price);
      if (!m.name?.trim()) {
        alert(`Material #${i + 1}: name is required.`);
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        alert(`Material #${i + 1}: price must be ≥ 0.`);
        return;
      }
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        alert(`Material #${i + 1}: quantity must be an integer ≥ 1.`);
        return;
      }
    }

    // --- Guard: valid until is required
    if (!form.validUntil) {
      alert("Please select a 'Valid Until' date.");
      return;
    }

    try {
      const payload = {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientAddress: form.clientAddress.trim(),
        postCode: form.postCode.trim(),
        category: form.category,
        services: form.services.map((s) => ({
          name: s.name.trim(),
          price: Number(s.price),
          quantity: Number(s.quantity),
        })),
        materials: (form.materials || []).map((m) => ({
          name: m.name.trim(),
          price: Number(m.price),
          quantity: Number(m.quantity),
        })),
        discount: Math.max(0, Number(form.discount || 0)), // never negative
        date: form.date, // created/issue date
        validUntil: form.validUntil, // required
        notes: form.notes?.trim() || undefined,
      };

      const res = await axios.post(
        "http://localhost:4000/api/quotes/create",
        payload
      );
      alert(res.data.message || "Quotation created");

      // reset
      setForm({
        clientName: "",
        clientPhone: "",
        clientAddress: "",
        postCode: "",
        category: "",
        services: [{ name: "", price: "", quantity: "" }],
        materials: [],
        discount: "",
        date: new Date().toISOString().split("T")[0],
        validUntil: "",
        notes: "",
      });
      setShowMaterials(true);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error creating quotation");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Create Quotation</h2>

        <h3>Client Details</h3>
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
              placeholder="Phone / Email"
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

        <h3>Services</h3>
        {(form.services || []).map((row, idx) => (
          <div className="service-group" key={`svc-${idx}`}>
            <div className="service-input">
              <textarea
                name="name"
                placeholder="Service Name"
                value={row.name}
                onChange={(e) => handleArrayChange("services", idx, e)}
                rows={3}
                style={{ width: "85%", resize: "vertical" }}
                required
              />
            </div>
            <div className="service-input">
              <input
                type="number"
                name="price"
                placeholder="Price (£)"
                value={row.price}
                onChange={(e) => handleArrayChange("services", idx, e)}
                required
              />
            </div>
            <div className="service-input">
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => handleArrayChange("services", idx, e)}
                min="1"
                required
              />
            </div>
            {form.services.length > 1 && (
              <button
                type="button"
                className="remove-service-btn"
                onClick={() => removeRow("services", idx)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="add-service-btn"
          onClick={() => addRow("services")}
        >
          Add Service
        </button>

        {/* Materials (collapsible/always-visible per your choice) */}
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Materials
        </h3>
        {showMaterials && (
          <>
            {(form.materials || []).map((row, idx) => (
              <div className="service-group" key={`mat-${idx}`}>
                <div className="service-input">
                  <textarea
                    name="name"
                    placeholder="Material Name"
                    value={row.name}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    rows={2}
                    style={{ width: "85%", resize: "vertical" }}
                    required
                  />
                </div>
                <div className="service-input">
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (£)"
                    value={row.price}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    required
                  />
                </div>
                <div className="service-input">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    min="1"
                    required
                  />
                </div>
                {(form.materials || []).length > 0 && (
                  <button
                    type="button"
                    className="remove-service-btn"
                    onClick={() => removeRow("materials", idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-service-btn"
              onClick={() => addRow("materials")}
            >
              Add Material
            </button>
          </>
        )}

        {/* Discount + Dates */}
        <div className="service-group">
          <div className="service-input">
            <input
              type="number"
              name="discount"
              placeholder="Discount (£ flat)"
              value={form.discount}
              onChange={handleInputChange}
              min="0"
            />
          </div>

          {/* Created / Issue Date */}
          <div className="service-input">
            <label style={{ display: "block", fontWeight: "600" }}>
              Created / Issue Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Valid Until */}
          <div className="service-input">
            <label style={{ display: "block", fontWeight: "600" }}>
              Valid Until *
            </label>
            <input
              type="date"
              name="validUntil"
              value={form.validUntil}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="service-group">
          <div className="service-input" style={{ maxWidth: 400 }}>
            <input
              type="text"
              name="notes"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <button type="submit">Generate Quotation</button>
      </form>
    </div>
  );
};

export default QuoteCreate;
