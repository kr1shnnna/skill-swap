from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Initial calibration threshold.
SEMANTIC_MATCH_THRESHOLD = 0.65

# Load the model once when the service starts.
model = SentenceTransformer(MODEL_NAME)


def normalize_skill(skill):
    """
    Normalize a skill name for exact comparison.
    """
    return skill.lower().strip()


def get_embeddings(texts):
    """
    Generate normalized embeddings for multiple texts at once.

    Batch encoding is much more efficient than generating
    embeddings one by one.
    """
    if not texts:
        return []

    return model.encode(
        texts,
        normalize_embeddings=True
    )


def semantic_similarity_from_embeddings(
    embedding1,
    embedding2
):
    """
    Calculate cosine similarity between two normalized
    embeddings.

    Because embeddings are normalized, their dot product
    is equivalent to cosine similarity.
    """
    return float(embedding1 @ embedding2)


def calculate_direction_score(
    skills_to_learn,
    skills_to_teach,
    embedding_cache=None
):
    """
    Calculate how well another student's teaching skills
    satisfy the current student's learning goals.

    Exact matches receive 1.0.

    Semantic matches are accepted only when their similarity
    reaches SEMANTIC_MATCH_THRESHOLD.

    Embeddings are generated in batches and reused through
    embedding_cache.

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

    if embedding_cache is None:
        embedding_cache = {}

    normalized_teaching = {
        normalize_skill(skill): skill
        for skill in skills_to_teach
    }

    # ---------------------------------------------
    # Find all texts that need embeddings
    # ---------------------------------------------

    texts_to_encode = []

    for skill in skills_to_learn + skills_to_teach:
        normalized = normalize_skill(skill)

        if normalized not in embedding_cache:
            texts_to_encode.append(normalized)

    # Remove duplicates while preserving order.
    texts_to_encode = list(dict.fromkeys(texts_to_encode))

    # ---------------------------------------------
    # Generate missing embeddings in ONE batch
    # ---------------------------------------------

    if texts_to_encode:
        new_embeddings = get_embeddings(texts_to_encode)

        for text, embedding in zip(
            texts_to_encode,
            new_embeddings
        ):
            embedding_cache[text] = embedding

    # ---------------------------------------------
    # Calculate matches
    # ---------------------------------------------

    best_scores = []
    matches = []

    for learning_skill in skills_to_learn:

        normalized_learning = normalize_skill(
            learning_skill
        )

        # -----------------------------------------
        # Exact match
        # -----------------------------------------

        if normalized_learning in normalized_teaching:

            matched_skill = normalized_teaching[
                normalized_learning
            ]

            best_score = 1.0

            matches.append({
                "learning_skill": learning_skill,
                "matched_teaching_skill": matched_skill,
                "similarity": best_score,
                "match_type": "exact"
            })

            best_scores.append(best_score)

            continue

        # -----------------------------------------
        # Semantic matching
        # -----------------------------------------

        learning_embedding = embedding_cache[
            normalized_learning
        ]

        semantic_scores = []

        for teaching_skill in skills_to_teach:

            normalized_teaching_skill = normalize_skill(
                teaching_skill
            )

            teaching_embedding = embedding_cache[
                normalized_teaching_skill
            ]

            score = semantic_similarity_from_embeddings(
                learning_embedding,
                teaching_embedding
            )

            semantic_scores.append(
                (score, teaching_skill)
            )

        best_score, matched_skill = max(
            semantic_scores,
            key=lambda item: item[0]
        )

        # -----------------------------------------
        # Apply semantic threshold
        # -----------------------------------------

        if best_score >= SEMANTIC_MATCH_THRESHOLD:
            match_type = "semantic"
            effective_score = best_score
        else:
            match_type = "below_threshold"
            effective_score = 0.0

        matches.append({
            "learning_skill": learning_skill,
            "matched_teaching_skill": matched_skill,
            "similarity": best_score,
            "match_type": match_type
        })

        best_scores.append(effective_score)

    direction_score = (
        sum(best_scores) / len(best_scores)
    )

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

    Embeddings are shared between both directions.
    """

    # Shared cache for both directions.
    embedding_cache = {}

    # ---------------------------------------------
    # Forward direction
    # ---------------------------------------------

    forward_result = calculate_direction_score(
        current_skills_to_learn,
        other_skills_to_teach,
        embedding_cache
    )

    # ---------------------------------------------
    # Reverse direction
    # ---------------------------------------------

    reverse_result = calculate_direction_score(
        other_skills_to_learn,
        current_skills_to_teach,
        embedding_cache
    )

    forward_score = forward_result["score"]
    reverse_score = reverse_result["score"]

    # ---------------------------------------------
    # Reciprocal compatibility
    # ---------------------------------------------
    #
    # Both directions are important for a SkillSwap.
    #
    # Harmonic mean penalizes situations where one
    # direction is strong but the other is weak.
    # ---------------------------------------------

    if forward_score == 0 or reverse_score == 0:
        reciprocal_score = 0.0
    else:
        reciprocal_score = (
            2 * forward_score * reverse_score
        ) / (
            forward_score + reverse_score
        )

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
