import { useEffect, useState } from "react";

import { JitsiMeeting } from "@jitsi/react-sdk";

import api from "../../../services/api";

const JAAS_APP_ID =
  "vpaas-magic-cookie-4dea434a34134108a0d2bbdf57290a59";

const JitsiCall = ({
  roomName,
  callType = "video",
  onClose,
  onLocalEnd,

  // Optional scheduled-session information
  sessionTopic = "",
  partnerName = "",
  sessionDate = "",
  sessionTime = "",
}) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ==========================================
   * FETCH JaaS TOKEN
   * ==========================================
   */

  useEffect(() => {
    let mounted = true;

    const fetchJaasToken = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.post(
          "/jaas/token",
          {
            roomName,
          }
        );

        if (!mounted) {
          return;
        }

        setToken(response.data.token);
      } catch (error) {
        console.error(
          "Failed to get JaaS token:",
          error
        );

        if (!mounted) {
          return;
        }

        setError(
          error.response?.data?.message ||
            "Unable to start the meeting."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (roomName) {
      fetchJaasToken();
    } else {
      setLoading(false);
      setError("Meeting room is missing.");
    }

    return () => {
      mounted = false;
    };
  }, [roomName]);

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="jaas-call-overlay">
        <div className="jaas-call-loading">
          <p>Starting your meeting...</p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * ERROR
   * ==========================================
   */

  if (error) {
    return (
      <div className="jaas-call-overlay">
        <div className="jaas-call-error">
          <h3>
            Unable to start meeting
          </h3>

          <p>{error}</p>

          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * NO TOKEN
   * ==========================================
   */

  if (!token) {
    return null;
  }

  const isAudioCall =
    callType === "audio";

  const isScheduledSession =
    Boolean(
      sessionTopic ||
        partnerName ||
        sessionDate ||
        sessionTime
    );

  /*
   * ==========================================
   * FORMAT SESSION DATE
   * ==========================================
   */

  const formattedSessionDate =
    sessionDate
      ? new Date(
          sessionDate
        ).toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  /*
   * ==========================================
   * JaaS MEETING
   * ==========================================
   */

  return (
    <div className="jaas-call-overlay">

      {/* ========================================
          OPTIONAL SESSION INFORMATION
          ======================================== */}

      {isScheduledSession && (
        <div className="scheduled-meeting-header">

          <div className="scheduled-meeting-info">

            <span className="scheduled-meeting-label">
              SKILLSWAP SESSION
            </span>

            {sessionTopic && (
              <h2>
                {sessionTopic}
              </h2>
            )}

            <div className="scheduled-meeting-details">

              {partnerName && (
                <span>
                  With{" "}
                  <strong>
                    {partnerName}
                  </strong>
                </span>
              )}

              {formattedSessionDate &&
                sessionTime && (
                  <span>
                    {formattedSessionDate}
                    {" • "}
                    {sessionTime}
                  </span>
                )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          JITSI CONTAINER
          ======================================== */}

      <div
        className={`jaas-call-container ${
          isScheduledSession
            ? "jaas-call-container-session"
            : ""
        }`}
      >

        <JitsiMeeting
          domain="8x8.vc"
          roomName={`${JAAS_APP_ID}/${roomName}`}
          jwt={token}

          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted:
              isAudioCall,
            disableAP: false,
            disableAPIPrewarm: true,
          }}

          interfaceConfigOverwrite={{
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "raisehand",
              "tileview",
              "hangup",
            ],
          }}

          userInfo={{
            displayName:
              "SkillSwap Student",
          }}

          onReadyToClose={() => {
            /*
             * =================================
             * LOCAL USER ENDED THE CALL
             * =================================
             */

            if (onLocalEnd) {
              onLocalEnd();
              return;
            }

            /*
             * Fallback
             */

            if (onClose) {
              onClose();
            }
          }}

          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
        />

      </div>
    </div>
  );
};

export default JitsiCall;
