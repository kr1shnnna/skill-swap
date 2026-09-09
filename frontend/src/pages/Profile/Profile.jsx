import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    skillsToTeach: [],
    skillsToLearn: [],
  });

  const [teachSkill, setTeachSkill] = useState("");
  const [learnSkill, setLearnSkill] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");

        setProfile({
          name: response.data.user.name || "",
          bio: response.data.user.bio || "",
          skillsToTeach: response.data.user.skillsToTeach || [],
          skillsToLearn: response.data.user.skillsToLearn || [],
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const addTeachSkill = () => {
    const skill = teachSkill.trim();

    if (skill && !profile.skillsToTeach.includes(skill)) {
      setProfile({
        ...profile,
        skillsToTeach: [...profile.skillsToTeach, skill],
      });

      setTeachSkill("");
    }
  };

  const addLearnSkill = () => {
    const skill = learnSkill.trim();

    if (skill && !profile.skillsToLearn.includes(skill)) {
      setProfile({
        ...profile,
        skillsToLearn: [...profile.skillsToLearn, skill],
      });

      setLearnSkill("");
    }
  };

  const removeTeachSkill = (skill) => {
    setProfile({
      ...profile,
      skillsToTeach: profile.skillsToTeach.filter(
        (item) => item !== skill
      ),
    });
  };

  const removeLearnSkill = (skill) => {
    setProfile({
      ...profile,
      skillsToLearn: profile.skillsToLearn.filter(
        (item) => item !== skill
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await api.put("/users/profile", profile);

      console.log("Profile updated:", response.data);

      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <main className="profile-page">
      <div className="profile-container">

        <div className="profile-header">
          <h1>Build Your Profile</h1>
          <p>
            Tell the SkillSwap community what you can teach
            and what you want to learn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">

          {/* Basic Information */}
          <section className="profile-section">
            <h2>About You</h2>

            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>

              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell others a little about yourself..."
                rows="4"
              />
            </div>
          </section>

          {/* Skills to Teach */}
          <section className="profile-section">
            <h2>Skills I Can Teach</h2>
            <p className="section-description">
              Add skills you feel confident teaching others.
            </p>

            <div className="skill-input-row">
              <input
                type="text"
                value={teachSkill}
                onChange={(e) => setTeachSkill(e.target.value)}
                placeholder="Example: React, Python, Photoshop"
              />

              <button
                type="button"
                onClick={addTeachSkill}
              >
                Add
              </button>
            </div>

            <div className="skills-list">
              {profile.skillsToTeach.map((skill) => (
                <span key={skill} className="skill-tag teach-tag">
                  {skill}

                  <button
                    type="button"
                    onClick={() => removeTeachSkill(skill)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Skills to Learn */}
          <section className="profile-section">
            <h2>Skills I Want to Learn</h2>
            <p className="section-description">
              Add skills you want help learning.
            </p>

            <div className="skill-input-row">
              <input
                type="text"
                value={learnSkill}
                onChange={(e) => setLearnSkill(e.target.value)}
                placeholder="Example: UI/UX, Node.js, Machine Learning"
              />

              <button
                type="button"
                onClick={addLearnSkill}
              >
                Add
              </button>
            </div>

            <div className="skills-list">
              {profile.skillsToLearn.map((skill) => (
                <span key={skill} className="skill-tag learn-tag">
                  {skill}

                  <button
                    type="button"
                    onClick={() => removeLearnSkill(skill)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {message && (
            <p className="profile-message">{message}</p>
          )}

          <button
            type="submit"
            className="save-profile-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

        </form>
      </div>
    </main>
  );
};

export default Profile;
