import { useState } from "react";
import api from "../api/client";
import "./ProjectPages.css";
function ChainTrace() {
  const [barcode, setBarcode] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [trace, setTrace] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setTrace(null);

    try {
      const response = await api.get("/supply-chain/verify", {
        params: {
          barcode,
          batchNumber,
        },
      });

      setTrace(response.data.trace);
      setMessage(response.data.message || "Supply chain record found.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to find the supply chain record."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="chain-trace-page">
      <section className="chain-trace-section">
        <h2>Product Chain Trace</h2>

        <p>
          Enter the product barcode and batch number to view its supply chain
          history.
        </p>

        <form onSubmit={handleSearch}>
          <label>
            Barcode
            <input
              type="text"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              required
            />
          </label>

          <label>
            Batch Number
            <input
              type="text"
              value={batchNumber}
              onChange={(event) => setBatchNumber(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Trace Product"}
          </button>
        </form>

        {message && <p className="trace-message">{message}</p>}

        {trace && (
          <section className="trace-result">
            <h3>{trace.productName}</h3>

            <p>
              <strong>Brand:</strong> {trace.brandName}
            </p>

            <p>
              <strong>Trace ID:</strong> {trace.traceId}
            </p>

            <p>
              <strong>Manufacturer:</strong> {trace.manufacturerName}
            </p>

            <p>
              <strong>Current Stage:</strong> {trace.currentStage}
            </p>

            <p>
              <strong>Current Location:</strong>{" "}
              {trace.currentLocation || "Not available"}
            </p>

            <p>
              <strong>Authenticity Status:</strong>{" "}
              {trace.authenticityStatus}
            </p>

            <h3>Supply Chain History</h3>

            {trace.traceEvents?.length > 0 ? (
              <div className="trace-events">
                {trace.traceEvents.map((item, index) => (
                  <article className="trace-event" key={item._id || index}>
                    <h4>
                      {index + 1}. {item.stage}
                    </h4>

                    <p>
                      <strong>Actor:</strong> {item.actorName}
                    </p>

                    <p>
                      <strong>Actor Type:</strong> {item.actorType}
                    </p>

                    <p>
                      <strong>Location:</strong> {item.locationName}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(item.eventTime).toLocaleString()}
                    </p>

                    <p>
                      <strong>Verification:</strong>{" "}
                      {item.verificationStatus}
                    </p>

                    {item.note && (
                      <p>
                        <strong>Note:</strong> {item.note}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p>No supply chain events are available.</p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default ChainTrace;