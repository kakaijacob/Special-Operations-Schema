WITH 
mentees AS (
    SELECT
        md.mentee_id,
        md.mentee_name,
        md.county,
        md.facility
    FROM mentors.mentee_database md
    WHERE md.program IN ('Emonc curriculum', 'Both')
      AND EXTRACT(YEAR FROM md.date_activated) = 2026
),
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
labor_monitoring AS (
    SELECT mct.mentee_id, COUNT(DISTINCT mct.topic) AS labor_monitoring_count
    FROM mentors.mentee_curriculum_tracking mct
    WHERE mct.mentorship_activity IN ('video_case_scenarios', 'videoa_case_scenarios','case_scenarios') 
      AND mct.topic IN ('Partograph%', 'Labor_Monitoring')
      AND EXTRACT(YEAR FROM mct.date_submitted) = 2026
    GROUP BY mct.mentee_id
)
SELECT 
    m.mentee_id,
    m.mentee_name,
    m.county,
    m.facility,
    COALESCE(cme.cme_count, 0) AS cme_count,
    COALESCE(drills.drill_count, 0) AS drill_count,
    COALESCE(skill_demos.skill_demos_count, 0) AS skill_demos_count,
    COALESCE(return_demos.return_demos_count, 0) AS return_demos_count,
    COALESCE(skill_eval.skill_eval_count, 0) AS skill_eval_count,
    COALESCE(skill_eval.average_score, 0) AS average_score,
    COALESCE(labor_monitoring.labor_monitoring_count, 0) AS labor_monitoring_count
FROM mentees m
LEFT JOIN cme ON m.mentee_id = cme.mentee_id
LEFT JOIN drills ON m.mentee_id = drills.mentee_id
LEFT JOIN skill_demos ON m.mentee_id = skill_demos.mentee_id
LEFT JOIN return_demos ON m.mentee_id = return_demos.mentee_id
LEFT JOIN skill_eval ON m.mentee_id = skill_eval.mentee_id
LEFT JOIN labor_monitoring ON m.mentee_id = labor_monitoring.mentee_id
