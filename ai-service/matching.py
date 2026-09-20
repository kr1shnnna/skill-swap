from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Load the model once when the service starts.
model = SentenceTransformer(MODEL_NAME)


def get_embedding(text):
    """
    Convert a piece of text into a normalized embedding vector.
    """
    return model.encode(
        text,
        normalize_embeddings=True
    )


def semantic_similarity(text1, text2):
    """
    Calculate cosine similarity between two pieces of text.

    Because the embeddings are normalized, their dot product
    is equivalent to cosine similarity.
    """
    embedding1 = get_embedding(text1)
    embedding2 = get_embedding(text2)

    return float(embedding1 @ embedding2)


def calculate_direction_score(skills_to_learn, skills_to_teach):
    """
    Calculate how well a student's learning goals are covered
    by another student's teaching skills.

    For every skill the student wants to learn, we find the
    strongest semantic match among the other student's teaching
    skills.

    Returns a score between 0 and 1.
    """

    if not skills_to_learn or not skills_to_teach:
        return 0.0

    best_scores = []

    for learning_skill in skills_to_learn:
        scores = [
            semantic_similarity(learning_skill, teaching_skill)
            for teaching_skill in skills_to_teach
        ]

        best_score = max(scores)
        best_scores.append(best_score)

    return sum(best_scores) / len(best_scores)


def calculate_reciprocal_score(
    current_skills_to_learn,
    current_skills_to_teach,
    other_skills_to_learn,
    other_skills_to_teach,
):
    """
    Calculate two-way SkillSwap compatibility.

    Direction 1:
        Can the other student teach what I want to learn?

    Direction 2:
        Can I teach what the other student wants to learn?

    The final reciprocal score is the average of both directions.
    """

    forward_score = calculate_direction_score(
        current_skills_to_learn,
        other_skills_to_teach,
    )

    reverse_score = calculate_direction_score(
        other_skills_to_learn,
        current_skills_to_teach,
    )

    reciprocal_score = (forward_score + reverse_score) / 2

    return {
        "forward_score": forward_score,
        "reverse_score": reverse_score,
        "reciprocal_score": reciprocal_score,
    }


def calculate_ai_match_score(
    current_skills_to_learn,
    current_skills_to_teach,
    other_skills_to_learn,
    other_skills_to_teach,
):
    """
    Return the AI matchmaking result as percentages.
    """

    result = calculate_reciprocal_score(
        current_skills_to_learn,
        current_skills_to_teach,
        other_skills_to_learn,
        other_skills_to_teach,
    )

    return {
        "forward_score": round(result["forward_score"] * 100, 2),
        "reverse_score": round(result["reverse_score"] * 100, 2),
        "reciprocal_score": round(result["reciprocal_score"] * 100, 2),
    }
