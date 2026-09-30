-- Individual EmONC curriculum progress for mentees activated in the progress year.
-- Grain: one row per mentee_id (not cohort-aware).
-- Counts distinct topics / skills submitted in the progress year.
-- Partograph skill evaluations are excluded.
--
-- Override year: dbt run --vars '{"emonc_progress_year": 2026}'

{% set progress_year = var('emonc_progress_year', 2026) | int %}

with mentees as (

    select
        mentee_id,
        mentee_name,
        county,
        facility,
        facility_code,
        date_activated
    from {{ ref('int_mentee_database') }}
    where lowerUTF8(trim(program)) in ('emonc curriculum', 'both')
      and toYear(date_activated) = {{ progress_year }}

),

cme as (

    select
        mentee_id,
        countDistinct(topic) as cme_count
    from {{ ref('stg_processed__emonc_curriculum_tracking') }}
    where mentorship_activity = 'cmes'
      and topic is not null
      and toYear(toDate(submitted_at)) = {{ progress_year }}
    group by mentee_id

),

drills as (

    select
        mentee_id,
        countDistinct(topic) as drill_count
    from {{ ref('stg_processed__emonc_curriculum_tracking') }}
    where mentorship_activity = 'drills'
      and topic is not null
      and toYear(toDate(submitted_at)) = {{ progress_year }}
    group by mentee_id

),

skill_demos as (

    select
        mentee_id,
        countDistinct(topic) as skill_demos_count
    from {{ ref('stg_processed__emonc_curriculum_tracking') }}
    where mentorship_activity = 'skill_demos_mentor'
      and topic is not null
      and toYear(toDate(submitted_at)) = {{ progress_year }}
    group by mentee_id

),

return_demos as (

    select
        mentee_id,
        countDistinct(topic) as return_demos_count
    from {{ ref('stg_processed__emonc_curriculum_tracking') }}
    where mentorship_activity = 'skills_demos_mentee'
      and topic is not null
      and toYear(toDate(submitted_at)) = {{ progress_year }}
    group by mentee_id

),

skill_eval as (

    select
        mentee_id,
        countDistinct(skill_evaluation) as skill_eval_count,
        avg(average_score) as average_score
    from {{ ref('stg_processed__moh_skills_assessment') }}
    where toYear(toDate(submitted_at)) = {{ progress_year }}
      and skill_evaluation is not null
      and lowerUTF8(trim(skill_evaluation)) <> 'partograph'
    group by mentee_id

),

labor_monitoring as (

    select
        mentee_id,
        countDistinct(topic) as labor_monitoring_count
    from {{ ref('stg_processed__emonc_curriculum_tracking') }}
    where mentorship_activity in (
            'video_case_scenarios',
            'videoa_case_scenarios',
            'case_scenarios'
        )
      -- Source SQL used IN ('Partograph%', ...); treat as prefix + Labor Monitoring aliases.
      and (
          startsWith(topic, 'Partograph')
          or topic in ('Labor_Monitoring', 'Labor Monitoring')
      )
      and toYear(toDate(submitted_at)) = {{ progress_year }}
    group by mentee_id

)

select
    m.mentee_id,
    m.mentee_name,
    m.county,
    m.facility,
    m.facility_code,
    m.date_activated,
    toUInt16({{ progress_year }}) as progress_year,
    coalesce(cme.cme_count, 0) as cme_count,
    coalesce(drills.drill_count, 0) as drill_count,
    coalesce(skill_demos.skill_demos_count, 0) as skill_demos_count,
    coalesce(return_demos.return_demos_count, 0) as return_demos_count,
    coalesce(skill_eval.skill_eval_count, 0) as skill_eval_count,
    coalesce(skill_eval.average_score, 0) as average_score,
    coalesce(labor_monitoring.labor_monitoring_count, 0) as labor_monitoring_count
from mentees m
left join cme
    on m.mentee_id = cme.mentee_id
left join drills
    on m.mentee_id = drills.mentee_id
left join skill_demos
    on m.mentee_id = skill_demos.mentee_id
left join return_demos
    on m.mentee_id = return_demos.mentee_id
left join skill_eval
    on m.mentee_id = skill_eval.mentee_id
left join labor_monitoring
    on m.mentee_id = labor_monitoring.mentee_id
order by m.mentee_id
