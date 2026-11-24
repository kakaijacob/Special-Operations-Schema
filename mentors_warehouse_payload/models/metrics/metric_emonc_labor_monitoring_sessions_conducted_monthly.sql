-- Labor-monitoring sessions (case/video scenarios on Partograph / Labor Monitoring topics).
select
    toStartOfMonth(toDate(submitted_at)) as month_start,
    countDistinct(submission_id) as labor_monitoring_sessions_conducted,
    countDistinct(mentee_id) as mentees_reached,
    countDistinct(nullIf(facility_code, '')) as facilities_reached
from {{ ref('stg_processed__emonc_curriculum_tracking') }}
where mentorship_activity in (
        'video_case_scenarios',
        'videoa_case_scenarios',
        'case_scenarios'
    )
  and (
      startsWith(coalesce(topic, ''), 'Partograph')
      or topic in ('Labor_Monitoring', 'Labor Monitoring')
  )
  and submitted_at is not null
group by month_start
order by month_start
