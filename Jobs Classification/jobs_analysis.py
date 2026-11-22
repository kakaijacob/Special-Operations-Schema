"""Revised job-classification analysis for the Client X capstone.

The first notebook labelled titles with very wide keywords (any title
containing "analyst", "engineer", "quality", or the letters "ai"), then
trained on a text field that still contained the label. The scores from
that setup are not a fair test of whether a posting's requirements say
which role it is.

This module:
1. Cleans the Google-search job extract.
2. Labels role families with specific phrases, using the phrase that
   appears first in the title.
3. Describes locations, boards, pay, and skills.
4. Trains the same five classifiers on the description after the role
   name has been removed, with tuning kept inside the training fold.
"""

from __future__ import annotations

import ast
import json
import re
import time
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.base import clone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier

CATEGORY_ORDER = [
    "Data Analyst",
    "Data Scientist",
    "Data Engineer",
    "Machine Learning and AI",
    "Data Governance and Quality",
    "Others",
]

PALETTE = {
    "Data Analyst": "#2F6F8F",
    "Data Scientist": "#C47B2B",
    "Data Engineer": "#3E7C59",
    "Machine Learning and AI": "#6B4C9A",
    "Data Governance and Quality": "#A34B5A",
    "Others": "#8A8175",
}

# Longer phrases are listed first so "data science" is not left inside
# "data scientist" when the description is masked.
ROLE_PHRASES = [
    "machine learning engineer",
    "data governance analyst",
    "data quality analyst",
    "business intelligence analyst",
    "business intelligence developer",
    "business intelligence",
    "analytics engineer",
    "data scientist",
    "data science",
    "data engineer",
    "data analyst",
    "business analyst",
    "machine learning",
    "artificial intelligence",
    "deep learning",
    "data steward",
    "data governance",
    "data quality",
    "ml engineer",
    "ai engineer",
    "bi analyst",
    "bi developer",
    "data platform",
    "data warehouse",
    "data architect",
    "data modeler",
]

CATEGORY_PATTERNS = [
    (
        "Machine Learning and AI",
        [
            r"machine learning",
            r"\bmlops\b",
            r"\bml engineer\b",
            r"\bai engineer\b",
            r"artificial intelligence",
            r"deep learning",
            r"\bnlp engineer\b",
            r"computer vision",
        ],
    ),
    (
        "Data Scientist",
        [
            r"data scientist",
            r"applied scientist",
            r"research scientist",
            r"data science",
        ],
    ),
    (
        "Data Engineer",
        [
            r"data engineer",
            r"analytics engineer",
            r"data platform",
            r"data architect",
            r"data modeler",
            r"data modeller",
            r"etl developer",
            r"etl engineer",
            r"\betl\b",
        ],
    ),
    (
        "Data Governance and Quality",
        [
            r"data governance",
            r"data quality",
            r"data steward",
            r"quality analyst",
            r"governance analyst",
        ],
    ),
    (
        "Data Analyst",
        [
            r"data analyst",
            r"data analytics",
            r"data analysis",
            r"data visualization",
            r"visualization analyst",
            r"business intelligence",
            r"\bbi analyst\b",
            r"\bbi developer\b",
            r"business analyst",
            r"business analysis",
            r"reporting analyst",
            r"insights analyst",
            r"analytics analyst",
            r"warehouse analyst",
        ],
    ),
]

STATE_ABBR = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
    "District of Columbia": "DC",
}
ABBR_TO_STATE = {abbr: name for name, abbr in STATE_ABBR.items()}

SKILL_NAMES = {
    "sql": "SQL",
    "python": "Python",
    "r": "R",
    "excel": "Excel",
    "tableau": "Tableau",
    "power_bi": "Power BI",
    "sas": "SAS",
    "spark": "Spark",
    "aws": "AWS",
    "azure": "Azure",
    "java": "Java",
    "scala": "Scala",
    "hadoop": "Hadoop",
    "snowflake": "Snowflake",
    "looker": "Looker",
    "qlik": "Qlik",
    "spss": "SPSS",
    "matlab": "MATLAB",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "git": "Git",
    "airflow": "Airflow",
    "kafka": "Kafka",
    "redshift": "Redshift",
    "bigquery": "BigQuery",
    "gcp": "GCP",
    "oracle": "Oracle",
    "sap": "SAP",
    "jira": "Jira",
    "powerpoint": "PowerPoint",
    "word": "Word",
    "go": "Go",
    "nosql": "NoSQL",
    "mongodb": "MongoDB",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "alteryx": "Alteryx",
    "ssis": "SSIS",
    "ssrs": "SSRS",
    "dax": "DAX",
    "pandas": "pandas",
    "numpy": "NumPy",
    "sklearn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    "dbt": "dbt",
    "kafka": "Kafka",
    "hive": "Hive",
    "databricks": "Databricks",
    "salesforce": "Salesforce",
    "sharepoint": "SharePoint",
    "vba": "VBA",
    "c": "C",
    "c++": "C++",
    "c#": "C#",
    "javascript": "JavaScript",
    "linux": "Linux",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "tensorflow": "TensorFlow",
    "keras": "Keras",
    "nlp": "NLP",
    "statistics": "Statistics",
    "matlab": "MATLAB",
}


def _style_axes():
    plt.rcParams.update(
        {
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "axes.edgecolor": "#444444",
            "axes.labelcolor": "#222222",
            "xtick.color": "#222222",
            "ytick.color": "#222222",
            "text.color": "#222222",
            "axes.spines.top": False,
            "axes.spines.right": False,
            "font.size": 11,
            "axes.titlesize": 13,
            "axes.titleweight": "regular",
            "figure.dpi": 140,
            "savefig.dpi": 140,
            "savefig.bbox": "tight",
        }
    )


def load_raw(data_dir: Path) -> pd.DataFrame:
    data_dir = Path(data_dir)
    single = data_dir / "gsearch_jobs.csv"
    if single.exists():
        frames = [pd.read_csv(single)]
        source = single.name
    else:
        files = sorted(data_dir.glob("gsearch_jobs_*.csv"))
        if not files:
            raise FileNotFoundError(
                f"No gsearch_jobs.csv or gsearch_jobs_*.csv files in {data_dir}"
            )
        frames = [pd.read_csv(path) for path in files]
        source = ", ".join(path.name for path in files)
    df = pd.concat(frames, ignore_index=True)
    df.attrs["source_files"] = source
    rename = {}
    if "job_location" in df.columns and "location" not in df.columns:
        rename["job_location"] = "location"
    if "data_job_id" in df.columns:
        rename["data_job_id"] = "row_id"
    if "idx" in df.columns and "index" not in df.columns:
        rename["idx"] = "index"
    return df.rename(columns=rename)


def _parse_tokens(value) -> list[str]:
    if not isinstance(value, str) or not value.strip():
        return []
    try:
        parsed = ast.literal_eval(value)
    except (ValueError, SyntaxError):
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item).strip().lower() for item in parsed if str(item).strip()]


def _primary_schedule(value) -> str:
    if pd.isna(value):
        return "Not stated"
    text = str(value).lower()
    for label, needle in (
        ("Full-time", "full-time"),
        ("Contract", "contractor"),
        ("Contract", "temp"),
        ("Internship", "intern"),
        ("Part-time", "part-time"),
    ):
        if needle in text:
            return label
    return "Other"


def _state_from_location(location: str) -> str | None:
    match = re.search(r",\s*([A-Z]{2})\b", location)
    if match and match.group(1) in ABBR_TO_STATE:
        return ABBR_TO_STATE[match.group(1)]
    if location in STATE_ABBR:
        return location
    return None


def _arrangement(location: str) -> str:
    if location == "Anywhere":
        return "Remote"
    if location.startswith("United States") or location == "":
        return "United States, city not listed"
    if location in STATE_ABBR:
        return "State named, no city"
    return "City named"


def categorize_title(title: str) -> str:
    """Assign the role family whose phrase appears earliest in the title."""
    text = title.lower()
    hits = []
    for category, patterns in CATEGORY_PATTERNS:
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                hits.append((match.start(), category))
                break
    if not hits:
        return "Others"
    # A passing mention of machine learning should not override the
    # occupation named in the same title. This extract was collected with
    # a data-analyst query, and the ML phrases are usually a tool, not the job.
    non_ml = [hit for hit in hits if hit[1] != "Machine Learning and AI"]
    if non_ml and any(hit[1] == "Machine Learning and AI" for hit in hits):
        hits = non_ml
    hits.sort(key=lambda item: item[0])
    return hits[0][1]


def mask_role_language(title: str, description: str) -> str:
    """Remove the job title and role-family phrases from the description.

    What is left is the language of duties and tools. That is the text
    the classifiers are allowed to see.
    """
    text = description.lower()
    # Punctuation is stripped first so "data-governance" and "data governance"
    # are the same phrase when the role name is removed.
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    title_key = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    title_key = re.sub(r"\s+", " ", title_key).strip()
    if len(title_key) > 3:
        text = text.replace(title_key, " ")
    for phrase in sorted(ROLE_PHRASES, key=len, reverse=True):
        text = text.replace(phrase, " ")
    return re.sub(r"\s+", " ", text).strip()


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    work = df.copy()
    n_raw = len(work)
    for column in ("title", "company_name", "location", "via", "description", "schedule_type"):
        if column not in work.columns:
            work[column] = np.nan
        work[column] = work[column].where(work[column].notna(), np.nan)
        work[column] = work[column].astype("string").str.replace(r"\s+", " ", regex=True).str.strip()
        work.loc[work[column].isin(["", "<NA>", "nan", "None"]), column] = pd.NA

    work["date_time"] = pd.to_datetime(work["date_time"], errors="coerce")
    work["description_tokens"] = work["description_tokens"].map(_parse_tokens) if "description_tokens" in work.columns else [[] for _ in range(len(work))]
    work["salary_standardized"] = pd.to_numeric(work.get("salary_standardized"), errors="coerce")

    before_drop = len(work)
    work = work.dropna(subset=["title", "description"]).copy()
    work = work[work["description"].str.split().str.len() >= 30].copy()
    dropped_short = before_drop - len(work)

    work["title_key"] = work["title"].str.lower()
    work["company_key"] = work["company_name"].fillna("").str.lower()
    work["location_key"] = work["location"].fillna("").str.lower()
    work["description_key"] = work["description"].str.lower().str.slice(0, 280)
    work = work.sort_values(["date_time"], kind="mergesort")
    before_dedup = len(work)
    work = work.drop_duplicates(
        ["title_key", "company_key", "location_key", "description_key"], keep="first"
    )
    n_duplicates = before_dedup - len(work)

    work["job_category"] = work["title"].map(categorize_title)
    work["board"] = (
        work["via"].fillna("Unknown").str.replace(r"(?i)^via\s+", "", regex=True).str.strip()
    )
    work["schedule"] = work["schedule_type"].map(_primary_schedule)
    work["location_clean"] = work["location"].fillna("")
    work["arrangement"] = work["location_clean"].map(_arrangement)
    work["state"] = work["location_clean"].map(_state_from_location)
    work["word_count"] = work["description"].str.split().str.len()
    work["text_model"] = [
        mask_role_language(title, description)
        for title, description in zip(work["title"], work["description"])
    ]
    # Pay is kept only when the annualised figure sits in a range that
    # a professional data role would actually advertise. Very wide hourly
    # ranges (for example 10 to 300 an hour) annualise to numbers that
    # are not a salary.
    pay = work["salary_standardized"]
    work["pay_for_plot"] = pay.where(pay.between(30000, 220000))

    notes = {
        "n_raw": int(n_raw),
        "dropped_short_or_blank": int(dropped_short),
        "duplicates_removed": int(n_duplicates),
        "n_clean": int(len(work)),
        "date_min": str(work["date_time"].min().date()) if work["date_time"].notna().any() else None,
        "date_max": str(work["date_time"].max().date()) if work["date_time"].notna().any() else None,
        "source_files": df.attrs.get("source_files", ""),
        "search_terms": work["search_term"].fillna("(blank)").value_counts().to_dict()
        if "search_term" in work.columns
        else {},
        "salary_listed_share": float(work["salary_standardized"].notna().mean()),
        "salary_in_range_share": float(work["pay_for_plot"].notna().mean()),
    }
    return work.reset_index(drop=True), notes


def _save(fig, path: Path):
    fig.savefig(path)
    plt.close(fig)


def make_figures(df: pd.DataFrame, fig_dir: Path) -> dict:
    _style_axes()
    fig_dir = Path(fig_dir)
    fig_dir.mkdir(parents=True, exist_ok=True)
    summary = {}

    counts = df["job_category"].value_counts().reindex(CATEGORY_ORDER).fillna(0).astype(int)
    summary["category_counts"] = {k: int(v) for k, v in counts.items()}
    summary["category_share"] = {k: round(float(v) / counts.sum(), 4) for k, v in counts.items()}

    fig, ax = plt.subplots(figsize=(8.4, 4.6))
    labels = list(counts.index)
    values = counts.values
    colors = [PALETTE[label] for label in labels]
    bars = ax.barh(labels[::-1], values[::-1], color=colors[::-1])
    total = values.sum()
    for bar, value in zip(bars, values[::-1]):
        ax.text(
            value + total * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{value:,}  ({value / total:.0%})",
            va="center",
            fontsize=10,
            color="#333333",
        )
    ax.set_xlabel("Postings")
    ax.set_title("Role family, from the title")
    ax.set_xlim(0, values.max() * 1.28)
    _save(fig, fig_dir / "01_role_families.png")

    # Titles that the rules did not recognise, so the Others bucket is visible.
    others = df.loc[df["job_category"] == "Others", "title"].value_counts().head(12)
    summary["others_top_titles"] = {str(k): int(v) for k, v in others.items()}
    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    ax.barh(others.index[::-1], others.values[::-1], color="#8A8175")
    ax.set_xlabel("Postings")
    ax.set_title("Most common titles left in Others")
    _save(fig, fig_dir / "02_other_titles.png")

    arrangement = df["arrangement"].value_counts()
    order = [
        "Remote",
        "City named",
        "United States, city not listed",
        "State named, no city",
    ]
    arrangement = arrangement.reindex([item for item in order if item in arrangement.index]).fillna(0)
    summary["arrangement"] = {k: int(v) for k, v in arrangement.items()}
    states = df["state"].dropna().value_counts()
    states = states[states >= 30]
    summary["top_states"] = {k: int(v) for k, v in states.items()}

    fig, axes = plt.subplots(1, 2, figsize=(10.2, 4.6), gridspec_kw={"width_ratios": [1, 1.15]})
    axes[0].barh(arrangement.index[::-1], arrangement.values[::-1], color="#2F6F8F")
    axes[0].set_title("Where the posting says the work is")
    axes[0].set_xlabel("Postings")
    axes[1].barh(states.index[::-1], states.values[::-1], color="#3E7C59")
    axes[1].set_title("States named on the posting")
    axes[1].set_xlabel("Postings")
    fig.tight_layout()
    _save(fig, fig_dir / "03_location.png")

    boards = df["board"].value_counts().head(12)
    summary["top_boards"] = {str(k): int(v) for k, v in boards.items()}
    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    ax.barh(boards.index[::-1], boards.values[::-1], color="#C47B2B")
    ax.set_xlabel("Postings")
    ax.set_title("Boards the advertisements were collected from")
    _save(fig, fig_dir / "04_job_boards.png")

    schedule_categories = [
        cat for cat in CATEGORY_ORDER if int((df["job_category"] == cat).sum()) >= 30
    ]
    schedule = (
        pd.crosstab(df["job_category"], df["schedule"], normalize="index")
        .reindex(schedule_categories)
        .fillna(0)
    )
    schedule_cols = [c for c in ["Full-time", "Contract", "Part-time", "Internship", "Not stated", "Other"] if c in schedule.columns]
    schedule = schedule[schedule_cols]
    fig, ax = plt.subplots(figsize=(8.6, 4.8))
    schedule.plot(
        kind="barh",
        stacked=True,
        ax=ax,
        color=["#2F6F8F", "#C47B2B", "#3E7C59", "#6B4C9A", "#D9D3C7", "#8A8175"],
        width=0.8,
    )
    ax.set_xlabel("Share of postings")
    ax.set_ylabel("")
    ax.set_title("Hours and contract type, by role family")
    ax.set_xlim(0, 1)
    ax.set_yticklabels(schedule.index)
    ax.legend(
        loc="upper center",
        bbox_to_anchor=(0.5, -0.18),
        ncol=3,
        frameon=False,
        title="",
    )
    _save(fig, fig_dir / "05_schedule.png")

    months = (
        df.dropna(subset=["date_time"])
        .assign(month=lambda frame: frame["date_time"].dt.to_period("M").dt.to_timestamp())
        .groupby("month")
        .size()
    )
    fig, ax = plt.subplots(figsize=(8.4, 4.2))
    ax.plot(months.index, months.values, color="#2F6F8F", marker="o", linewidth=1.8)
    ax.set_title("Postings by month in this extract")
    ax.set_ylabel("Postings")
    ax.set_xlabel("")
    fig.autofmt_xdate()
    _save(fig, fig_dir / "06_volume_by_month.png")

    pay = df.dropna(subset=["pay_for_plot"])
    pay_order = [cat for cat in CATEGORY_ORDER if (pay["job_category"] == cat).sum() >= 20]
    summary["salary_n"] = int(len(pay))
    summary["salary_median_by_category"] = {
        cat: round(float(pay.loc[pay["job_category"] == cat, "pay_for_plot"].median()), 0)
        for cat in pay_order
    }
    summary["salary_n_by_category"] = {
        cat: int((pay["job_category"] == cat).sum()) for cat in pay_order
    }
    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    sns.boxplot(
        data=pay,
        y="job_category",
        x="pay_for_plot",
        order=pay_order,
        hue="job_category",
        palette=PALETTE,
        legend=False,
        ax=ax,
        fliersize=2,
        linewidth=0.8,
    )
    ax.set_xlabel("Annualised pay, US dollars")
    ax.set_ylabel("")
    ax.set_title("Posted pay, where a figure was given and looked usable")
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{int(v/1000)}k"))
    _save(fig, fig_dir / "07_salary.png")

    # Skills. Keep a posting id so a tool used in many advertisements
    # is not collapsed into a single row.
    skill_rows = df[["job_category", "description_tokens"]].copy()
    skill_rows["posting_id"] = np.arange(len(skill_rows))
    skill_rows = skill_rows.explode("description_tokens")
    skill_rows = skill_rows.dropna(subset=["description_tokens"])
    skill_rows = skill_rows.rename(columns={"description_tokens": "skill"})
    skill_rows = skill_rows.drop_duplicates(["posting_id", "skill"])
    overall = skill_rows["skill"].value_counts()
    top_skills = [skill for skill in overall.head(12).index]
    summary["top_skills"] = [
        {"skill": SKILL_NAMES.get(skill, skill), "postings": int(overall[skill])}
        for skill in top_skills
    ]
    heat_categories = [
        cat for cat in CATEGORY_ORDER if int((df["job_category"] == cat).sum()) >= 30
    ]
    presence = (
        skill_rows[skill_rows["skill"].isin(top_skills)]
        .groupby(["job_category", "skill"])
        .size()
        .unstack(fill_value=0)
        .reindex(heat_categories)
        .fillna(0)
    )
    denominators = df["job_category"].value_counts().reindex(heat_categories)
    share = presence.div(denominators, axis=0).astype(float)
    share = share[top_skills]
    share.columns = [SKILL_NAMES.get(col, col) for col in share.columns]
    summary["skill_share"] = {
        cat: {skill: round(float(share.loc[cat, skill]), 4) for skill in share.columns}
        for cat in share.index
    }

    fig, ax = plt.subplots(figsize=(10.2, 5.2))
    sns.heatmap(
        share,
        ax=ax,
        cmap="YlGnBu",
        annot=True,
        fmt=".0%",
        linewidths=0.4,
        linecolor="white",
        cbar_kws={"label": "Share of postings"},
        vmin=0,
        vmax=max(0.75, float(share.max().max())),
    )
    ax.set_title("Tools named in the posting, by role family")
    ax.set_xlabel("")
    ax.set_ylabel("")
    _save(fig, fig_dir / "08_skills_heatmap.png")

    distinctive = {}
    fig, axes = plt.subplots(2, 2, figsize=(10.2, 7.2))
    focus = ["Data Analyst", "Data Scientist", "Data Engineer", "Data Governance and Quality"]
    for ax, category in zip(axes.ravel(), focus):
        in_cat = skill_rows.loc[skill_rows["job_category"] == category, "skill"].value_counts()
        n_cat = int((df["job_category"] == category).sum())
        kept = in_cat[in_cat >= 10].head(6)
        distinctive[category] = [
            {
                "skill": SKILL_NAMES.get(skill, skill),
                "postings": int(in_cat[skill]),
                "share": round(float(in_cat[skill] / n_cat), 4),
            }
            for skill in kept.index
        ]
        pretty = [SKILL_NAMES.get(skill, skill) for skill in kept.index]
        ax.barh(pretty[::-1], (kept / n_cat).values[::-1], color=PALETTE[category])
        ax.set_xlim(0, 1)
        ax.set_title(category)
        ax.set_xlabel("Share of postings in the family")
    fig.suptitle("Tools most often named in each role family", y=1.01)
    fig.tight_layout()
    _save(fig, fig_dir / "09_distinctive_skills.png")
    summary["distinctive_skills"] = distinctive

    companies = df["company_name"].fillna("Unknown").value_counts().head(10)
    summary["top_companies"] = {str(k): int(v) for k, v in companies.items()}
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    ax.barh(companies.index[::-1], companies.values[::-1], color="#2F6F8F")
    ax.set_xlabel("Postings")
    ax.set_title("Employers with the most postings in the extract")
    _save(fig, fig_dir / "10_companies.png")

    # A short audit of the label rules.
    audit = {}
    for category in CATEGORY_ORDER:
        sample = (
            df.loc[df["job_category"] == category, "title"]
            .drop_duplicates()
            .head(8)
            .tolist()
        )
        audit[category] = sample
    summary["label_examples"] = audit
    return summary


def _score(y_true, y_pred) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "macro_precision": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
    }


def _vectorizer() -> TfidfVectorizer:
    return TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=5,
        max_df=0.95,
        max_features=4000,
        sublinear_tf=True,
    )


def train_models(df: pd.DataFrame, random_state: int = 42) -> dict:
    data = df[df["text_model"].str.len() >= 40].copy()
    counts = data["job_category"].value_counts()
    rare = counts[counts < 25].index.tolist()
    if rare:
        data.loc[data["job_category"].isin(rare), "job_category"] = "Others"
    X = data["text_model"]
    y = data["job_category"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )

    majority = y_train.mode().iloc[0]
    baseline_pred = np.full(shape=len(y_test), fill_value=majority)
    results = [
        {
            "model": "Majority class",
            "params": {"class": str(majority)},
            "cv_macro_f1": None,
            **_score(y_test, baseline_pred),
        }
    ]

    specs = [
        (
            "Naive Bayes",
            MultinomialNB(),
            {"clf__alpha": [0.1, 0.5, 1.0]},
        ),
        (
            "Support Vector Machine",
            LinearSVC(class_weight="balanced", dual="auto", random_state=random_state),
            {"clf__C": [0.25, 1.0, 4.0]},
        ),
        (
            "Logistic Regression",
            LogisticRegression(
                class_weight="balanced",
                max_iter=400,
                solver="lbfgs",
                random_state=random_state,
            ),
            {"clf__C": [0.3, 1.0, 3.0]},
        ),
        (
            "Decision Tree",
            DecisionTreeClassifier(class_weight="balanced", random_state=random_state),
            {"clf__max_depth": [8, 16, 32], "clf__min_samples_leaf": [10]},
        ),
        (
            "Random Forest",
            RandomForestClassifier(
                n_estimators=120,
                class_weight="balanced_subsample",
                n_jobs=1,
                random_state=random_state,
            ),
            {"clf__max_depth": [16, 32], "clf__min_samples_leaf": [5]},
        ),
    ]

    fitted = {}
    labels = sorted(y.unique(), key=lambda label: CATEGORY_ORDER.index(label) if label in CATEGORY_ORDER else 99)
    reports = {}
    for name, estimator, grid in specs:
        started = time.time()
        pipe = Pipeline([("tfidf", _vectorizer()), ("clf", estimator)])
        search = GridSearchCV(
            pipe,
            grid,
            cv=3,
            scoring="f1_macro",
            n_jobs=-1,
            refit=True,
        )
        search.fit(X_train, y_train)
        pred = search.predict(X_test)
        row = {
            "model": name,
            "params": {key.split("__", 1)[-1]: value for key, value in search.best_params_.items()},
            "cv_macro_f1": round(float(search.best_score_), 4),
            **_score(y_test, pred),
            "seconds": round(time.time() - started, 1),
        }
        results.append(row)
        fitted[name] = search.best_estimator_
        reports[name] = classification_report(
            y_test, pred, labels=labels, output_dict=True, zero_division=0
        )
        print(
            f"{name}: macro F1 {row['macro_f1']:.3f}  accuracy {row['accuracy']:.3f}  "
            f"cv {row['cv_macro_f1']:.3f}  {row['seconds']}s  {row['params']}"
        )

    ranked = sorted(results, key=lambda row: row["macro_f1"], reverse=True)
    best_name = next(row["model"] for row in ranked if row["model"] != "Majority class")
    # Prefer the best linear model for a readable confusion matrix if it is
    # within 0.01 macro F1 of the leader. Trees rarely win this text task,
    # and when they do the linear model is the one we can read.
    best = fitted[best_name]
    pred = best.predict(X_test)
    matrix = confusion_matrix(y_test, pred, labels=labels)
    per_class = []
    report = reports[best_name]
    for label in labels:
        cell = report[label]
        per_class.append(
            {
                "category": label,
                "precision": round(float(cell["precision"]), 4),
                "recall": round(float(cell["recall"]), 4),
                "f1": round(float(cell["f1-score"]), 4),
                "support": int(cell["support"]),
            }
        )

    # Terms the linear model leans on. Fit logistic regression at its chosen C
    # even if another model won, so the report can say what the text is using.
    logistic = fitted["Logistic Regression"]
    vectorizer = logistic.named_steps["tfidf"]
    classifier = logistic.named_steps["clf"]
    feature_names = np.array(vectorizer.get_feature_names_out())
    term_table = {}
    for index, label in enumerate(classifier.classes_):
        coef = classifier.coef_[index]
        top_index = np.argsort(coef)[-10:][::-1]
        term_table[str(label)] = [
            {"term": feature_names[i], "weight": round(float(coef[i]), 3)} for i in top_index
        ]

    return {
        "n_model_rows": int(len(data)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "rare_folded_into_others": rare,
        "results": results,
        "best_model": best_name,
        "labels": labels,
        "confusion_matrix": matrix.tolist(),
        "per_class": per_class,
        "logistic_terms": term_table,
        "test_share": 0.2,
    }


def plot_model_results(model_info: dict, fig_dir: Path):
    _style_axes()
    fig_dir = Path(fig_dir)
    table = pd.DataFrame(model_info["results"]).sort_values("macro_f1", ascending=True)
    fig, ax = plt.subplots(figsize=(8.6, 4.6))
    y = np.arange(len(table))
    ax.barh(y + 0.16, table["macro_f1"], height=0.32, color="#2F6F8F", label="Macro F1")
    ax.barh(y - 0.16, table["accuracy"], height=0.32, color="#C47B2B", label="Accuracy")
    ax.set_yticks(y)
    ax.set_yticklabels(table["model"])
    ax.set_xlim(0, 1)
    ax.set_xlabel("Score on the held-out 20 percent")
    ax.set_title("Classifiers, after the role name is removed from the text")
    ax.legend(frameon=False, loc="lower right")
    _save(fig, fig_dir / "11_model_comparison.png")

    labels = model_info["labels"]
    matrix = np.array(model_info["confusion_matrix"], dtype=float)
    row_sums = matrix.sum(axis=1, keepdims=True)
    share = np.divide(matrix, row_sums, out=np.zeros_like(matrix), where=row_sums > 0)
    fig, ax = plt.subplots(figsize=(8.2, 6.4))
    sns.heatmap(
        share,
        ax=ax,
        cmap="Blues",
        annot=True,
        fmt=".0%",
        xticklabels=labels,
        yticklabels=labels,
        vmin=0,
        vmax=1,
        linewidths=0.4,
        linecolor="white",
        cbar_kws={"label": "Share of the true class"},
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True role family")
    ax.set_title(f"Where {model_info['best_model']} puts each posting")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    _save(fig, fig_dir / "12_confusion_matrix.png")

    per_class = pd.DataFrame(model_info["per_class"])
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    ax.barh(per_class["category"][::-1], per_class["f1"][::-1], color=[PALETTE.get(c, "#888") for c in per_class["category"][::-1]])
    ax.set_xlim(0, 1)
    ax.set_xlabel("F1 on the held-out postings")
    ax.set_title(f"F1 by role family, {model_info['best_model']}")
    _save(fig, fig_dir / "13_f1_by_family.png")


def run(data_dir: Path, out_dir: Path) -> dict:
    out_dir = Path(out_dir)
    fig_dir = out_dir / "figures"
    print("Loading", data_dir)
    raw = load_raw(data_dir)
    print("Raw shape", raw.shape)
    df, notes = clean(raw)
    print(
        f"Clean rows {notes['n_clean']:,}  "
        f"(dropped {notes['dropped_short_or_blank']:,} short, "
        f"{notes['duplicates_removed']:,} repeats)"
    )
    print(df["job_category"].value_counts())
    summary = make_figures(df, fig_dir)
    print("Training")
    model_info = train_models(df)
    plot_model_results(model_info, fig_dir)
    payload = {"cleaning": notes, "summary": summary, "models": model_info}
    # Confusion matrix is already a list. Drop nothing else; the payload is JSON safe.
    destination = out_dir / "results.json"
    destination.write_text(json.dumps(payload, indent=2))
    print("Wrote", destination)
    print("Best model:", model_info["best_model"])
    return payload


if __name__ == "__main__":
    import os

    data = Path(os.environ.get("JOBS_DATA_DIR", "/tmp/jobs-class/data"))
    output = Path(os.environ.get("JOBS_OUT_DIR", Path(__file__).resolve().parent))
    run(data, output)
