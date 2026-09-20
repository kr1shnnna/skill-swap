from matching import calculate_ai_match_score


students = [
    {
        "name": "Student A",
        "skills_to_teach": [
            "JavaScript",
            "HTML",
            "CSS",
        ],
        "skills_to_learn": [
            "Machine Learning",
            "Python",
        ],
    },
    {
        "name": "Student B",
        "skills_to_teach": [
            "Python",
            "Artificial Intelligence",
            "Data Science",
        ],
        "skills_to_learn": [
            "Frontend Development",
            "JavaScript",
        ],
    },
    {
        "name": "Student C",
        "skills_to_teach": [
            "Cooking",
            "Photography",
        ],
        "skills_to_learn": [
            "Music",
            "Video Editing",
        ],
    },
]


def test_pair(student_a, student_b):
    result = calculate_ai_match_score(
        current_skills_to_learn=student_a["skills_to_learn"],
        current_skills_to_teach=student_a["skills_to_teach"],
        other_skills_to_learn=student_b["skills_to_learn"],
        other_skills_to_teach=student_b["skills_to_teach"],
    )

    print("\n" + "=" * 60)

    print(
        f"{student_a['name']} ↔ {student_b['name']}"
    )

    print(
        f"{student_a['name']} wants to learn:"
    )
    print(
        ", ".join(student_a["skills_to_learn"])
    )

    print(
        f"{student_b['name']} teaches:"
    )
    print(
        ", ".join(student_b["skills_to_teach"])
    )

    print()

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


if __name__ == "__main__":
    test_pair(students[0], students[1])
    test_pair(students[0], students[2])
    