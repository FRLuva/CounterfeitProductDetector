import { useState } from "react";
import api from "../api/client";

const initialForm = {
  traceId: "",
  stage: "",
  actorType: "",
  actorName: "",
  locationName: "",
  documentRef: "",
  note: "",
};

function AddChainEvent() {
  const [formData, setFormData] = useState(initialForm);
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

  const captureLocation = () => {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setLocationMessage("Capturing current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationMessage(
          "Current location captured successfully."
        );
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
      stage: formData.stage,
      actorType: formData.actorType,
      actorName: formData.actorName,
      locationName: formData.locationName,
      documentRef: formData.documentRef,
      note: formData.note,
    };

    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.accuracy = location.accuracy;
    }

    try {
      const traceId = formData.traceId.trim().toUpperCase();

      const response = await api.post(
        `/supply-chain/${encodeURIComponent(traceId)}/events`,
        payload
      );

      setMessageType("success");
      setMessage(
        response.data?.message ||
          "Supply chain event added successfully."
      );

      setFormData(initialForm);
      setLocation(null);
      setLocationMessage("");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to add supply chain event."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="add-chain-event-page">
      <section className="add-chain-event-section">
        <h2>Add Supply Chain Event</h2>

        <p>
          Add the next verified movement or processing stage to an existing
          product trace.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Trace ID
            <input
              type="text"
              name="traceId"
              value={formData.traceId}
              onChange={handleChange}
              placeholder="TRC-..."
              required
            />
          </label>

          <label>
            Supply Chain Stage
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              required
            >
              <option value="">Select stage</option>
              <option value="Quality Checked">
                Quality Checked
              </option>
              <option value="Packaged">Packaged</option>
              <option value="Shipped">Shipped</option>
              <option value="Distributor Received">
                Distributor Received
              </option>
              <option value="Wholesaler Received">
                Wholesaler Received
              </option>
              <option value="Retailer Received">
                Retailer Received
              </option>
              <option value="Sold To Customer">
                Sold To Customer
              </option>
              <option value="Returned">Returned</option>
              <option value="Flagged">Flagged</option>
            </select>
          </label>

          <label>
            Actor Type
            <select
              name="actorType"
              value={formData.actorType}
              onChange={handleChange}
              required
            >
              <option value="">Select actor type</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Distributor">Distributor</option>
              <option value="Wholesaler">Wholesaler</option>
              <option value="Retailer">Retailer</option>
              <option value="Customer">Customer</option>
            </select>
          </label>

          <label>
            Actor or Organisation Name
            <input
              type="text"
              name="actorName"
              value={formData.actorName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Event Location
            <input
              type="text"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="For example: Dhaka Distribution Centre"
              required
            />
          </label>

          <label>
            Document Reference
            <input
              type="text"
              name="documentRef"
              value={formData.documentRef}
              onChange={handleChange}
              placeholder="Optional invoice or shipment reference"
            />
          </label>

          <label>
            Note
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Describe what happened at this stage"
            />
          </label>

          <button type="button" onClick={captureLocation}>
            Use Current Location
          </button>

          {locationMessage && <p>{locationMessage}</p>}

          {location && (
            <div className="location-details">
              <p>
                Latitude: {location.latitude.toFixed(6)}
              </p>
              <p>
                Longitude: {location.longitude.toFixed(6)}
              </p>
              <p>
                Accuracy: {Math.round(location.accuracy)} metres
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Adding Event..." : "Add Chain Event"}
          </button>

          {message && (
            <p className={`message ${messageType}`}>
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default AddChainEvent;