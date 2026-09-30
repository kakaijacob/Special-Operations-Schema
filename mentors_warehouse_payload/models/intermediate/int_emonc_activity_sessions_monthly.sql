-- EmONC curriculum sessions by calendar month and mentorship activity.
-- Session = distinct submission_id (one Kobo form submit can cover many topics).

select
    toStartOfMonth(toDate(submitted_at)) as month_start,
    mentorship_activity,
    countDistinct(submission_id) as sessions_conducted,
    countDistinct(mentee_id) as mentees_reached,
    countDistinct(nullIf(facility_code, '')) as facilities_reached,
    count() as activity_topic_rows
from {{ ref('stg_processed__emonc_curriculum_tracking') }}
where submitted_at is not null
  and mentorship_activity is not null
group by
    month_start,
    mentorship_activity
order by
    month_start,
    mentorship_activity
