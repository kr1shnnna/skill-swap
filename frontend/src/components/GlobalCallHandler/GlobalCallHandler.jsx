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
  } = useContext(AuthContext);

  const [caller, setCaller] = useState(null);
  const [activeCall, setActiveCall] =
    useState(null);

  /*
   * ==========================================
   * LOAD CALLER INFORMATION
   * ==========================================
   *
   * For now we use the caller ID directly.
   * We can improve this later to show the
   * caller's actual name.
   */

  useEffect(() => {
    if (!incomingCall) {
      setCaller(null);
      return;
    }

    setCaller({
      _id: incomingCall.callerId,
      id: incomingCall.callerId,
      name: "SkillSwap Student",
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
     * Open Jitsi immediately.
     *
     * This works regardless of which page
     * the user is currently viewing.
     */

    setActiveCall({
      roomName,
      callType,
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

    rejectCall(
      incomingCall.callerId
    );

    setIncomingCall(null);
    setCaller(null);
  };

  /*
   * ==========================================
   * CLOSE JITSI
   * ==========================================
   */

  const handleCloseCall = () => {
    setActiveCall(null);
  };

  return (
    <>
      {incomingCall && caller && (
        <IncomingCall
          caller={caller}
          callType={
            incomingCall.callType
          }
          onAccept={
            handleAcceptCall
          }
          onReject={
            handleRejectCall
          }
        />
      )}

      {activeCall && (
        <JitsiCall
          roomName={
            activeCall.roomName
          }
          callType={
            activeCall.callType
          }
          onClose={
            handleCloseCall
          }
        />
      )}
    </>
  );
};

export default GlobalCallHandler;
