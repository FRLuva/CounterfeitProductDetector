import { useMemo, useState } from "react";
import api from "../api/client";
import "./ProjectPages.css";

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (first, second) => {
  const earthRadiusKm = 6371;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getLatestRecordedLocation = (trace) => {
  const events = Array.isArray(trace?.traceEvents) ? [...trace.traceEvents] : [];

  return events
    .reverse()
    .map((event) => event?.geoLocation)
    .find(
      (geoLocation) =>
        Number.isFinite(geoLocation?.latitude) &&
        Number.isFinite(geoLocation?.longitude)
    );
};

function GeoVerification() {
  const [barcode, setBarcode] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [trace, setTrace] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const latestRecordedLocation = useMemo(
    () => getLatestRecordedLocation(trace),
    [trace]
  );

  const distanceKm = useMemo(() => {
    if (!location || !latestRecordedLocation) {
      return null;
    }

    return calculateDistanceKm(location, latestRecordedLocation);
  }, [location, latestRecordedLocation]);

  const captureCurrentLocation = () => {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage("This browser does not support geolocation.");
      return;
    }

    setLocationMessage("Capturing your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationMessage("Current location captured successfully.");
      },
      (error) => {
        setLocation(null);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access and try again."
            : "Current location could not be captured. Please try again."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleVerification = async (event) => {
    event.preventDefault();

    if (!location) {
      setMessageType("error");
      setMessage("Capture your current location before starting verification.");
      return;
    }

    setLoading(true);
    setTrace(null);
    setMessage("");
    setMessageType("");

    try {
      const response = await api.get("/supply-chain/verify", {
        params: {
          barcode: barcode.trim(),
          batchNumber: batchNumber.trim(),
        },
      });

      setTrace(response.data?.trace || null);
      setMessageType("success");
      setMessage(response.data?.message || "Product record found.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          "No matching verified supply-chain record was found."
      );
    } finally {
      setLoading(false);
    }
  };

  const locationAssessment = (() => {
    if (!trace) {
      return null;
    }

    if (distanceKm === null) {
      return {
        label: "Recorded location unavailable",
        className: "neutral",
        text: "The product record exists, but its latest chain event has no GPS coordinates to compare.",
      };
    }

    if (distanceKm <= 5) {
      return {
        label: "Location consistent",
        className: "success",
        text: "Your current location is close to the latest recorded supply-chain location.",
      };
    }

    return {
      label: "Location mismatch warning",
      className: "warning",
      text: "Your current location is far from the latest recorded supply-chain location. Review the trace before accepting the product.",
    };
  })();

  return (
    <main className="geo-verification-page">
      <section className="geo-verification-section">
        <header className="page-heading">
          <p className="eyebrow">Location-aware product check</p>
          <h2>Geo-location Based Verification</h2>
          <p>
            Capture your location and compare it with the latest GPS-enabled
            event in the product&apos;s supply-chain record.
          </p>
        </header>

        <div className="geo-workflow">
          <section className="geo-card">
            <span className="step-number">1</span>
            <h3>Capture Current Location</h3>
            <p>Your browser will ask for location permission.</p>

            <button type="button" onClick={captureCurrentLocation}>
              Use My Current Location
            </button>

            {locationMessage && <p className="location-message">{locationMessage}</p>}

            {location && (
              <dl className="coordinate-grid">
                <div>
                  <dt>Latitude</dt>
                  <dd>{location.latitude.toFixed(6)}</dd>
                </div>
                <div>
                  <dt>Longitude</dt>
                  <dd>{location.longitude.toFixed(6)}</dd>
                </div>
                <div>
                  <dt>Accuracy</dt>
                  <dd>{Math.round(location.accuracy)} m</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="geo-card">
            <span className="step-number">2</span>
            <h3>Enter Product Details</h3>

            <form onSubmit={handleVerification}>
              <label>
                Barcode
                <input
                  type="text"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Enter product barcode"
                  required
                />
              </label>

              <label>
                Batch Number
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(event) => setBatchNumber(event.target.value)}
                  placeholder="Enter batch number"
                  required
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Product and Location"}
              </button>
            </form>
          </section>
        </div>

        {message && <p className={`message ${messageType}`}>{message}</p>}

        {trace && (
          <section className="geo-result">
            <div className="geo-result-header">
              <div>
                <p className="eyebrow">Verification result</p>
                <h3>{trace.productName}</h3>
                <p>{trace.brandName}</p>
              </div>
              <span className={`authenticity-badge ${String(trace.authenticityStatus || "pending").toLowerCase()}`}>
                {trace.authenticityStatus || "Pending"}
              </span>
            </div>

            <dl className="result-grid">
              <div>
                <dt>Trace ID</dt>
                <dd>{trace.traceId}</dd>
              </div>
              <div>
                <dt>Current Stage</dt>
                <dd>{trace.currentStage || "Not available"}</dd>
              </div>
              <div>
                <dt>Recorded Location</dt>
                <dd>{trace.currentLocation || "Not available"}</dd>
              </div>
              <div>
                <dt>Manufacturer</dt>
                <dd>{trace.manufacturerName || "Not available"}</dd>
              </div>
            </dl>

            {locationAssessment && (
              <div className={`location-assessment ${locationAssessment.className}`}>
                <strong>{locationAssessment.label}</strong>
                <p>{locationAssessment.text}</p>
                {distanceKm !== null && (
                  <p>
                    Approximate distance from latest recorded GPS point: {distanceKm.toFixed(2)} km
                  </p>
                )}
              </div>
            )}

            <p className="verification-note">
              This demonstration compares application records and device location. It is not a substitute for laboratory or regulatory authentication.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

export default GeoVerification;
