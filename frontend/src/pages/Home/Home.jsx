import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleFindMatch = () => {
    navigate("/find-skills");
  };

  const handleHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <main className="home">

      {/* ==========================================
          HERO
          ========================================== */}

      <section className="hero">

        <div className="hero-content">

          <p className="hero-tag">
            LEARN • TEACH • CONNECT
          </p>

          <h1>
            Exchange Skills.
            <br />
            <span>Grow Together.</span>
          </h1>

          <p className="hero-description">
            SkillSwap connects students who want to learn with students
            who have the skills to teach.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={handleFindMatch}
            >
              Find Your Match
            </button>

            <button
              className="secondary-btn"
              onClick={handleHowItWorks}
            >
              How It Works
            </button>

          </div>

        </div>

      </section>


      {/* ==========================================
          WHY SKILLSWAP
          ========================================== */}

      <section className="benefits">

        <div className="section-heading">

          <p className="section-tag">
            WHY SKILLSWAP
          </p>

          <h2>
            Learn from students.
            <br />
            <span>Share what you know.</span>
          </h2>

          <p>
            SkillSwap makes it easy for students to exchange knowledge
            and grow together.
          </p>

        </div>


        <div className="benefit-grid">

          <div className="benefit-card">

            <div className="benefit-icon">
              🎯
            </div>

            <h3>
              Find the Right Match
            </h3>

            <p>
              Discover students whose skills match what you want
              to learn and what you can teach.
            </p>

          </div>


          <div className="benefit-card">

            <div className="benefit-icon">
              🤝
            </div>

            <h3>
              Exchange Skills
            </h3>

            <p>
              Share your knowledge while learning something new
              from another student.
            </p>

          </div>


          <div className="benefit-card">

            <div className="benefit-icon">
              💬
            </div>

            <h3>
              Chat & Collaborate
            </h3>

            <p>
              Connect with your match, discuss your goals,
              and start learning together.
            </p>

          </div>

        </div>

      </section>


      {/* ==========================================
          HOW IT WORKS
          ========================================== */}

      <section
        className="how-it-works"
        id="how-it-works"
      >

        <div className="section-heading">

          <p className="section-tag">
            HOW IT WORKS
          </p>

          <h2>
            Start your skill journey
            <br />
            <span>in four simple steps.</span>
          </h2>

        </div>


        <div className="steps-grid">

          <div className="step-card">

            <div className="step-number">
              01
            </div>

            <h3>
              Create Your Profile
            </h3>

            <p>
              Tell other students about the skills you can
              teach and the skills you want to learn.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <h3>
              Find a Match
            </h3>

            <p>
              Explore students and find someone whose skills
              complement your learning goals.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <h3>
              Send a Swap Request
            </h3>

            <p>
              Send a request to a student you'd like to
              exchange skills with.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              04
            </div>

            <h3>
              Start Learning
            </h3>

            <p>
              Once your request is accepted, chat with your
              match and start exchanging knowledge.
            </p>

          </div>

        </div>


        <div className="final-cta">

          <h2>
            Ready to exchange skills?
          </h2>

          <p>
            Find a student who can teach you something new
            while learning from you.
          </p>

          <button
            className="primary-btn"
            onClick={handleFindMatch}
          >
            Find Your Match
          </button>

        </div>

      </section>

    </main>
  );
};

export default Home;
