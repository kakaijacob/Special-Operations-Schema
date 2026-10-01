-- Mirrors Power BI DAX AVERAGEX over individual mentee progress:
--   per mentee: sum of MIN(count, req) components + (average_score >= 0.85)
--   divided by (13+5+20+20+20+1+1), then averaged across mentees.
-- Caps match Cohort 2+ EmONC requirements used in the inspection report.

{% set req_cme = var('emonc_individual_req_cme', 13) | int %}
{% set req_drills = var('emonc_individual_req_drills', 5) | int %}
{% set req_skill_demos = var('emonc_individual_req_skill_demos', 20) | int %}
{% set req_return_demos = var('emonc_individual_req_return_demos', 20) | int %}
{% set req_skill_eval = var('emonc_individual_req_skill_eval', 20) | int %}
{% set req_labor = var('emonc_individual_req_labor', 1) | int %}
{% set req_avg_score_point = 1 %}
{% set required_points = req_cme + req_drills + req_skill_demos + req_return_demos + req_skill_eval + req_avg_score_point + req_labor %}

with mentee_ratios as (

    select
        progress_year,
        mentee_id,
        toFloat64(
            least(cme_count, {{ req_cme }})
            + least(drill_count, {{ req_drills }})
            + least(skill_demos_count, {{ req_skill_demos }})
            + least(return_demos_count, {{ req_return_demos }})
            + least(skill_eval_count, {{ req_skill_eval }})
            + if(average_score >= 0.85, 1, 0)
            + least(labor_monitoring_count, {{ req_labor }})
        ) as capped_progress_points,
        toFloat64({{ required_points }}) as required_points,
        if(
            {{ required_points }} = 0,
            toFloat64(0),
            toFloat64(
                least(cme_count, {{ req_cme }})
                + least(drill_count, {{ req_drills }})
                + least(skill_demos_count, {{ req_skill_demos }})
                + least(return_demos_count, {{ req_return_demos }})
                + least(skill_eval_count, {{ req_skill_eval }})
                + if(average_score >= 0.85, 1, 0)
                + least(labor_monitoring_count, {{ req_labor }})
            ) / toFloat64({{ required_points }})
        ) as mentee_progress_ratio
    from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}

)

select
    progress_year,
    count() as mentee_count,
    toUInt16({{ required_points }}) as required_points,
    round(avg(mentee_progress_ratio), 3) as individual_mentee_emonc_curriculum_progress,
    round(avg(capped_progress_points), 3) as avg_capped_progress_points
from mentee_ratios
group by progress_year
order by progress_year
