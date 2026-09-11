import { useContext, useEffect, useState } from "react";

import {
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

import SessionCard from "./components/SessionCard";

import "./Sessions.css";

const Sessions = () => {
  const { user } = useContext(AuthContext);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ------------------------------------------
   * GET USER ID
   * ------------------------------------------
   */

  const getUserId = (userObject) => {
    if (!userObject) {
      return null;
    }

    if (typeof userObject === "string") {
      return userObject;
    }

    return (
      userObject._id?.toString() ||
      userObject.id?.toString() ||
      null
    );
  };

  /*
   * ------------------------------------------
   * FETCH SESSIONS
   * ------------------------------------------
   */

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sessions");

      setSessions(
        response.data.sessions || []
      );
    } catch (error) {
      console.error(
        "Fetch sessions error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load sessions."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------
   * FILTER SESSIONS
   * ------------------------------------------
   */

  const currentUserId = getUserId(user);

  const upcomingSessions = sessions.filter(
    (session) =>
      session.status === "accepted" ||
      session.status === "completed"
  );

  const pendingSessions = sessions.filter(
    (session) =>
      session.status === "pending"
  );

  /*
   * ------------------------------------------
   * UI
   * ------------------------------------------
   */

  return (
    <main className="sessions-page">
      <div className="sessions-container">

        {/* ================================== */}
        {/* PAGE HEADER */}
        {/* ================================== */}

        <div className="sessions-page-header">
          <div>
            <p className="sessions-page-tag">
              PLAN • LEARN • GROW
            </p>

            <h1>
              My <span>Sessions</span>
            </h1>

            <p>
              Manage your upcoming skill exchange sessions.
            </p>
          </div>

          <FaCalendarAlt className="sessions-header-icon" />
        </div>

        {/* ================================== */}
        {/* UPCOMING SESSIONS */}
        {/* ================================== */}

        <section className="sessions-section">

          <div className="sessions-section-header">
            <div>
              <h2>
                Upcoming Sessions
              </h2>

              <p>
                Your scheduled learning sessions.
              </p>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="sessions-empty-state">
              <FaClock />

              <h3>
                Loading sessions...
              </h3>

              <p>
                Fetching your scheduled sessions.
              </p>
            </div>

          ) : error ? (

            /* ERROR */

            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>
                Unable to load sessions
              </h3>

              <p>
                {error}
              </p>
            </div>

          ) : upcomingSessions.length === 0 ? (

            /* EMPTY */

            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>
                No upcoming sessions
              </h3>

              <p>
                Accepted sessions will appear here.
              </p>
            </div>

          ) : (

            /* SESSION CARDS */

            <div className="sessions-list">
              {upcomingSessions.map(
                (session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    currentUserId={currentUserId}
                  />
                )
              )}
            </div>
          )}

        </section>

        {/* ================================== */}
        {/* PENDING REQUESTS */}
        {/* ================================== */}

        <section className="sessions-section">

          <div className="sessions-section-header">
            <div>
              <h2>
                Pending Requests
              </h2>

              <p>
                Session requests waiting for a response.
              </p>
            </div>
          </div>

          {pendingSessions.length === 0 ? (

            /* NO PENDING REQUESTS */

            <div className="sessions-empty-state compact">
              <FaClock />

              <h3>
                No pending requests
              </h3>

              <p>
                New session requests will appear here.
              </p>
            </div>

          ) : (

            /* PENDING SESSION CARDS */

            <div className="sessions-list">
              {pendingSessions.map(
                (session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    currentUserId={currentUserId}
                  />
                )
              )}
            </div>
          )}

        </section>

      </div>
    </main>
  );
};

export default Sessions;

