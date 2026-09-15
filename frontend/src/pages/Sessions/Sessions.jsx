import { useContext, useEffect, useState } from "react";

import { io } from "socket.io-client";

import { FaCalendarAlt, FaClock } from "react-icons/fa";

import api from "../../services/api";

import { AuthContext } from "../../context/AuthContext";

import SessionCard from "./components/SessionCard";

import JitsiCall from "../../features/calls/components/JitsiCall";

import "./Sessions.css";

const SESSION_WINDOW_MINUTES = 60;

const Sessions = () => {
  const { user } = useContext(AuthContext);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeSession, setActiveSession] =
    useState(null);

  /*
   * ==========================================
   * GET USER ID
   * ==========================================
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
   * ==========================================
   * GET SESSION START TIME
   * ==========================================
   */

  const getSessionStartTime = (session) => {
    if (!session?.date || !session?.time) {
      return null;
    }

    const sessionDate = new Date(
      session.date
    );

    if (
      Number.isNaN(
        sessionDate.getTime()
      )
    ) {
      return null;
    }

    const [hours, minutes] =
      session.time.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return null;
    }

    sessionDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    return sessionDate;
  };

  /*
   * ==========================================
   * CHECK IF SESSION WINDOW HAS ENDED
   * ==========================================
   */

  const isSessionWindowEnded = (
    session,
    currentTime
  ) => {
    if (session.status !== "accepted") {
      return false;
    }

    const sessionStartTime =
      getSessionStartTime(session);

    if (!sessionStartTime) {
      return false;
    }

    const sessionEndTime =
      new Date(
        sessionStartTime.getTime() +
          SESSION_WINDOW_MINUTES *
            60 *
            1000
      );

    return currentTime > sessionEndTime;
  };

  /*
   * ==========================================
   * FETCH SESSIONS
   * ==========================================
   */

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchSessions();
  }, [user]);

  /*
   * ==========================================
   * LIVE CLOCK
   *
   * Used to automatically move expired
   * sessions into history.
   * ==========================================
   */

  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
   * ==========================================
   * SOCKET CONNECTION
   * ==========================================
   */

  useEffect(() => {
    const socket = io(
      "http://localhost:5000"
    );

    socket.on(
      "sessionCreated",
      (data) => {
        const newSession =
          data.session;

        if (!newSession) {
          return;
        }

        setSessions(
          (currentSessions) => {
            const alreadyExists =
              currentSessions.some(
                (session) =>
                  session._id ===
                  newSession._id
              );

            if (alreadyExists) {
              return currentSessions;
            }

            return [
              ...currentSessions,
              newSession,
            ];
          }
        );
      }
    );

    socket.on(
      "sessionUpdated",
      (updatedSession) => {
        if (!updatedSession) {
          return;
        }

        setSessions(
          (currentSessions) =>
            currentSessions.map(
              (session) =>
                session._id ===
                updatedSession.sessionId
                  ? {
                      ...session,
                      status:
                        updatedSession.status,
                      statusUpdatedBy:
                        updatedSession.statusUpdatedBy,
                    }
                  : session
            )
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
   * ==========================================
   * FETCH SESSIONS FUNCTION
   * ==========================================
   */

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/sessions");

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
   * ==========================================
   * JOIN MEETING
   * ==========================================
   */

  const handleJoinMeeting = (session) => {
    if (!session?._id) {
      return;
    }

    if (session.status !== "accepted") {
      return;
    }

    /*
     * Don't allow joining an expired
     * meeting window.
     */

    if (
      isSessionWindowEnded(
        session,
        new Date()
      )
    ) {
      return;
    }

    setActiveSession(session);
  };

  /*
   * ==========================================
   * CLOSE MEETING
   * ==========================================
   */

  const handleCloseMeeting = () => {
    setActiveSession(null);
  };

  /*
   * ==========================================
   * CURRENT USER
   * ==========================================
   */

  const currentUserId =
    getUserId(user);

  /*
   * ==========================================
   * SESSION GROUPS
   * ==========================================
   */

  const upcomingSessions =
    sessions.filter((session) => {
      /*
       * Accepted sessions stay in
       * Upcoming only while their
       * 60-minute meeting window
       * has not ended.
       */

      if (session.status === "accepted") {
        return !isSessionWindowEnded(
          session,
          currentTime
        );
      }

      return false;
    });

  const pendingSessions =
    sessions.filter(
      (session) =>
        session.status === "pending"
    );

 const sessionHistory =
  sessions
    .filter((session) => {
      if (
        session.status === "completed" ||
        session.status === "rejected" ||
        session.status === "cancelled"
      ) {
        return true;
      }

      if (session.status === "accepted") {
        return isSessionWindowEnded(
          session,
          currentTime
        );
      }

      return false;
    })
    .sort((a, b) => {
      const dateA = getSessionStartTime(a);
      const dateB = getSessionStartTime(b);

      if (!dateA && !dateB) {
        return 0;
      }

      if (!dateA) {
        return 1;
      }

      if (!dateB) {
        return -1;
      }

      return dateB.getTime() - dateA.getTime();
    });
    
  /*
   * ==========================================
   * DETERMINISTIC MEETING ROOM
   * ==========================================
   */

  const meetingRoomName =
    activeSession
      ? `SkillSwap-Session-${activeSession._id}`
      : null;

  /*
   * ==========================================
   * MEETING PARTNER
   * ==========================================
   */

  const meetingPartnerName =
    activeSession
      ? activeSession.requester?._id?.toString() ===
        currentUserId?.toString()
        ? activeSession.partner?.name
        : activeSession.requester?.name
      : "";

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <main className="sessions-page">
      <div className="sessions-container">

        {/* ======================================
            PAGE HEADER
            ====================================== */}

        <div className="sessions-page-header">
          <div>
            <p className="sessions-page-tag">
              PLAN • LEARN • GROW
            </p>

            <h1>
              My <span>Sessions</span>
            </h1>

            <p>
              Manage your upcoming skill
              exchange sessions.
            </p>
          </div>

          <FaCalendarAlt className="sessions-header-icon" />
        </div>

        {/* ======================================
            UPCOMING SESSIONS
            ====================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>
                Upcoming Sessions
              </h2>

              <p>
                Your scheduled learning
                sessions.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="sessions-empty-state">
              <FaClock />

              <h3>
                Loading sessions...
              </h3>

              <p>
                Fetching your scheduled
                sessions.
              </p>
            </div>
          ) : error ? (
            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>
                Unable to load sessions
              </h3>

              <p>{error}</p>
            </div>
          ) : upcomingSessions.length ===
            0 ? (
            <div className="sessions-empty-state">
              <FaCalendarAlt />

              <h3>
                No upcoming sessions
              </h3>

              <p>
                Accepted sessions will
                appear here.
              </p>
            </div>
          ) : (
            <div className="sessions-list">
              {upcomingSessions.map(
                (session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    currentUserId={
                      currentUserId
                    }
                    onJoinMeeting={
                      handleJoinMeeting
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* ======================================
            PENDING REQUESTS
            ====================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>
                Pending Requests
              </h2>

              <p>
                Session requests waiting
                for a response.
              </p>
            </div>
          </div>

          {pendingSessions.length ===
          0 ? (
            <div className="sessions-empty-state compact">
              <FaClock />

              <h3>
                No pending requests
              </h3>

              <p>
                New session requests will
                appear here.
              </p>
            </div>
          ) : (
            <div className="sessions-list">
              {pendingSessions.map(
                (session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    currentUserId={
                      currentUserId
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* ======================================
            SESSION HISTORY
            ====================================== */}

        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>
                Session History
              </h2>

              <p>
                Completed, expired,
                rejected, and cancelled
                sessions.
              </p>
            </div>
          </div>

          {sessionHistory.length ===
          0 ? (
            <div className="sessions-empty-state compact">
              <FaCalendarAlt />

              <h3>
                No session history
              </h3>

              <p>
                Completed or cancelled
                sessions will appear
                here.
              </p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessionHistory.map(
                (session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    currentUserId={
                      currentUserId
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* ========================================
          SCHEDULED JITSI MEETING
          ======================================== */}

      {activeSession &&
        meetingRoomName && (
          <JitsiCall
            roomName={meetingRoomName}
            callType="video"
            sessionTopic={
              activeSession.topic
            }
            partnerName={
              meetingPartnerName
            }
            sessionDate={
              activeSession.date
            }
            sessionTime={
              activeSession.time
            }
            onClose={
              handleCloseMeeting
            }
          />
        )}
    </main>
  );
};

export default Sessions;
