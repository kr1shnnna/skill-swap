import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

const JitsiCall = ({
  roomName,
  displayName,
  onClose,
}) => {
  if (!roomName) {
    return null;
  }

  return (
    <div className="jitsi-call-container">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableModeratorIndicator: true,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "hangup",
            "chat",
            "fullscreen",
          ],
        }}
        userInfo={{
          displayName: displayName || "SkillSwap Student",
        }}
        onReadyToClose={onClose}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
      />
    </div>
  );
};

export default JitsiCall;

