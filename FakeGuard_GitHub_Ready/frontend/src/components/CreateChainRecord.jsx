import { useState } from "react";
import api from "../api/client";

const initialForm = {
  productName: "",
  brandName: "",
  category: "",
  barcode: "",
  batchNumber: "",
  manufacturerName: "",
  manufactureDate: "",
  expiryDate: "",
  locationName: "",
  note: "",
};

function CreateChainRecord() {
  const [formData, setFormData] = useState(initialForm);
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [createdTraceId, setCreatedTraceId] = useState("");
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
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationMessage("Capturing location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationMessage("Location captured successfully.");
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
    setCreatedTraceId("");

    const payload = {
      ...formData,
      initialStage: "Manufactured",
      actorType: "Manufacturer",
      actorName: formData.manufacturerName,
      currentOwner: formData.manufacturerName,
      currentLocation: formData.locationName,
    };

    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.accuracy = location.accuracy;
    }

    try {
      const response = await api.post("/supply-chain", payload);

      setMessageType("success");
      setMessage(
        response.data?.message ||
          "Supply chain record created successfully."
      );

      setCreatedTraceId(response.data?.trace?.traceId || "");
      setFormData(initialForm);
      setLocation(null);
      setLocationMessage("");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create supply chain record."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-chain-page">
      <section className="create-chain-section">
        <h2>Create Supply Chain Record</h2>

        <p>
          Enter the product manufacturing information to begin its trace
          history.
        </p>

        <form onSubmit={handleSubmit}>
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
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Barcode
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Batch Number
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Manufacturer Name
            <input
              type="text"
              name="manufacturerName"
              value={formData.manufacturerName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Manufacture Date
            <input
              type="date"
              name="manufactureDate"
              value={formData.manufactureDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Expiry Date
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Manufacturing Location
            <input
              type="text"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="For example: Dhaka Factory"
              required
            />
          </label>

          <label>
            Note
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Optional manufacturing note"
            />
          </label>

          <button type="button" onClick={captureLocation}>
            Use Current Location
          </button>

          {locationMessage && <p>{locationMessage}</p>}

          {location && (
            <div>
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
              <p>Accuracy: {Math.round(location.accuracy)} metres</p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Chain Record"}
          </button>

          {message && (
            <p className={`message ${messageType}`}>{message}</p>
          )}

          {createdTraceId && (
            <p>
              <strong>Generated Trace ID:</strong> {createdTraceId}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default CreateChainRecord;