{#
    Resolve a human-readable source column name to the identifier that actually
    exists in the relation. Airbyte rewrites sheet headers unpredictably (spaces
    become underscores, punctuation such as "?" and "-" may be dropped), so
    matching is done on letters and digits only.
#}

{% macro normalize_identifier(value) %}
    {%- set lowered = value | lower -%}
    {%- set characters = [] -%}
    {%- for character in lowered -%}
        {%- if character.isalnum() -%}
            {%- do characters.append(character) -%}
        {%- endif -%}
    {%- endfor -%}
    {{- characters | join('') -}}
{% endmacro %}


{% macro resolve_column(relation, column_name) %}
    {%- if not execute -%}
        {{ return(adapter.quote(column_name)) }}
    {%- endif -%}

    {%- set available = adapter.get_columns_in_relation(relation) -%}
    {%- set target = normalize_identifier(column_name) | trim -%}

    {%- for column in available -%}
        {%- if normalize_identifier(column.name) | trim == target -%}
            {{ return(adapter.quote(column.name)) }}
        {%- endif -%}
    {%- endfor -%}

    {%- set names = available | map(attribute='name') | list -%}
    {{ exceptions.raise_compiler_error(
        "No column in " ~ relation ~ " matches '" ~ column_name
        ~ "'. Columns present: " ~ (names | join(', '))
    ) }}
{% endmacro %}
