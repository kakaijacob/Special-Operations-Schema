WITH 
cme AS (
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS cme_count
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity = 'cmes'
    and EXTRACT(YEAR FROM mct.date_submitted) = 2026
    GROUP BY mct.mentee_id
),
drills AS (
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS drill_count
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity = 'drills'
    and EXTRACT(YEAR FROM mct.date_submitted) = 2026
    GROUP BY mct.mentee_id
),
skill_demos AS (
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS skill_demos_count
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity = 'skill_demos_mentor'
    and EXTRACT(YEAR FROM mct.date_submitted) = 2026
    GROUP BY mct.mentee_id
),
return_demos AS ( 
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS return_demos_count 
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity = 'skills_demos_mentee' 
    and EXTRACT(YEAR FROM mct.date_submitted) = 2026
    GROUP BY mct.mentee_id
),
skill_eval AS (
    SELECT 
        p.mentee_id,
        COUNT(DISTINCT p.skill_evaluation) AS skill_eval_count,
        AVG(p.average_score) AS average_score
    FROM mentors.process_moh_skills_assessment_2026 p
    WHERE EXTRACT(YEAR FROM p.date_submitted) = 2026
    GROUP BY p.mentee_id
),
partograph AS (
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS partograph_count
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity IN ('video_case_scenarios', 'videoa_case_scenarios') 
      AND mct.topic ILIKE 'Partograph%'
    GROUP BY mct.mentee_id
)
SELECT 
    mct.mentee_id,
    mct.mentee_name,
    mct.county,
    mct.facility,
    COALESCE(cme.cme_count, 0) AS cme_count,
    COALESCE(drills.drill_count, 0) AS drill_count,
    COALESCE(skill_demos.skill_demos_count, 0) AS skill_demos_count,
    COALESCE(return_demos.return_demos_count, 0) AS return_demos_count,
    COALESCE(skill_eval.skill_eval_count, 0) AS skill_eval_count,
    COALESCE(skill_eval.average_score, 0) AS average_score,
    COALESCE(partograph.partograph_count, 0) AS partograph_count
FROM mentors.mentee_curriculum_tracking mct
LEFT JOIN cme ON mct.mentee_id = cme.mentee_id
LEFT JOIN drills ON mct.mentee_id = drills.mentee_id
LEFT JOIN skill_demos ON mct.mentee_id = skill_demos.mentee_id
LEFT JOIN return_demos ON mct.mentee_id = return_demos.mentee_id
LEFT JOIN skill_eval ON mct.mentee_id = skill_eval.mentee_id
LEFT JOIN partograph ON mct.mentee_id = partograph.mentee_id
GROUP BY
    mct.mentee_id,
    mct.mentee_name,
    mct.county,
    mct.facility,
    cme.cme_count,
    drills.drill_count,
    skill_demos.skill_demos_count,
    return_demos.return_demos_count,
    skill_eval.skill_eval_count,
    skill_eval.average_score,
    partograph.partograph_count;
