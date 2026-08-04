# Kobo-Tool-Builder
A comprehensive Java Script for creating, cleaning and structuring Kobo survey and choices sheets

Building or changing a form? Start with
[KOBO_FORM_BUILDING_GUIDE.md](KOBO_FORM_BUILDING_GUIDE.md) — how the pipeline
fits together, how to add a new form, and the rules that came out of real
deployment failures. Shared guards for new builders live in
`Kobo_Form_Kit.js`.

Run the whole pipeline with `refreshAllKoboTools()`; check a build without
deploying with `checkAllKoboFormsForDeployProblems()`.
