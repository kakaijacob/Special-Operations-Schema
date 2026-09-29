{#
  Schema naming (Kenya mentors):

  - Outside prod (dev_andrew, personal schemas): ignore custom schema
    suffixes so everything lands in DBT_USER_SCHEMA.
  - In prod (dbt_mentors_gold): apply per-layer suffixes from +schema
    only when a model sets +schema (default layers stay in dbt_mentors_gold).
#}
{% macro generate_schema_name(custom_schema_name, node) -%}
  {%- set default_schema = target.schema -%}
  {%- set prod_schema = "dbt_mentors_gold" -%}
  {%- if custom_schema_name is none -%}
    {{ default_schema }}
  {%- elif default_schema == prod_schema -%}
    {{ default_schema }}_{{ custom_schema_name | trim }}
  {%- else -%}
    {{ default_schema }}
  {%- endif -%}
{%- endmacro %}
