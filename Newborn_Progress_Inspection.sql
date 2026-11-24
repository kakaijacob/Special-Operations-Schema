WITH

mentees AS (
    SELECT
        md.mentee_id,
        md.mentee_name,
        md.county,
        md.facility
    FROM mentors.mentee_database md
    WHERE md.program IN ('Newborn curriculum', 'Both')
      AND EXTRACT(YEAR FROM md.date_activated) = 2026
),


curriculum_summary AS (

    SELECT
        mentee_id,
        MAX(facility_code) AS facility_code,
        MAX(program) AS program,

        -- CME Progress (out of 19 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'CMEs'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS cme_count,

        -- Drill Progress (out of 7 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'Drills'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS drill_count,

        -- Practicum Progress (out of 20 or 22 topics, depending on program)
        CASE
            WHEN MAX(CASE WHEN program = 'essential_newborn_care' THEN 1 ELSE 0 END) = 1
                THEN COUNT(DISTINCT CASE
                        WHEN mentorship_activity = 'practicums'
                         AND program = 'essential_newborn_care'
                         AND topic IS NOT NULL
                         AND TRIM(topic) <> ''
                        THEN topic
                    END)
            WHEN MAX(CASE WHEN program = 'comprehensive_newborn_care' THEN 1 ELSE 0 END) = 1
                THEN COUNT(DISTINCT CASE
                        WHEN mentorship_activity = 'Practicums'
                         AND program = 'comprehensive_newborn_care'
                         AND topic IS NOT NULL
                         AND TRIM(topic) <> ''
                        THEN topic
                    END)
            ELSE 0
        END AS practicum_count,

        -- Skill Demonstration Progress (out of 5 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'skill_demonstrations'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS skill_demo_count,

        -- Video Progress (out of 12 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'Videos'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS video_count,

        -- Role Play Progress (out of 2 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'Role plays'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS roleplay_count,

        -- Case Scenario Progress (out of 9 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'Case scenarios'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS case_scenario_count,

        -- Group Discussion Progress (out of 7 topics)
        COUNT(DISTINCT CASE
                WHEN mentorship_activity = 'Group discussions'
                 AND topic IS NOT NULL
                 AND TRIM(topic) <> ''
                THEN topic
            END) AS group_discussions_count

    FROM mentors.newborn_curriculum_tracking

    WHERE EXTRACT(YEAR FROM date_submitted) = 2026

    GROUP BY mentee_id
),


assessment_scores AS (

    WITH ranked AS (

        SELECT
            mentee_id,
            submission_id,
            date_submitted,
            average_score,

            ROW_NUMBER() OVER (
                PARTITION BY mentee_id
                ORDER BY date_submitted ASC, submission_id ASC
            ) AS rn_first,

            ROW_NUMBER() OVER (
                PARTITION BY mentee_id
                ORDER BY date_submitted DESC, submission_id DESC
            ) AS rn_last,

            COUNT(*) OVER (
                PARTITION BY mentee_id
            ) AS assessment_count

        FROM mentors.process_moh_skills_assessment_2026

        WHERE lower(trim(skill_evaluation)) = 'newborn resuscitation'
          AND lower(trim(program)) = 'newborn curriculum'
          AND average_score IS NOT NULL
    )

    SELECT
        mentee_id,

        -- First attempt is always baseline
        MAX(
            CASE
                WHEN rn_first = 1
                THEN average_score
            END
        ) AS baseline_score,

        -- Endline only exists if there is a second attempt
        MAX(
            CASE
                WHEN assessment_count > 1
                 AND rn_last = 1
                THEN average_score
            END
        ) AS endline_score,

        MAX(
            CASE
                WHEN assessment_count > 1
                 AND rn_last = 1
                THEN date_submitted
            END
        ) AS assessment_completion_date

    FROM ranked

    GROUP BY mentee_id
)


SELECT
    m.mentee_id,
    m.mentee_name,
    m.county,
    m.facility,
    c.facility_code,
    c.program,

    -- Progress per category (counts only)
    COALESCE(c.cme_count, 0) AS cme_count,
    COALESCE(c.drill_count, 0) AS drill_count,
    COALESCE(c.practicum_count, 0) AS practicum_count,
    COALESCE(c.skill_demo_count, 0) AS skill_demo_count,
    COALESCE(c.video_count, 0) AS video_count,
    COALESCE(c.roleplay_count, 0) AS roleplay_count,
    COALESCE(c.case_scenario_count, 0) AS case_scenario_count,
    COALESCE(c.group_discussions_count, 0) AS group_discussions_count,

    a.baseline_score,
    a.endline_score,

    -- NNR Assessment Completion
    CASE
        WHEN a.baseline_score IS NOT NULL
         AND a.endline_score IS NOT NULL
         AND a.endline_score >= 0.85
        THEN 1
        ELSE 0
    END AS nnr_assessment_completion,

    -- Full Curriculum Completion (still flags mentees who hit every category in full)
    CASE
        WHEN c.cme_count = 19
         AND c.drill_count = 7
         AND c.practicum_count = CASE
                WHEN c.program = 'essential_newborn_care' THEN 20
                WHEN c.program = 'comprehensive_newborn_care' THEN 22
                ELSE -1
            END
         AND c.skill_demo_count = 5
         AND c.video_count = 12
         AND c.roleplay_count = 2
         AND c.case_scenario_count = 9
         AND c.group_discussions_count = 7

         AND a.baseline_score IS NOT NULL
         AND a.endline_score IS NOT NULL
         AND a.endline_score >= 0.85

        THEN 1
        ELSE 0
    END AS curriculum_completion,

    a.assessment_completion_date

FROM mentees m

LEFT JOIN curriculum_summary c
    ON TRIM(LOWER(m.mentee_id)) = TRIM(LOWER(c.mentee_id))

LEFT JOIN assessment_scores a
    ON TRIM(LOWER(m.mentee_id)) = TRIM(LOWER(a.mentee_id))

ORDER BY m.mentee_id
