from matching import calculate_ai_match_score


scenarios = [
    # ============================================================
    # 1. Exact match
    # ============================================================
    {
        "name": "Exact Skill Match",
        "student_a": {
            "skills_to_teach": ["JavaScript"],
            "skills_to_learn": ["Python"],
        },
        "student_b": {
            "skills_to_teach": ["Python"],
            "skills_to_learn": ["JavaScript"],
        },
    },

    # ============================================================
    # 2. Frontend semantic match
    # ============================================================
    {
        "name": "Frontend Semantic Match",
        "student_a": {
            "skills_to_teach": ["Python"],
            "skills_to_learn": ["Frontend Development"],
        },
        "student_b": {
            "skills_to_teach": ["React", "JavaScript", "Next.js"],
            "skills_to_learn": ["Python"],
        },
    },

    # ============================================================
    # 3. Backend semantic match
    # ============================================================
    {
        "name": "Backend Semantic Match",
        "student_a": {
            "skills_to_teach": ["React"],
            "skills_to_learn": ["Backend Development"],
        },
        "student_b": {
            "skills_to_teach": ["Node.js", "Express", "MongoDB"],
            "skills_to_learn": ["Frontend Development"],
        },
    },

    # ============================================================
    # 4. Machine Learning / AI
    # ============================================================
    {
        "name": "Machine Learning and AI",
        "student_a": {
            "skills_to_teach": ["JavaScript"],
            "skills_to_learn": ["Machine Learning"],
        },
        "student_b": {
            "skills_to_teach": [
                "Python",
                "Artificial Intelligence",
                "Data Science",
            ],
            "skills_to_learn": ["Web Development"],
        },
    },

    # ============================================================
    # 5. Strong reciprocal match
    # ============================================================
    {
        "name": "Strong Reciprocal Match",
        "student_a": {
            "skills_to_teach": ["JavaScript", "React"],
            "skills_to_learn": ["Python", "Machine Learning"],
        },
        "student_b": {
            "skills_to_teach": [
                "Python",
                "Artificial Intelligence",
                "Data Science",
            ],
            "skills_to_learn": [
                "JavaScript",
                "Frontend Development",
            ],
        },
    },

    # ============================================================
    # 6. Completely unrelated
    # ============================================================
    {
        "name": "Unrelated Skills",
        "student_a": {
            "skills_to_teach": ["React", "Node.js"],
            "skills_to_learn": ["Photography"],
        },
        "student_b": {
            "skills_to_teach": ["Cooking", "Photography"],
            "skills_to_learn": ["Music"],
        },
    },

    # ============================================================
    # 7. Programming language relationship
    # ============================================================
    {
        "name": "Programming Language Relationship",
        "student_a": {
            "skills_to_teach": ["Java"],
            "skills_to_learn": ["Python Programming"],
        },
        "student_b": {
            "skills_to_teach": ["Python"],
            "skills_to_learn": ["Java Development"],
        },
    },

    # ============================================================
    # 8. Data Science ecosystem
    # ============================================================
    {
        "name": "Data Science Ecosystem",
        "student_a": {
            "skills_to_teach": ["Web Development"],
            "skills_to_learn": ["Data Science"],
        },
        "student_b": {
            "skills_to_teach": [
                "Python",
                "Pandas",
                "Data Analysis",
            ],
            "skills_to_learn": ["Frontend Development"],
        },
    },

    # ============================================================
    # 9. UI/UX relationship
    # ============================================================
    {
        "name": "UI UX Relationship",
        "student_a": {
            "skills_to_teach": ["JavaScript"],
            "skills_to_learn": ["UI/UX Design"],
        },
        "student_b": {
            "skills_to_teach": [
                "Figma",
                "User Interface Design",
                "Graphic Design",
            ],
            "skills_to_learn": ["JavaScript"],
        },
    },

    # ============================================================
    # 10. Video editing / content creation
    # ============================================================
    {
        "name": "Content Creation Match",
        "student_a": {
            "skills_to_teach": ["Photography"],
            "skills_to_learn": ["Video Editing"],
        },
        "student_b": {
            "skills_to_teach": [
                "Premiere Pro",
                "Video Editing",
                "Content Creation",
            ],
            "skills_to_learn": ["Photography"],
        },
    },

    # ============================================================
    # 11. Cloud / DevOps
    # ============================================================
    {
        "name": "Cloud DevOps Match",
        "student_a": {
            "skills_to_teach": ["JavaScript"],
            "skills_to_learn": ["Cloud Computing"],
        },
        "student_b": {
            "skills_to_teach": [
                "AWS",
                "Docker",
                "DevOps",
            ],
            "skills_to_learn": ["Web Development"],
        },
    },

    # ============================================================
    # 12. Mobile development
    # ============================================================
    {
        "name": "Mobile Development",
        "student_a": {
            "skills_to_teach": ["Python"],
            "skills_to_learn": ["Mobile App Development"],
        },
        "student_b": {
            "skills_to_teach": [
                "React Native",
                "Android Development",
                "Flutter",
            ],
            "skills_to_learn": ["Python"],
        },
    },

    # ============================================================
    # 13. Mixed exact + semantic
    # ============================================================
    {
        "name": "Mixed Exact and Semantic",
        "student_a": {
            "skills_to_teach": [
                "JavaScript",
                "HTML",
            ],
            "skills_to_learn": [
                "Python",
                "Frontend Development",
            ],
        },
        "student_b": {
            "skills_to_teach": [
                "Python",
                "React",
                "CSS",
            ],
            "skills_to_learn": [
                "JavaScript",
                "Web Development",
            ],
        },
    },

    # ============================================================
    # 14. Creative skills
    # ============================================================
    {
        "name": "Creative Skills",
        "student_a": {
            "skills_to_teach": [
                "Photography",
                "Photoshop",
            ],
            "skills_to_learn": [
                "Graphic Design",
            ],
        },
        "student_b": {
            "skills_to_teach": [
                "Graphic Design",
                "Illustration",
            ],
            "skills_to_learn": [
                "Photography",
            ],
        },
    },

    # ============================================================
    # 15. Very weak / unrelated technical pair
    # ============================================================
    {
        "name": "Weak Technical Relationship",
        "student_a": {
            "skills_to_teach": ["MongoDB"],
            "skills_to_learn": ["Digital Marketing"],
        },
        "student_b": {
            "skills_to_teach": ["Database Management"],
            "skills_to_learn": ["Social Media Marketing"],
        },
    },
]


def print_matches(title, matches):
    print(f"\n{title}")

    for match in matches:
        print(
            f"  {match['learning_skill']}"
            f" → "
            f"{match['matched_teaching_skill']}"
            f" | "
            f"{match['similarity'] * 100:.2f}%"
            f" | "
            f"{match['match_type']}"
        )


def run_scenario(index, scenario):
    student_a = scenario["student_a"]
    student_b = scenario["student_b"]

    result = calculate_ai_match_score(
        current_skills_to_learn=student_a["skills_to_learn"],
        current_skills_to_teach=student_a["skills_to_teach"],
        other_skills_to_learn=student_b["skills_to_learn"],
        other_skills_to_teach=student_b["skills_to_teach"],
    )

    print("\n" + "=" * 70)

    print(
        f"SCENARIO {index}: {scenario['name']}"
    )

    print("=" * 70)

    print(
        f"\nStudent A wants to learn:"
    )
    print(
        f"  {', '.join(student_a['skills_to_learn'])}"
    )

    print(
        f"Student A can teach:"
    )
    print(
        f"  {', '.join(student_a['skills_to_teach'])}"
    )

    print(
        f"\nStudent B wants to learn:"
    )
    print(
        f"  {', '.join(student_b['skills_to_learn'])}"
    )

    print(
        f"Student B can teach:"
    )
    print(
        f"  {', '.join(student_b['skills_to_teach'])}"
    )

    print("\n--- Scores ---")

    print(
        f"Forward compatibility : "
        f"{result['forward_score']}%"
    )

    print(
        f"Reverse compatibility : "
        f"{result['reverse_score']}%"
    )

    print(
        f"Reciprocal AI score   : "
        f"{result['reciprocal_score']}%"
    )

    print_matches(
        "\nA wants to learn → B can teach:",
        result["forward_matches"]
    )

    print_matches(
        "\nB wants to learn → A can teach:",
        result["reverse_matches"]
    )


if __name__ == "__main__":

    print(
        "\n"
        "SKILLSWAP AI MATCHING TEST SUITE"
    )

    print(
        "\nSemantic threshold:"
        f" {0.65 * 100:.0f}%"
    )

    for index, scenario in enumerate(
        scenarios,
        start=1
    ):
        run_scenario(index, scenario)

    print("\n")
    print("=" * 70)
    print("ALL SCENARIOS COMPLETED")
    print("=" * 70)
    