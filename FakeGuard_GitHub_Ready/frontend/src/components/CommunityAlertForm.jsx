import { useState } from "react";
import api from "../api/client";
import "./CommunityAlertForm.css";
const initialFormData = {
  productName: "",
  brandName: "",
  category: "",
  barcode: "",
  batchNumber: "",
  shopName: "",
  purchaseLocation: "",
  suspiciousReason: "",
  description: "",
};

function CommunityAlertForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const captureCurrentLocation = () => {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support geolocation.");
      return;
    }

    setLocationMessage("Capturing your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const capturedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setLocation(capturedLocation);
        setLocationMessage("Current location captured successfully.");
      },
      () => {
        setLocation(null);
        setLocationMessage(
          "Location could not be captured. Please allow location permission."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    const payload = {
      ...formData,
    };

    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.accuracy = location.accuracy;
      payload.geoSource = "GPS";
      payload.geoAddress = formData.purchaseLocation;
    }

    try {
      const response = await api.post("/alerts", payload);

      setMessageType("success");
      setMessage(
        response.data?.message ||
          "Fake product alert submitted successfully."
      );

      setFormData(initialFormData);
      setLocation(null);
      setLocationMessage("");
    } catch (error) {
      const errorMessage =
  error.response?.data?.errors?.[0]?.msg ||
  error.response?.data?.error ||
  error.response?.data?.message ||
  "Failed to submit the alert.";
  
      setMessageType("error");
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="community-alert-section">
      <h2>Report a Suspicious Product</h2>

      <p>
        Submit product information and location to create a community alert.
      </p>

      <form className="community-alert-form" onSubmit={handleSubmit}>
        <label>
          Product Name
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Brand Name
          <input
            type="text"
            name="brandName"
            value={formData.brandName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Food">Food</option>
            <option value="Medicine">Medicine</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Barcode
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
          />
        </label>

        <label>
          Batch Number
          <input
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
          />
        </label>

        <label>
          Shop Name
          <input
            type="text"
            name="shopName"
            value={formData.shopName}
            onChange={handleChange}
          />
        </label>

        <label>
          Purchase Location
          <input
            type="text"
            name="purchaseLocation"
            value={formData.purchaseLocation}
            onChange={handleChange}
            placeholder="For example: Tangail "
            required
          />
        </label>

        <label>
          Why is the product suspicious?
          <textarea
            name="suspiciousReason"
            value={formData.suspiciousReason}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Additional Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </label>

        <button type="button" onClick={captureCurrentLocation}>
          Use Current Location
        </button>

        {locationMessage && <p>{locationMessage}</p>}

        {location && (
          <div className="location-details">
            <p>Latitude: {location.latitude.toFixed(6)}</p>
            <p>Longitude: {location.longitude.toFixed(6)}</p>
            <p>Accuracy: {Math.round(location.accuracy)} metres</p>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Community Alert"}
        </button>

        {message && (
          <p className={`message ${messageType}`}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

export default CommunityAlertForm;