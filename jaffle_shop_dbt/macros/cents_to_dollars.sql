{% macro cents_to_dollars(column_name, precision=2) %}
    (toFloat64OrZero(toString({{ column_name }})) / 100)::Decimal(16, {{ precision }})
{% endmacro %}
