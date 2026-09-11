import{ useState } from "react";
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!date || !time || !topic.trim()) {
      setError(
        "Please fill in the date, time, and topic."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

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
                onChange={(event) =>
                  setDate(event.target.value)
                }
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
                onChange={(event) =>
                  setTime(event.target.value)
                }
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
              onChange={(event) =>
                setTopic(event.target.value)
              }
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
