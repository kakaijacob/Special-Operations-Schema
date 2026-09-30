-- Anticipatory stub: QuIPS / quality intrapartum care surveillance.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at
where 1 = 0

{% else %}

select * from {{ source('kobotoolbox', 'quality_intrapartum_care_surveillance_submissions') }}

{% endif %}
