from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Load the model once.
model = SentenceTransformer(MODEL_NAME)


def normalize_skill(skill):
    """
    Normalize a skill name for exact comparison.
    """
    return skill.lower().strip()


def get_embedding(text):
    """
    Convert text into a normalized embedding vector.
    """
    return model.encode(
        text,
        normalize_embeddings=True
    )


def semantic_similarity(text1, text2):
    """
    Calculate cosine similarity between two pieces of text.

    Since embeddings are normalized, their dot product
    is equivalent to cosine similarity.
    """
    embedding1 = get_embedding(text1)
    embedding2 = get_embedding(text2)

    return float(embedding1 @ embedding2)


def calculate_direction_score(skills_to_learn, skills_to_teach):
    """
    Calculate how well another student's teaching skills
    satisfy the current student's learning goals.

    For every learning skill, we find the strongest match
    among the other student's teaching skills.

    Returns:
        {
            "score": float,
            "matches": list
        }
    """

    if not skills_to_learn or not skills_to_teach:
        return {
            "score": 0.0,
            "matches": []
        }

    normalized_teaching = {
        normalize_skill(skill): skill
        for skill in skills_to_teach
    }

    best_scores = []
    matches = []

    for learning_skill in skills_to_learn:
        normalized_learning = normalize_skill(learning_skill)

        # -------------------------------------------------
        # Exact match
        # -------------------------------------------------

        if normalized_learning in normalized_teaching:
            matched_skill = normalized_teaching[normalized_learning]

            best_score = 1.0

            matches.append({
                "learning_skill": learning_skill,
                "matched_teaching_skill": matched_skill,
                "similarity": best_score,
                "match_type": "exact"
            })

            best_scores.append(best_score)

            continue

        # -------------------------------------------------
        # Semantic match
        # -------------------------------------------------

        semantic_scores = []

        for teaching_skill in skills_to_teach:
            score = semantic_similarity(
                learning_skill,
                teaching_skill
            )

            semantic_scores.append(
                (score, teaching_skill)
            )

        best_score, matched_skill = max(
            semantic_scores,
            key=lambda item: item[0]
        )

        matches.append({
            "learning_skill": learning_skill,
            "matched_teaching_skill": matched_skill,
            "similarity": best_score,
            "match_type": "semantic"
        })

        best_scores.append(best_score)

    direction_score = sum(best_scores) / len(best_scores)

    return {
        "score": direction_score,
        "matches": matches
    }


def calculate_reciprocal_score(
    current_skills_to_learn,
    current_skills_to_teach,
    other_skills_to_learn,
    other_skills_to_teach
):
    """
    Calculate two-way SkillSwap compatibility.

    Direction 1:
        Can the other student teach what I want to learn?

    Direction 2:
        Can I teach what the other student wants to learn?
    """

    forward_result = calculate_direction_score(
        current_skills_to_learn,
        other_skills_to_teach
    )

    reverse_result = calculate_direction_score(
        other_skills_to_learn,
        current_skills_to_teach
    )

    forward_score = forward_result["score"]
    reverse_score = reverse_result["score"]

    reciprocal_score = (
        forward_score + reverse_score
    ) / 2

    return {
        "forward_score": forward_score,
        "reverse_score": reverse_score,
        "reciprocal_score": reciprocal_score,
        "forward_matches": forward_result["matches"],
        "reverse_matches": reverse_result["matches"]
    }


def calculate_ai_match_score(
    current_skills_to_learn,
    current_skills_to_teach,
    other_skills_to_learn,
    other_skills_to_teach
):
    """
    Calculate the complete AI matchmaking result.

    Scores are returned as percentages.
    """

    result = calculate_reciprocal_score(
        current_skills_to_learn,
        current_skills_to_teach,
        other_skills_to_learn,
        other_skills_to_teach
    )

    return {
        "forward_score": round(
            result["forward_score"] * 100,
            2
        ),

        "reverse_score": round(
            result["reverse_score"] * 100,
            2
        ),

        "reciprocal_score": round(
            result["reciprocal_score"] * 100,
            2
        ),

        "forward_matches": result["forward_matches"],

        "reverse_matches": result["reverse_matches"]
    }
