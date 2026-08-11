{% macro sentence_case(column) %}
    concat(
        upperUTF8(substringUTF8({{ column }}, 1, 1)),
        lowerUTF8(substringUTF8({{ column }}, 2))
    )
{%- endmacro %}


{#
    Google Sheets exports dates inconsistently. Accept DD/MM/YYYY and let
    ClickHouse handle ISO-style values, returning NULL when unparseable.
#}
{% macro parse_sheet_date(column) %}
    if(
        match({{ column }}, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'),
        toDateOrNull(concat(
            substring({{ column }}, 7, 4), '-',
            substring({{ column }}, 4, 2), '-',
            substring({{ column }}, 1, 2)
        )),
        toDateOrNull({{ column }})
    )
{%- endmacro %}
