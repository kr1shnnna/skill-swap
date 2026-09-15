import { useEffect, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

import api from "../../../services/api";

const JAAS_APP_ID =
  "vpaas-magic-cookie-4dea434a34134108a0d2bbdf57290a59";

const JitsiCall = ({
  roomName,
  callType = "video",
  onClose,
}) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="jaas-call-overlay">
        <div className="jaas-call-loading">
          <p>Starting your meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jaas-call-overlay">
        <div className="jaas-call-error">
          <h3>Unable to start meeting</h3>

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

  if (!token) {
    return null;
  }

  const isAudioCall =
    callType === "audio";

  return (
    <div className="jaas-call-overlay">
      <div className="jaas-call-container">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`${JAAS_APP_ID}/${roomName}`}
          jwt={token}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: isAudioCall,
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
            displayName: "SkillSwap Student",
          }}
          onReadyToClose={() => {
            onClose();
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
