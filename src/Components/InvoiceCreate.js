import React, { useState } from "react";
import axios from "axios";
import "./InvoiceCreate.css"; // Import the custom CSS

const InvoiceCreate = () => {
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
        form
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
          date: new Date().toISOString().split("T")[0], // Ensure date is always sent
        });
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
              type="tel"
              name="clientPhone"
              placeholder="Phone Number"
              value={form.clientPhone}
              onChange={handleInputChange}
              optional
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
              placeholder="Intial Paid Amount"
              value={form.paidAmount || ""} // Add 'advance' field to the state
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

        <h3>Services</h3>
        {form.services.map((service, index) => (
          <div className="service-group" key={index}>
            <div className="service-input">
              <input
                type="text"
                name="name"
                placeholder="Service Name"
                value={service.name}
                onChange={(e) => handleServiceChange(index, e)}
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
            <select
              name="discount"
              value={form.discount}
              onChange={handleInputChange}
            >
              <option value="">Select Discount</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
            </select>
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
