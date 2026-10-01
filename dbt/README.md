# Anticipatory dbt project for Kenya mentors warehouse.
# See ../dbt_modelling for source inventory, layering rules, and mart map.
#
# Default: use_sample_seeds=true so models compile without ClickHouse.
# Flip the var and wire columns after DESCRIBE on googlesheets / kobotoolbox.

name: jacaranda_mentors
