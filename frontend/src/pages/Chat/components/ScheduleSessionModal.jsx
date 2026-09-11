import{ useState } from "react";

const ScheduleSessionModal = ({
  selectedUser,
  onClose,
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");

  if (!selectedUser) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    // Backend integration will be added later.
    console.log("Session details:", {
      date,
      time,
      topic,
      note,
      partnerId:
        selectedUser._id ||
        selectedUser.id,
    });
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
        {/* HEADER */}

        <div className="schedule-modal-header">
          <div>
            <p className="schedule-modal-tag">
              SKILL EXCHANGE
            </p>

            <h2>
              Schedule a Session
            </h2>

            <p>
              Plan your next learning
              session with{" "}
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
          >
            ×
          </button>
        </div>

        {/* FORM */}

        <form
          className="schedule-form"
          onSubmit={handleSubmit}
        >
          {/* DATE + TIME */}

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
                required
              />
            </div>
          </div>

          {/* TOPIC */}

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
              required
            />
          </div>

          {/* NOTE */}

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
            />
          </div>

          {/* ACTIONS */}

          <div className="schedule-modal-actions">
            <button
              type="button"
              className="schedule-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="schedule-submit-btn"
            >
              Schedule Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;