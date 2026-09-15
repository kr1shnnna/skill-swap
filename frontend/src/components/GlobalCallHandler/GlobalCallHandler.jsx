import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";

import IncomingCall from "../../features/calls/components/IncomingCall";

import JitsiCall from "../../features/calls/components/JitsiCall";

const GlobalCallHandler = () => {
  const {
    incomingCall,
    setIncomingCall,
    acceptCall,
    rejectCall,
    endCall,
    callEnded,
    setCallEnded,
  } = useContext(AuthContext);

  const [caller, setCaller] = useState(null);

  const [activeCall, setActiveCall] = useState(null);

  /*
   * ==========================================
   * LOAD CALLER INFORMATION
   * ==========================================
   */

  useEffect(() => {
    if (!incomingCall) {
      setCaller(null);
      return;
    }

    setCaller({
      _id: incomingCall.callerId,
      id: incomingCall.callerId,

      name:
        incomingCall.callerName ||
        "SkillSwap Student",
    });
  }, [incomingCall]);

  /*
   * ==========================================
   * ACCEPT INCOMING CALL
   * ==========================================
   */

  const handleAcceptCall = () => {
    if (!incomingCall) {
      return;
    }

    const {
      callerId,
      callType,
      roomName,
      callerName,
    } = incomingCall;

    const accepted = acceptCall(
      callerId,
      callType,
      roomName
    );

    if (!accepted) {
      return;
    }

    /*
     * IMPORTANT:
     * Store remote user's ID so we can notify
     * them immediately when this user hangs up.
     */

    setActiveCall({
      roomName,
      callType,
      remoteUserId: callerId,
      partnerName: callerName || "SkillSwap Student",
    });

    setIncomingCall(null);
  };

  /*
   * ==========================================
   * REJECT INCOMING CALL
   * ==========================================
   */

  const handleRejectCall = () => {
    if (!incomingCall) {
      return;
    }

    rejectCall(incomingCall.callerId);

    setIncomingCall(null);
    setCaller(null);
  };

  /*
   * ==========================================
   * END ACTIVE CALL
   * ==========================================
   */

  const handleEndCall = () => {
    if (!activeCall) {
      return;
    }

    /*
     * Tell the other participant immediately.
     */

    if (activeCall.remoteUserId) {
      endCall(activeCall.remoteUserId);
    }

    /*
     * Close our Jitsi window.
     */

    setActiveCall(null);
  };

  /*
   * ==========================================
   * OTHER USER ENDED CALL
   * ==========================================
   */

  useEffect(() => {
    if (!callEnded) {
      return;
    }

    /*
     * Close Jitsi immediately when the remote
     * participant ends the call.
     */

    setActiveCall(null);

    /*
     * Reset the global flag.
     */

    setCallEnded(false);
  }, [callEnded, setCallEnded]);

  return (
    <>
      {/* =====================================
          INCOMING CALL
          ===================================== */}

      {incomingCall && caller && (
        <IncomingCall
          caller={caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* =====================================
          ACTIVE CALL
          ===================================== */}

      {activeCall && (
        <JitsiCall
          roomName={activeCall.roomName}
          callType={activeCall.callType}
          partnerName={activeCall.partnerName}
          onClose={handleEndCall}
          onLocalEnd={handleEndCall}
        />
      )}
    </>
  );
};

export default GlobalCallHandler;

