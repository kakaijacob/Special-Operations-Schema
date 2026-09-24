-- Run as a ClickHouse admin (not jh_dna_dev) so local dbt can work.
-- Adjust username if different.

CREATE DATABASE IF NOT EXISTS dev_wanyama;

-- Minimum for dbt-clickhouse against one dev database:
GRANT SHOW ON *.* TO jh_dna_dev;

GRANT SELECT, INSERT, ALTER, CREATE TABLE, CREATE VIEW, DROP TABLE, DROP VIEW, TRUNCATE, SHOW TABLES
ON dev_wanyama.* TO jh_dna_dev;

-- Optional: if dbt must create the database itself
-- GRANT CREATE DATABASE ON *.* TO jh_dna_dev;

-- Verify
SHOW GRANTS FOR jh_dna_dev;
