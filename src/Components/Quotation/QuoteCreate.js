import React, { useState, useEffect, useRef } from "react";
import api from "../../lib/lib";
import "../InvoiceCreate.css";

const QuoteCreate = () => {
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    postCode: "",
    siteAddress: "",
    sitePostCode: "",
    category: "",
    workType: [],
    services: [{ name: "", price: "", quantity: "1" }],
    materials: [],
    discount: "",
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    notes:
      "• Important: Please ensure site access is granted prior to arrival.",
  });

  const [showMaterials, setShowMaterials] = useState(false);
  const [showSiteAddress, setShowSiteAddress] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state
  const workTypeRef = useRef(null);

  const workTypeOptions = ["Electrical", "CCTV", "Fire Alarm"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workTypeRef.current && !workTypeRef.current.contains(event.target)) {
        setIsWorkTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkTypeToggle = (type) => {
    setForm((prev) => {
      const currentWorkTypes = prev.workType;
      if (currentWorkTypes.includes(type)) {
        return {
          ...prev,
          workType: currentWorkTypes.filter((item) => item !== type),
        };
      } else {
        return {
          ...prev,
          workType: [...currentWorkTypes, type],
        };
      }
    });
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
      [key]: [...p[key], { name: "", price: "", quantity: "1" }],
    }));

  const removeRow = (key, index) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== index) }));

  const toggleMaterials = () => {
    if (!showMaterials) {
      setForm((p) => ({
        ...p,
        materials:
          p.materials.length === 0
            ? [{ name: "", price: "", quantity: "1" }]
            : p.materials,
      }));
    }
    setShowMaterials(!showMaterials);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.workType.length) {
      alert("Please select at least one work type.");
      return;
    }
    if (!form.category) {
      alert("Please select a category.");
      return;
    }
    if (!form.services.length) {
      alert("Please add at least one service.");
      return;
    }
    if (!form.validUntil) {
      alert("Please select a 'Valid Until' date.");
      return;
    }

    setLoading(true); // Start loading state

    try {
      const payload = {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientAddress: form.clientAddress.trim(),
        postCode: form.postCode.trim(),
        siteAddress: showSiteAddress ? form.siteAddress.trim() : "",
        sitePostCode: showSiteAddress ? form.sitePostCode.trim() : "",
        category: form.category,
        workType: form.workType,
        services: form.services.map((s) => ({
          name: s.name.trim(),
          price: Number(s.price),
          quantity: Number(s.quantity),
        })),
        materials: showMaterials
          ? (form.materials || []).map((m) => ({
              name: m.name.trim(),
              price: Number(m.price),
              quantity: Number(m.quantity),
            }))
          : [],
        discount: Math.max(0, Number(form.discount || 0)),
        date: form.date,
        validUntil: form.validUntil,
        notes: form.notes?.trim() || "",
      };

      const res = await api.post("/quotes", payload);
      alert(res.data.message || "Quotation created successfully");

      setForm({
        clientName: "",
        clientPhone: "",
        clientAddress: "",
        postCode: "",
        siteAddress: "",
        sitePostCode: "",
        category: "",
        workType: [],
        services: [{ name: "", price: "", quantity: "1" }],
        materials: [],
        discount: "",
        date: new Date().toISOString().split("T")[0],
        validUntil: "",
        notes:
          "• Important: Please ensure site access is granted prior to arrival.",
      });
      setShowMaterials(false);
      setShowSiteAddress(false);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error creating quotation");
    } finally {
      setLoading(false); // Stop loading state regardless of success/error
    }
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}
    >
      <form onSubmit={handleSubmit}>
        <h2>Create Quotation</h2>

        <h3>Client Details</h3>
        <div
          className="service-group"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div className="service-input" style={{ width: "100%" }}>
            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={form.clientName}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
          <div className="service-input" style={{ width: "100%" }}>
            <input
              type="text"
              name="clientPhone"
              placeholder="Phone / Email"
              value={form.clientPhone}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div className="service-input" style={{ width: "100%" }}>
            <input
              type="text"
              name="clientAddress"
              placeholder="Client Address"
              value={form.clientAddress}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
          <div className="service-input" style={{ width: "100%" }}>
            <input
              type="text"
              name="postCode"
              placeholder="Post Code"
              value={form.postCode}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
        </div>

        {/* Site Address Toggle */}
        <div style={{ margin: "15px 0" }}>
          <button
            type="button"
            className="add-service-btn"
            onClick={() => setShowSiteAddress(!showSiteAddress)}
            style={{
              backgroundColor: showSiteAddress ? "#d9534f" : "#0275d8",
              color: "#fff",
              padding: "8px 15px",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            {showSiteAddress ? "Remove Site Address" : "+ Add Site Address"}
          </button>
        </div>

        {showSiteAddress && (
          <div
            className="service-group"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div className="service-input" style={{ width: "100%" }}>
              <input
                type="text"
                name="siteAddress"
                placeholder="Site Address"
                value={form.siteAddress}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div className="service-input" style={{ width: "100%" }}>
              <input
                type="text"
                name="sitePostCode"
                placeholder="Site Post Code"
                value={form.sitePostCode}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Work Type (Multi-Select Dropdown) & Category side-by-side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          {/* Custom Multi-select Work Type */}
          <div style={{ position: "relative" }} ref={workTypeRef}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
              Work Type *
            </h3>
            <div
              onClick={() => setIsWorkTypeOpen(!isWorkTypeOpen)}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
                background: "#fff",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                {form.workType.length > 0
                  ? form.workType.join(", ")
                  : "Select work type(s)"}
              </span>
              <span>▼</span>
            </div>

            {isWorkTypeOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginTop: "4px",
                  zIndex: 10,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                {workTypeOptions.map((type) => (
                  <label
                    key={type}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px",
                      cursor: "pointer",
                      color: "#000",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.workType.includes(type)}
                      onChange={() => handleWorkTypeToggle(type)}
                      style={{ marginRight: "10px", cursor: "pointer" }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
              Category *
            </h3>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
                background: "#fff",
                color: "#000",
                height: "42px",
              }}
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
          <div
            className="service-group"
            key={`svc-${idx}`}
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 1fr auto",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div className="service-input" style={{ width: "100%" }}>
              <textarea
                name="name"
                placeholder="Service Name / Description (supports bullet points with Enter)"
                value={row.name}
                onChange={(e) => handleArrayChange("services", idx, e)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
                required
              />
            </div>
            <div className="service-input" style={{ width: "100%" }}>
              <input
                type="number"
                name="price"
                placeholder="Price (£)"
                value={row.price}
                onChange={(e) => handleArrayChange("services", idx, e)}
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>
            <div className="service-input" style={{ width: "100%" }}>
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => handleArrayChange("services", idx, e)}
                min="1"
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>
            {form.services.length > 1 && (
              <button
                type="button"
                className="remove-service-btn"
                onClick={() => removeRow("services", idx)}
                style={{
                  backgroundColor: "#d9534f",
                  color: "#fff",
                  border: "none",
                  padding: "10px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
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
          style={{
            backgroundColor: "#0275d8",
            color: "#fff",
            border: "none",
            padding: "8px 15px",
            cursor: "pointer",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          + Add Service
        </button>

        {/* Materials Section Header with Toggle on Right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            className="add-service-btn"
            onClick={toggleMaterials}
            style={{
              backgroundColor: showMaterials ? "#d9534f" : "#0275d8",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            {showMaterials ? "Hide Materials" : "+ Add Materials"}
          </button>
        </div>

        {showMaterials && (
          <div style={{ marginBottom: "20px" }}>
            {(form.materials || []).map((row, idx) => (
              <div
                className="service-group"
                key={`mat-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "3fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div className="service-input" style={{ width: "100%" }}>
                  <textarea
                    name="name"
                    placeholder="Material Name"
                    value={row.name}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    required
                  />
                </div>
                <div className="service-input" style={{ width: "100%" }}>
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (£)"
                    value={row.price}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div className="service-input" style={{ width: "100%" }}>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleArrayChange("materials", idx, e)}
                    min="1"
                    style={{
                      width: "100%",
                      padding: "10px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="remove-service-btn"
                  onClick={() => removeRow("materials", idx)}
                  style={{
                    backgroundColor: "#d9534f",
                    color: "#fff",
                    border: "none",
                    padding: "10px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-service-btn"
              onClick={() => addRow("materials")}
              style={{
                backgroundColor: "#5cb85c",
                color: "#fff",
                border: "none",
                padding: "8px 15px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              + Add Material
            </button>
          </div>
        )}

        {/* Discount + Dates */}
        <div
          className="service-group"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div className="service-input" style={{ width: "100%" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "5px",
              }}
            >
              Discount
            </label>
            <input
              type="number"
              name="discount"
              placeholder="Discount (£ flat)"
              value={form.discount}
              onChange={handleInputChange}
              min="0"
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div className="service-input" style={{ width: "100%" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "5px",
              }}
            >
              Created / Issue Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
          <div className="service-input" style={{ width: "100%" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "5px",
              }}
            >
              Valid Until *
            </label>
            <input
              type="date"
              name="validUntil"
              value={form.validUntil}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
        </div>

        {/* Notes Section */}
        <h3>Important Notes / Terms</h3>
        <div className="service-group" style={{ marginBottom: "20px" }}>
          <div className="service-input" style={{ width: "100%" }}>
            <textarea
              name="notes"
              placeholder="Type important notes or bullet points here using Enter..."
              value={form.notes}
              onChange={handleInputChange}
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: loading ? "#cccccc" : "#5cb85c",
            color: "#fff",
            padding: "12px",
            fontSize: "16px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          {loading ? "Generating Quotation..." : "Generate Quotation"}
        </button>
      </form>
    </div>
  );
};

export default QuoteCreate;
