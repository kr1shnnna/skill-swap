
import { useEffect, useState } from "react"; 

import {
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaUserCircle

} from "react-icons/fa";

import api from "../../services/api";



import "./Sessions.css";

const Sessions = () => {

    const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  return (
    <main className="sessions-page">
      <div className="sessions-container">

        {/* PAGE HEADER */}

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

        {/* SESSION SECTIONS */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Upcoming Sessions</h2>
              <p>Your scheduled learning sessions.</p>
            </div>
          </div>

          {/* EMPTY STATE FOR NOW */}

          <div className="sessions-empty-state">
            <FaCalendarAlt />

            <h3>No upcoming sessions</h3>

            <p>
              Schedule a session with one of your connected
              skill partners to see it here.
            </p>
          </div>
        </section>

        {/* PENDING REQUESTS */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Pending Requests</h2>
              <p>Session requests waiting for a response.</p>
            </div>
          </div>

          <div className="sessions-empty-state compact">
            <FaClock />

            <h3>No pending requests</h3>

            <p>
              New session requests will appear here.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
};

export default Sessions;

