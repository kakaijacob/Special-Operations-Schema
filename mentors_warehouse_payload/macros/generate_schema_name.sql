{#
  Schema naming (Kenya mentors parity with Ghana warehouse pattern):

  - Outside prod schema (dev_wanyama, personal schemas): ignore custom schema
    suffixes so everything lands in DBT_USER_SCHEMA.
  - In prod (dbt_mentors_ke): apply per-layer suffixes from +schema
    (e.g. marts +schema: gold → dbt_mentors_ke_gold).
#}
{% macro generate_schema_name(custom_schema_name, node) -%}
  {%- set default_schema = target.schema -%}
  {%- set prod_schema = "dbt_mentors_ke" -%}
  {%- if custom_schema_name is none -%}
    {{ default_schema }}
  {%- elif default_schema == prod_schema -%}
    {{ default_schema }}_{{ custom_schema_name | trim }}
  {%- else -%}
    {{ default_schema }}
  {%- endif -%}
{%- endmacro %}
