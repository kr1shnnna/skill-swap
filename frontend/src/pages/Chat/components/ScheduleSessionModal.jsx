import { useState } from "react";

import api from "../../../services/api";

const ScheduleSessionModal = ({
  selectedUser,
  onClose,
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!selectedUser) {
    return null;
  }

  const partnerId =
    selectedUser._id || selectedUser.id;

  // Get today's date in YYYY-MM-DD format.
  // Using local date parts avoids UTC timezone issues.
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const today = `${year}-${month}-${day}`;

  const handleDateChange = (event) => {
    const selectedDate = event.target.value;

    setDate(selectedDate);
    setError("");

    // If the user changes the date to today,
    // we'll validate the time during submission.
    //
    // If they change to another date, keeping the
    // selected time is fine because the full
    // date + time is validated before submission.
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!date || !time || !topic.trim()) {
      setError(
        "Please fill in the date, time, and topic."
      );
      return;
    }

    // Prevent selecting a date in the past.
    if (date < today) {
      setError(
        "Please choose a future date."
      );
      return;
    }

    // Combine the selected date and time.
    const selectedDateTime = new Date(
      `${date}T${time}`
    );

    // Make sure the selected date/time is valid.
    if (
      Number.isNaN(
        selectedDateTime.getTime()
      )
    ) {
      setError(
        "Please choose a valid date and time."
      );
      return;
    }

    // Prevent scheduling for a time that has
    // already passed today.
    if (selectedDateTime <= new Date()) {
      setError(
        "Please choose a future date and time."
      );
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/sessions", {
        partnerId,
        date,
        time,
        topic: topic.trim(),
        note: note.trim(),
      });

      setSuccess(
        "Session request sent successfully!"
      );

      /*
       * Close the modal shortly after
       * successful creation.
       */
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error(
        "Schedule session error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to schedule the session."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="schedule-modal-overlay"
      onClick={onClose}
    >
      <div
        className="schedule-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="schedule-modal-header">
          <div>
            <p className="schedule-modal-tag">
              SKILL EXCHANGE
            </p>

            <h2>
              Schedule a Session
            </h2>

            <p>
              Plan your next learning session
              with{" "}
              <strong>
                {selectedUser.name}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="schedule-modal-close"
            onClick={onClose}
            aria-label="Close scheduling window"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="schedule-error">
            {error}
          </div>
        )}

        {success && (
          <div className="schedule-success">
            {success}
          </div>
        )}

        <form
          className="schedule-form"
          onSubmit={handleSubmit}
        >
          <div className="schedule-form-row">
            <div className="schedule-field">
              <label htmlFor="session-date">
                Date
              </label>

              <input
                id="session-date"
                type="date"
                value={date}
                min={today}
                onChange={handleDateChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="schedule-field">
              <label htmlFor="session-time">
                Time
              </label>

              <input
                id="session-time"
                type="time"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setError("");
                }}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="schedule-field">
            <label htmlFor="session-topic">
              Topic / Skill
            </label>

            <input
              id="session-topic"
              type="text"
              placeholder="e.g. React basics"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setError("");
              }}
              maxLength={100}
              disabled={submitting}
              required
            />
          </div>

          <div className="schedule-field">
            <label htmlFor="session-note">
              Note{" "}
              <span>
                Optional
              </span>
            </label>

            <textarea
              id="session-note"
              placeholder="Add a short note about the session..."
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              maxLength={300}
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="schedule-modal-actions">
            <button
              type="button"
              className="schedule-cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="schedule-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? "Scheduling..."
                : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;
