from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def similarity(text1, text2):
    embeddings = model.encode(
        [text1, text2],
        normalize_embeddings=True
    )

    return float(embeddings[0] @ embeddings[1])


tests = [
    {
        "learning": "Frontend Development",
        "teaching": [
            "React",
            "JavaScript",
            "Next.js"
        ]
    },
    {
        "learning": "Backend Development",
        "teaching": [
            "Node.js",
            "Express",
            "MongoDB"
        ]
    },
    {
        "learning": "Machine Learning",
        "teaching": [
            "Python",
            "Artificial Intelligence",
            "Data Science"
        ]
    },
    {
        "learning": "Photography",
        "teaching": [
            "React",
            "Node.js",
            "MongoDB"
        ]
    }
]


for test in tests:
    print("\n" + "=" * 50)
    print("Wants to learn:", test["learning"])
    print("Student teaches:", ", ".join(test["teaching"]))

    scores = []

    for skill in test["teaching"]:
        score = similarity(test["learning"], skill)
        scores.append(score)

        print(f"  {skill:<25} → {score:.4f}")

    best_score = max(scores)

    print(f"\nBest semantic match: {best_score:.4f}")