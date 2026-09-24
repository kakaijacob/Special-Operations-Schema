# Push jacaranda_mentors scaffold into mentors_warehouse

From your laptop (you have write access):

```bash
cd ~/projects
git clone https://github.com/kakaijacob/mentors_warehouse.git
cd mentors_warehouse

# Pull scaffold from Special-Operations-Schema
git clone --depth 1 --branch cursor/jacaranda-mentors-scaffold-bea8 \
  https://github.com/kakaijacob/Special-Operations-Schema.git /tmp/sos-scaffold

cp -a /tmp/sos-scaffold/mentors_warehouse_repo/. .

git add -A
git commit -m "Scaffold jacaranda_mentors (warehouse_mentors_ke)"
git branch -M main
git push -u origin main
```

Or copy from an existing Special-Operations-Schema checkout on that branch:

```bash
cp -a ~/projects/Special-Operations-Schema/mentors_warehouse_repo/. ~/projects/mentors_warehouse/
```
