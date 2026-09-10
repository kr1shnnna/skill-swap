import { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaCheck,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import api from "../../services/api";
import "./SwapRequests.css";

const SwapRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const [receivedResponse, sentResponse] = await Promise.all([
        api.get("/swaps/received"),
        api.get("/swaps/sent"),
      ]);

      setReceivedRequests(receivedResponse.data.swaps || []);
      setSentRequests(sentResponse.data.swaps || []);
    } catch (error) {
      console.error("Fetch swap requests error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load swap requests."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (swapId) => {
    try {
      setActionLoading(swapId);
      setError("");

      await api.patch(`/swaps/${swapId}/accept`);

      await fetchRequests();
    } catch (error) {
      console.error("Accept swap request error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to accept swap request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (swapId) => {
    try {
      setActionLoading(swapId);
      setError("");

      await api.patch(`/swaps/${swapId}/reject`);

      await fetchRequests();
    } catch (error) {
      console.error("Reject swap request error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to reject swap request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="swap-requests-page">
        <div className="swap-requests-loading">
          Loading swap requests...
        </div>
      </main>
    );
  }

  return (
    <main className="swap-requests-page">
      <div className="swap-requests-container">

        {/* Header */}
        <section className="swap-requests-header">
          <p className="swap-requests-tag">
            CONNECT • EXCHANGE • GROW
          </p>

          <h1>
            Swap <span>Requests</span>
          </h1>

          <p>
            Manage your incoming and outgoing skill exchange
            requests.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="swap-error">
            {error}
          </div>
        )}

        {/* Received Requests */}
        <section className="requests-section">
          <div className="requests-section-header">
            <div>
              <h2>Incoming Requests</h2>
              <p>
                Students who want to exchange skills with you.
              </p>
            </div>

            <span className="request-count">
              {receivedRequests.length}
            </span>
          </div>

          {receivedRequests.length === 0 ? (
            <div className="empty-requests">
              <FaUserCircle />

              <h3>No incoming requests</h3>

              <p>
                When another student sends you a swap request,
                it will appear here.
              </p>
            </div>
          ) : (
            <div className="requests-list">
              {receivedRequests.map((swap) => (
                <div className="request-card" key={swap._id}>
                  <div className="request-user">
                    <FaUserCircle className="request-user-icon" />

                    <div>
                      <h3>{swap.sender?.name}</h3>
                      <p>Wants to exchange skills with you</p>
                    </div>
                  </div>

                  <div className="request-actions">
                    {swap.status === "pending" ? (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() =>
                            handleAccept(swap._id)
                          }
                          disabled={actionLoading === swap._id}
                        >
                          <FaCheck />

                          {actionLoading === swap._id
                            ? "Processing..."
                            : "Accept"}
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() =>
                            handleReject(swap._id)
                          }
                          disabled={actionLoading === swap._id}
                        >
                          <FaTimes />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`request-status ${swap.status}`}
                      >
                        {swap.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sent Requests */}
        <section className="requests-section">
          <div className="requests-section-header">
            <div>
              <h2>Sent Requests</h2>
              <p>
                Track the skill exchange requests you've sent.
              </p>
            </div>

            <span className="request-count">
              {sentRequests.length}
            </span>
          </div>

          {sentRequests.length === 0 ? (
            <div className="empty-requests">
              <FaPaperPlane />

              <h3>No sent requests</h3>

              <p>
                Find a student with matching skills and send
                them a swap request.
              </p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map((swap) => (
                <div className="request-card" key={swap._id}>
                  <div className="request-user">
                    <FaUserCircle className="request-user-icon" />

                    <div>
                      <h3>{swap.receiver?.name}</h3>
                      <p>Swap request sent</p>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`request-status ${swap.status}`}
                    >
                      {swap.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default SwapRequests;