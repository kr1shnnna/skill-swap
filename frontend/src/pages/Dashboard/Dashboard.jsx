import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserEdit,
  FaChalkboardTeacher,
  FaBookOpen,
  FaExchangeAlt
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");

        setProfile(response.data.user);
      } catch (error) {
        console.error("Dashboard profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">

        {/* Welcome Section */}
        <section className="dashboard-welcome">
          <p className="welcome-tag">YOUR SKILLS. YOUR COMMUNITY.</p>

          <h1>
            Welcome back, <span>{user?.name}</span> 👋
          </h1>

          <p>
            Ready to share what you know and learn something new?
          </p>
        </section>

        {/* Skills Overview */}
        <section className="dashboard-grid">

          {/* Skills to Teach */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaChalkboardTeacher />
                Skills I Can Teach
              </h2>

              <Link to="/profile">Edit</Link>
            </div>

            {profile?.skillsToTeach?.length > 0 ? (
              <div className="dashboard-skills">
                {profile.skillsToTeach.map((skill) => (
                  <span key={skill} className="dashboard-skill teach">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <p>You haven't added any teaching skills yet.</p>

                <Link to="/profile">
                  Add Skills
                </Link>
              </div>
            )}
          </div>

          {/* Skills to Learn */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaBookOpen />
                Skills I Want to Learn
              </h2>

              <Link to="/profile">Edit</Link>
            </div>

            {profile?.skillsToLearn?.length > 0 ? (
              <div className="dashboard-skills">
                {profile.skillsToLearn.map((skill) => (
                  <span key={skill} className="dashboard-skill learn">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <p>You haven't added any learning goals yet.</p>

                <Link to="/profile">
                  Add Skills
                </Link>
              </div>
            )}
          </div>

        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">

          <h2>Quick Actions</h2>

          <div className="quick-actions-grid">
            <Link to="/swap-requests" className="quick-action-card">
  <div className="action-icon">
    <FaExchangeAlt />
  </div>

  <h3>Swap Requests</h3>

  <p>
    View incoming requests and track the requests you've sent.
  </p>
</Link>

            <Link
              to="/find-skills"
              className="quick-action-card"
            >
              <div className="action-icon">
                <FaSearch />
              </div>

              <h3>Find Skill Matches</h3>

              <p>
                Discover people who can teach you the skills
                you want to learn.
              </p>
            </Link>

            <Link
              to="/profile"
              className="quick-action-card"
            >
              <div className="action-icon">
                <FaUserEdit />
              </div>

              <h3>Update Profile</h3>

              <p>
                Add new skills and keep your profile up to date.
              </p>
            </Link>

          </div>

        </section>

        {/* Profile Completion Reminder */}
        {profile &&
          (profile.skillsToTeach.length === 0 ||
            profile.skillsToLearn.length === 0) && (

            <section className="profile-reminder">

              <div>
                <h3>Complete Your Skill Profile</h3>

                <p>
                  Add skills you can teach and skills you want
                  to learn to get better matches.
                </p>
              </div>

              <Link to="/profile">
                Complete Profile
              </Link>

            </section>

          )}

      </div>
    </main>
  );
};

export default Dashboard;
