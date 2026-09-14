import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaUserCircle,
  FaChalkboardTeacher,
  FaBookOpen,
  FaArrowLeft,
} from "react-icons/fa";
import api from "../../services/api";
import "./StudentProfile.css";

const StudentProfile = () => {
  const { userId } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await api.get(`/users/${userId}`);
        setStudent(response.data.user);
      } catch (error) {
        console.error("Student profile error:", error);

        setError(
          error.response?.data?.message || "Unable to load student profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [userId]);

  const handleSendRequest = async () => {
    setRequestLoading(true);
    setRequestMessage("");
    setRequestError("");

    try {
      const response = await api.post("/swaps", {
        receiverId: userId,
      });

      setRequestMessage(
        response.data.message || "Swap request sent successfully!",
      );
    } catch (error) {
      console.error("Send swap request error:", error);

      setRequestError(
        error.response?.data?.message || "Unable to send swap request.",
      );
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="student-profile-page">
        <div className="student-profile-loading">Loading profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="student-profile-page">
        <div className="student-profile-error">
          <h2>Profile not found</h2>
          <p>{error}</p>

          <Link to="/find-skills" className="back-btn">
            <FaArrowLeft />
            Back to Matches
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="student-profile-page">
      <div className="student-profile-container">
        <Link to="/find-skills" className="back-link">
          <FaArrowLeft />
          Back to Matches
        </Link>

        <section className="student-profile-card">
          {/* Header */}
          <div className="student-profile-header">
            <FaUserCircle className="student-profile-icon" />

            <div>
              <h1>{student.name}</h1>
              <p>SkillSwap Student</p>

              {student.gender && student.gender !== "Prefer not to say" && (
                <p className="student-gender">Gender: {student.gender}</p>
              )}
              
            </div>
          </div>

          {/* Bio */}
          <div className="student-profile-section">
            <h2>About</h2>

            <p className="student-bio">
              {student.bio || "This student hasn't added a bio yet."}
            </p>
          </div>

          {/* Teaching skills */}
          <div className="student-profile-section">
            <h2>
              <FaChalkboardTeacher />
              Skills I Can Teach
            </h2>

            {student.skillsToTeach?.length > 0 ? (
              <div className="student-skills">
                {student.skillsToTeach.map((skill) => (
                  <span key={skill} className="student-skill teach">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-skills">No teaching skills added yet.</p>
            )}
          </div>

          {/* Learning skills */}
          <div className="student-profile-section">
            <h2>
              <FaBookOpen />
              Skills I Want to Learn
            </h2>

            {student.skillsToLearn?.length > 0 ? (
              <div className="student-skills">
                {student.skillsToLearn.map((skill) => (
                  <span key={skill} className="student-skill learn">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-skills">No learning goals added yet.</p>
            )}
          </div>

          {/* Action */}
          <div className="student-profile-action">
            <button
              className="send-request-btn"
              onClick={handleSendRequest}
              disabled={requestLoading}
            >
              {requestLoading ? "Sending..." : "Send Swap Request"}
            </button>

            {requestMessage && (
              <p className="request-success">{requestMessage}</p>
            )}

            {requestError && <p className="request-error">{requestError}</p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudentProfile;
