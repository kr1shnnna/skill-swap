import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";

import IncomingCall from "../../features/calls/components/IncomingCall";

import JitsiCall from "../../features/calls/components/JitsiCall";

import {
  FaPhone,
  FaVideo,
  FaPhoneSlash,
} from "react-icons/fa";

const GlobalCallHandler = () => {
  const {
    // Incoming call
    incomingCall,
    setIncomingCall,
    acceptCall,
    rejectCall,

    // Outgoing call
    outgoingCall,
    cancelCall,

    // Active call
    endCall,

    // Remote call ended
    callEnded,
    setCallEnded,
  } = useContext(AuthContext);

  // ------------------------------------------
  // INCOMING CALLER
  // ------------------------------------------

  const [caller, setCaller] = useState(null);

  // ------------------------------------------
  // GLOBAL ACTIVE CALL
  // ------------------------------------------

  const [activeCall, setActiveCall] = useState(null);

  // ------------------------------------------
  // PREPARE INCOMING CALLER
  // ------------------------------------------

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

  // ------------------------------------------
  // ACCEPT INCOMING CALL
  // ------------------------------------------

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
      roomName,
    );

    if (!accepted) {
      return;
    }

    setActiveCall({
      roomName,
      callType,
      remoteUserId: callerId,
      partnerName:
        callerName ||
        "SkillSwap Student",
    });

    setIncomingCall(null);
  };

  // ------------------------------------------
  // REJECT INCOMING CALL
  // ------------------------------------------

  const handleRejectCall = () => {
    if (!incomingCall) {
      return;
    }

    rejectCall(
      incomingCall.callerId,
    );

    setIncomingCall(null);
    setCaller(null);
  };

  // ------------------------------------------
  // CANCEL OUTGOING CALL
  // ------------------------------------------

  const handleCancelOutgoingCall = () => {
    if (!outgoingCall) {
      return;
    }

    cancelCall(
      outgoingCall.receiverId,
    );
  };

  // ------------------------------------------
  // END ACTIVE CALL
  // ------------------------------------------

  const handleEndCall = () => {
    if (!activeCall) {
      return;
    }

    if (activeCall.remoteUserId) {
      endCall(
        activeCall.remoteUserId,
      );
    }

    setActiveCall(null);
  };

  // ------------------------------------------
  // OTHER USER ENDED CALL
  // ------------------------------------------

  useEffect(() => {
    if (!callEnded) {
      return;
    }

    setActiveCall(null);

    setCallEnded(false);
  }, [
    callEnded,
    setCallEnded,
  ]);

  return (
    <>
      {/* ===================================== */}
      {/* OUTGOING CALL / RINGING */}
      {/* ===================================== */}

      {outgoingCall && (
        <div className="outgoing-call-overlay">
          <div className="outgoing-call-card">

            <div className="outgoing-call-avatar">
              {outgoingCall.callType ===
              "video" ? (
                <FaVideo />
              ) : (
                <FaPhone />
              )}
            </div>

            <p className="outgoing-call-label">
              {outgoingCall.callType ===
              "video"
                ? "VIDEO CALL"
                : "AUDIO CALL"}
            </p>

            <h2>
              {outgoingCall.receiverName ||
                "SkillSwap Student"}
            </h2>

            <p className="outgoing-call-message">
              Calling...
            </p>

            <div className="outgoing-call-ringing">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <button
              type="button"
              className="outgoing-call-cancel"
              onClick={
                handleCancelOutgoingCall
              }
            >
              <FaPhoneSlash />

              <span>
                Cancel
              </span>
            </button>

          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* INCOMING CALL */}
      {/* ===================================== */}

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

      {/* ===================================== */}
      {/* ACTIVE CALL */}
      {/* ===================================== */}

      {activeCall && (
        <JitsiCall
          roomName={
            activeCall.roomName
          }
          callType={
            activeCall.callType
          }
          partnerName={
            activeCall.partnerName
          }
          onClose={
            handleEndCall
          }
          onLocalEnd={
            handleEndCall
          }
        />
      )}
    </>
  );
};

export default GlobalCallHandler;
