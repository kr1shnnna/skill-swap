import { useContext, useEffect, useState } from "react";

import { io } from "socket.io-client";

import { FaCalendarAlt, FaClock } from "react-icons/fa";

import api from "../../services/api";

import { AuthContext } from "../../context/AuthContext";

import SessionCard from "./components/SessionCard";

import JitsiCall from "../../features/calls/components/JitsiCall";

import "./Sessions.css";

const Sessions = () => {
  const { user } = useContext(AuthContext);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Currently opened scheduled meeting
  const [activeSession, setActiveSession] = useState(null);

  const getUserId = (userObject) => {
    if (!userObject) {
      return null;
    }

    if (typeof userObject === "string") {
      return userObject;
    }

    return userObject._id?.toString() || userObject.id?.toString() || null;
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchSessions();
  }, [user]);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("sessionCreated", (data) => {
      const newSession = data.session;

      if (!newSession) {
        return;
      }

      setSessions((currentSessions) => {
        const alreadyExists = currentSessions.some(
          (session) => session._id === newSession._id,
        );

        if (alreadyExists) {
          return currentSessions;
        }

        return [...currentSessions, newSession];
      });
    });

    socket.on("sessionUpdated", (updatedSession) => {
      if (!updatedSession) {
        return;
      }

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session._id === updatedSession.sessionId
            ? {
                ...session,
                status: updatedSession.status,
                statusUpdatedBy: updatedSession.statusUpdatedBy,
              }
            : session,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sessions");

      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Fetch sessions error:", error);

      setError(error.response?.data?.message || "Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * JOIN SCHEDULED MEETING
   * ==========================================
   */

  const handleJoinMeeting = (session) => {
    if (!session?._id) {
      console.error("Unable to join meeting: session ID is missing.");

      return;
    }

    if (session.status !== "accepted") {
      return;
    }

    setActiveSession(session);
  };

  /*
   * ==========================================
   * CLOSE SCHEDULED MEETING
   * ==========================================
   */

  const handleCloseMeeting = () => {
    setActiveSession(null);
  };

  const currentUserId = getUserId(user);

  const upcomingSessions = sessions.filter(
    (session) => session.status === "accepted",
  );

  const pendingSessions = sessions.filter(
    (session) => session.status === "pending",
  );

  const sessionHistory = sessions.filter(
    (session) =>
      session.status === "completed" ||
      session.status === "rejected" ||
      session.status === "cancelled",
  );

  /*
   * Deterministic room name.
   *
   * Both students use the same session ID,
   * therefore both enter the same JaaS room.
   */
  const meetingRoomName = activeSession
    ? `SkillSwap-Session-${activeSession._id}`
    : null;

  return (
    <main className="sessions-page">
      <div className="sessions-container">
        {/* ==========================================
            PAGE HEADER
            ========================================== */}

        <div className="sessions-page-header">
          <div>
            <p className="sessions-page-tag">PLAN • LEARN • GROW</p>

            <h1>
              My <span>Sessions</span>
            </h1>

            <p>Manage your upcoming skill exchange sessions.</p>
          </div>

          <FaCalendarAlt className="sessions-header-icon" />
        </div>

        {/* ==========================================
            UPCOMING SESSIONS
            ========================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Upcoming Sessions</h2>

              <p>Your scheduled learning sessions.</p>
            </div>
          </div>

          {loading ? (
            <div className="sessions-empty-state">
              <FaClock />

              <h3>Loading sessions...</h3>

              <p>Fetching your scheduled sessions.</p>
            </div>
          ) : error ? (
            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>Unable to load sessions</h3>

              <p>{error}</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>No upcoming sessions</h3>

              <p>Accepted sessions will appear here.</p>
            </div>
          ) : (
            <div className="sessions-list">
              {upcomingSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  currentUserId={currentUserId}
                  onJoinMeeting={handleJoinMeeting}
                />
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            PENDING REQUESTS
            ========================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Pending Requests</h2>

              <p>Session requests waiting for a response.</p>
            </div>
          </div>

          {pendingSessions.length === 0 ? (
            <div className="sessions-empty-state compact">
              <FaClock />

              <h3>No pending requests</h3>

              <p>New session requests will appear here.</p>
            </div>
          ) : (
            <div className="sessions-list">
              {pendingSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            SESSION HISTORY
            ========================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Session History</h2>

              <p>Completed, rejected, and cancelled sessions.</p>
            </div>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="sessions-empty-state compact">
              <FaCalendarAlt />

              <h3>No session history</h3>

              <p>Completed or cancelled sessions will appear here.</p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessionHistory.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          JITSI / JAAS SCHEDULED MEETING
          ========================================== */}

      {activeSession && meetingRoomName && (
        <JitsiCall
          roomName={meetingRoomName}
          callType="video"
          sessionTopic={activeSession.topic}
          partnerName={
            activeSession.requester?._id?.toString() ===
            currentUserId?.toString()
              ? activeSession.partner?.name
              : activeSession.requester?.name
          }
          sessionDate={activeSession.date}
          sessionTime={activeSession.time}
          onClose={handleCloseMeeting}
        />
      )}
    </main>
  );
};

export default Sessions;
