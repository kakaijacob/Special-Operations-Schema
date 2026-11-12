# Apply to Jacaranda-Health/mentors_warehouse

```bash
git clone https://github.com/Jacaranda-Health/mentors_warehouse.git
cd mentors_warehouse
git checkout develop && git pull
git checkout -b feature/emonc-newborn-dbt-models
cp -a /path/to/mentors_warehouse_payload/. .
git add -A
git commit -m "Add EmONC and newborn curriculum dbt models (staging through metrics)"
git push -u origin feature/emonc-newborn-dbt-models
# PR → develop
```
