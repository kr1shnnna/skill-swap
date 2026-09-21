import { useEffect, useState, useRef, useContext } from "react";
import api from "../../services/api";
import "./Profile.css";

import { FaCamera, FaUserCircle, FaTrash } from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";

const Profile = () => {
  const { updateUser } = useContext(AuthContext);

  const [removingPicture, setRemovingPicture] = useState(false);

  const handleRemoveProfilePicture = async () => {
    try {
      setRemovingPicture(true);

      const response = await api.delete("/users/profile/picture");

      setProfile((prev) => ({
        ...prev,
        profilePicture: "",
      }));

      updateUser({
        profilePicture: "",
      });

      setMessage("Profile picture removed successfully!");
    } catch (error) {
      console.error("Remove profile picture error:", error);

      setMessage(
        error.response?.data?.message || "Failed to remove profile picture.",
      );
    } finally {
      setRemovingPicture(false);
    }
  };

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    gender: "Prefer not to say",
    profilePicture: "",
    skillsToTeach: [],
    skillsToLearn: [],
  });

  const [teachSkill, setTeachSkill] = useState("");
  const [learnSkill, setLearnSkill] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Load existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");

        setProfile({
          name: response.data.user.name || "",
          bio: response.data.user.bio || "",
          gender: response.data.user.gender || "Prefer not to say",
          profilePicture: response.data.user.profilePicture || "",
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
    const newSkills = teachSkill
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    if (newSkills.length === 0) {
      return;
    }

    const uniqueSkills = newSkills.filter(
      (skill) =>
        !profile.skillsToTeach.some(
          (existingSkill) =>
            existingSkill.toLowerCase() === skill.toLowerCase(),
        ),
    );

    setProfile({
      ...profile,
      skillsToTeach: [...profile.skillsToTeach, ...uniqueSkills],
    });

    setTeachSkill("");
  };

  const addLearnSkill = () => {
    const newSkills = learnSkill
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    if (newSkills.length === 0) {
      return;
    }

    const uniqueSkills = newSkills.filter(
      (skill) =>
        !profile.skillsToLearn.some(
          (existingSkill) =>
            existingSkill.toLowerCase() === skill.toLowerCase(),
        ),
    );

    setProfile({
      ...profile,
      skillsToLearn: [...profile.skillsToLearn, ...uniqueSkills],
    });

    setLearnSkill("");
  };

  const removeTeachSkill = (skill) => {
    setProfile({
      ...profile,
      skillsToTeach: profile.skillsToTeach.filter((item) => item !== skill),
    });
  };

  const removeLearnSkill = (skill) => {
    setProfile({
      ...profile,
      skillsToLearn: profile.skillsToLearn.filter((item) => item !== skill),
    });
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("profilePicture", file);

    try {
      setUploadingPicture(true);
      setMessage("");

      const response = await api.post("/users/profile/picture", formData);

      setProfile((previousProfile) => ({
        ...previousProfile,
        profilePicture: response.data.profilePicture,
      }));

      updateUser({
        profilePicture: response.data.profilePicture,
      });

      setMessage("Profile picture updated successfully!");
    } catch (error) {
      console.error("Profile picture upload error:", error);

      setMessage(
        error.response?.data?.message || "Failed to upload profile picture.",
      );
    } finally {
      setUploadingPicture(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

      setMessage(error.response?.data?.message || "Failed to update profile");
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
            Tell the SkillSwap community what you can teach and what you want to
            learn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Basic Information */}
          <section className="profile-section">
            <h2>About You</h2>

            <div className="profile-picture-section">
              <div className="profile-picture-wrapper">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={`${profile.name || "Profile"} profile`}
                    className="profile-picture"
                  />
                ) : (
                  <FaUserCircle className="profile-picture-placeholder" />
                )}

                <button
                  type="button"
                  className="profile-picture-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  aria-label="Change profile picture"
                >
                  <FaCamera />
                </button>
              </div>

              <div className="profile-picture-info">
                <h3>Profile Picture</h3>

                <p>Add a photo so other students can recognize you.</p>

                <div className="profile-picture-actions">
                <button
                  type="button"
                  className="change-picture-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                >
                  {uploadingPicture
                    ? "Uploading..."
                    : profile.profilePicture
                      ? "Change Photo"
                      : "Upload Photo"}
                </button>

                {profile.profilePicture && (
                  <button
                    type="button"
                    className="remove-picture-btn"
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={removingPicture}
                  >
                    <FaTrash />
                    {removingPicture ? "Removing..." : "Remove Photo"}
                  </button>
                )}
                
                </div>
                

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  hidden
                />
              </div>
            </div>
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

            <div className="form-group">
              <label htmlFor="gender">Gender</label>

              <select
                id="gender"
                name="gender"
                value={profile.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
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

              <button type="button" onClick={addTeachSkill}>
                Add
              </button>
            </div>

            <div className="skills-list">
              {profile.skillsToTeach.map((skill) => (
                <span key={skill} className="skill-tag teach-tag">
                  {skill}

                  <button type="button" onClick={() => removeTeachSkill(skill)}>
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

              <button type="button" onClick={addLearnSkill}>
                Add
              </button>
            </div>

            <div className="skills-list">
              {profile.skillsToLearn.map((skill) => (
                <span key={skill} className="skill-tag learn-tag">
                  {skill}

                  <button type="button" onClick={() => removeLearnSkill(skill)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {message && <p className="profile-message">{message}</p>}

          <button type="submit" className="save-profile-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {showRemoveConfirm && (
          <div className="remove-picture-overlay">
            <div className="remove-picture-modal">
              <div className="remove-picture-modal-icon">
                <FaTrash />
              </div>

              <h3>Remove Profile Picture?</h3>

              <p>Are you sure you want to remove your profile picture?</p>

              <div className="remove-picture-modal-actions">
                <button
                  type="button"
                  className="cancel-remove-btn"
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={removingPicture}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-remove-btn"
                  onClick={async () => {
                    await handleRemoveProfilePicture();
                    setShowRemoveConfirm(false);
                  }}
                  disabled={removingPicture}
                >
                  {removingPicture ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Profile;
