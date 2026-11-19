# QuIPS Analysis Export and Data Sharing
#
# The Matrix Scorecards analysis, written out to Google Sheets from Colab.
#
# What you get each report month
#   one spreadsheet per county, inside a month folder
#   Index                  deliveries, links, facilities with no submission
#   All facilities         county roll-up
#   one tab per facility   that submitted that month
#
# On every data tab the sections run first to last, in dashboard order:
#   Overview, Key QuIPS indicators, Birth Preparedness, Labor Care Guide,
#   Partograph Review, Technical Quality After Birth,
#   Maternal Vitals & Documentation, Postbirth Infection Prevention,
#   Respectful Maternity Care, Avoidance of Harmful Practices,
#   Harmful Practices (% with instance), EMOTIVE,
#   uterotonic mix, blood-loss mix.
#
# Score and Status cover every submission from the first month through the
# report month. The highlighted column is the report month. Trend compares
# it with the previous month. Cadre and complication stay on All.
#
# Run it from the companion notebook in Google Colab:
#   QuIPS Analysis Export and Data Sharing.ipynb
# Edit REPORT_MONTH, DESTINATION_FOLDER_ID and SHARE_WITH in the last cell.

from collections import Counter
from datetime import datetime
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

DATA_URL = (
    'https://docs.google.com/spreadsheets/d/e/'
    '2PACX-1vRPEUzmFeJeSDdQySj9OinUnelYoHGaWtVaU0UIaKJU0v4UZoGp3VSTnlroBkl6GDmW1YZ9w1y4bAIY/'
    'pub?gid=1114469965&single=true&output=csv'
)
TIMEZONE = 'Africa/Nairobi'
ROOT_FOLDER_NAME = 'QuIPS Analysis Export and Data Sharing'

# Set by prepare_data(). make_rows reads its columns, same as the dashboard.
df = None

# ---------------------------------------------------------------------------
# Scoring rules from the Matrix Scorecards dashboard
# ---------------------------------------------------------------------------

invalid_values = ["", "Unable to observe", "Not applicable", "NA", "N/A", "Resuscitation required", "Not taken"]

blood_loss_valid_lower = [v.lower() for v in [
    "Measure with a calibrated jar", "V drape", "Weighing of bloodsoaked materials"]]

frequency_cols = ["provider_explanations", "spoken_to_directly", "spoken_to_kindly"]
harm_avoidance_cols = ['fundal_pressure', 'perineum_stretching', 'newborn_slapped', 'newborn_upside_down']
inverted_cols = harm_avoidance_cols + ['partograph_accuracy_concern', 'lcg_accuracy_concerns']

birth_preparedness_ind = {
    'hand_hygiene': 'Hand Hygiene',
    'ppe_gloves': 'PPE Gloves',
    'ppe_mask': 'PPE Mask',
    'ppe_gown': 'PPE Gown',
    'ppe_boots': 'PPE Boots',
    'ppe_goggles': 'PPE Goggles',
    'ppe_cap': 'PPE Cap',
    'nnr_equipment_preparation': 'Preparation of NNR Equipment',
    'uterotonic_preparation': 'Uterotonic Preparation',
}
lcg_ind = {
    'lcg_initiated_correct': 'LCG initiated at correct time',
    'contractions_monitored_1st': 'Contractions recorded first stage',
    'fhr_monitored_1st': 'Foetal heart recorded first stage',
    'bp_monitored_recorded': 'Blood pressure correctly recorded',
    'contractions_monitored_2nd': 'Contractions recorded second stage',
    'fhr_monitored_2nd': 'Foetal heart recorded second stage',
    'delivery_time_documented': 'Delivery time correctly documented',
    'delivery_method_documented': 'Delivery method correctly documented',
    'ebl_documented_correctly': 'Blood loss correctly documented',
    'lcg_accuracy_concerns': 'No data accuracy concerns',
}
partograph_ind = {
    'partogragh_initiation': 'Partograph initiated at correct time',
    'partograph_half_hr': 'Contractions recorded every 30 minutes',
    'fetal_heart_correct': 'Foetal heart rate correctly recorded',
    'maternal_pulse_correct': 'Maternal pulse correctly recorded',
    'bp_4hrs': 'Blood pressure recorded every 4 hours',
    'partograph_summary_filled': 'Partograph completed after delivery',
    'delivery_method_filled': 'Delivery method correctly documented',
    'blood_loss_estimation': 'Estimated blood loss correctly recorded',
    'partograph_accuracy_concern': 'No data accuracy concerns',
}
tqab_ind = {
    'ruleout_twin': 'Ruling out second twin',
    'uterotonic_administered': 'Uterotonic administration',
    'timely_uterotonic_administration': 'Timely administration of uterotonics',
    'drying_stimulation': 'Baby dried and stimulated',
    'discard_wet_towel': 'Wet towel discarded',
    'skin_to_skin': 'Skin-to-skin initiated',
    'adequate_skin_to_skin_time': 'Adequate skin-to-skin duration',
    'timely_cord_clamp': 'Timely cord clamping',
    'sterilized_blade_clamp': 'Use of sterilized blade for cord cut',
    'newborn_kept_warm': 'Newborn kept warm for resuscitation or stimulation',
    'controlled_cord_traction': 'Use of controlled cord traction placenta delivery',
    'placenta_examination': 'Placenta examination postbirth',
    'uterine_tone_assessed': 'Uterine tone assessed',
    'laceration_check': 'Birth canal checked for lacerations',
    'method_blood_loss': 'Objective method of estimating blood loss used',
    'proper_vdrape_use': 'V drape used appropriately',
    'maternal_bleeding_assessed': 'Maternal bleeding assessed',
    'administer_vitamin_k': 'Vitamin K administered',
    'timely_vitamink_administration': 'Timely administration of Vitamin K',
    'provider_initiate_breastfeeding': 'Breastfeeding initiated',
    'timely_breastfeeding_initiation': 'Timely initiation of breastfeeding',
    'take_mother_bp': 'Maternal blood pressure taken',
    'timely_mother_bp': 'Timely maternal blood pressure measurement',
    'take_mother_temperature': 'Maternal temperature taken',
    'timely_mother_temp': 'Timely maternal temperature measurement',
    'take_mother_pulse': 'Maternal pulse taken',
    'timely_mother_pulse': 'Timely maternal pulse measurement',
    'apgar_min1': 'Apgar score documented at 1 minute',
    'apgar_min5': 'Apgar score documented at 5 minutes',
}
vitals_ind = {
    'take_mother_bp': 'Mother BP taken',
    'timely_mother_bp': 'Timely taking of mother BP',
    'take_mother_temperature': 'Mother temperature taken',
    'timely_mother_temp': 'Timely taking of mother temperature',
    'take_mother_pulse': 'Mother pulse taken',
    'timely_mother_pulse': 'Timely taking of mother pulse',
    'apgar_min1': 'APGAR score at 1 minute',
    'apgar_min5': 'APGAR score at 5 minutes',
}
infection_ind = {
    'sharps_disposal': 'Sharps Disposal',
    'waste_disposal': 'Waste Disposal',
}
rmc_ind = {
    'birth_companion': 'Birth companion present',
    'provider_explanations': 'Provider explained process to mother clearly throughout',
    'spoken_to_directly': 'Provider spoke to the mother directly throughout',
    'spoken_to_kindly': 'Provider spoke to the mother kindly throughout',
    'rmc_no_disrespect_to_mother': 'Mother was treated with respect throughout',
}
harm_avoidance_ind = {
    'fundal_pressure': 'No instance of fundal pressure',
    'perineum_stretching': 'No instance of perineum stretching',
    'newborn_slapped': 'No instance of newborn slapping',
    'newborn_upside_down': 'No instance of newborn being held upside down',
}
harm_rate_ind = {
    'fundal_pressure': '% deliveries with fundal pressure',
    'perineum_stretching': '% deliveries with perineum stretching',
    'newborn_slapped': '% deliveries with newborn slapping',
    'newborn_upside_down': '% deliveries with newborn held upside down',
}
emotive_ind = {
    'uterine_massage_initiated': 'Uterine massage initiated',
    'timely_uterine_massage': 'Timely uterine massage',
    'oxytocin_first_line': 'Oxytocin first-line administered',
    'timely_oxytocin_administration': 'Timely administration of oxytocin',
    'txa_administered': 'Tranexamic Acid (TXA) administered',
    'timely_txa_administration': 'Timely administration of TXA',
    'iv_access_fluids': 'IV access established',
    'timely_iv_establishment': 'Timely establishment of IV access',
}

SECTION_MAPPING = {
    "Birth Preparedness": list(birth_preparedness_ind),
    "Technical Quality After Birth": list(tqab_ind),
    "Postbirth Infection Prevention": list(infection_ind),
    "Respectful Maternity Care": list(rmc_ind),
    "Avoidance Harmful Practices": list(harm_avoidance_ind),
    "Partograph Review": list(partograph_ind),
    "Labor Care Guide Review": list(lcg_ind),
    "EMOTIVE": list(emotive_ind),
}

TQIFB_COLS = list(tqab_ind)[:21]
NEWBORN_ESSENTIAL_CARE_COLS = ['drying_stimulation', 'skin_to_skin', 'timely_cord_clamp', 'timely_breastfeeding_initiation']
TIMELY_VITALS_COLS = ['timely_mother_bp', 'timely_mother_temp', 'timely_mother_pulse']
CADRE_MENTEE = 'enrolled jh mentee'

quips_specs = [
    {"label": "% of deliveries by JH enrolled mentees", "kind": "mentee"},
    {"label": "% of deliveries with Birth Preparedness Score of 100%", "kind": "threshold", "cols": list(birth_preparedness_ind), "threshold": 100},
    {"label": "% of deliveries with Respectful Maternity Care (RMC) Score of 100%", "kind": "threshold", "cols": list(rmc_ind), "threshold": 100},
    {"label": "% of deliveries with Technical Quality Immediately Following Birth Score ≥ 90%", "kind": "threshold", "cols": TQIFB_COLS, "threshold": 90},
    {"label": "% of deliveries with Post-Birth Infection Prevention Score of 100%", "kind": "threshold", "cols": list(infection_ind), "threshold": 100},
    {"label": "% of deliveries with Avoidance of Harmful Practices Score of 100%", "kind": "threshold", "cols": list(harm_avoidance_ind), "threshold": 100},
    {"label": "% of deliveries using Labor Care Guide", "kind": "single", "cols": ['lcg_initiated_correct']},
    {"label": "Overall Intrapartum Quality of Care Score", "kind": "qoc"},
    {"label": "% of live deliveries with all essential newborn care components", "kind": "all", "cols": NEWBORN_ESSENTIAL_CARE_COLS},
    {"label": "% of live deliveries with timely administration of Vitamin K", "kind": "single", "cols": ['timely_vitamink_administration']},
    {"label": "% of live deliveries with timely administration of uterotonics", "kind": "single", "cols": ['timely_uterotonic_administration']},
    {"label": "% of live deliveries with delayed cord clamping", "kind": "single", "cols": ['timely_cord_clamp']},
    {"label": "% of deliveries with timely recording of vitals (BP, Temp, Pulse)", "kind": "all", "cols": TIMELY_VITALS_COLS},
    {"label": "% of live deliveries with timely initiation of breastfeeding", "kind": "single", "cols": ['timely_breastfeeding_initiation']},
]

VIEWS = {
    "Overview: all sections": {"kind": "sections", "sort": True},
    "Key QuIPS indicators": {"kind": "quips", "sort": True},
    "Birth Preparedness": {"kind": "indicators", "indicators": birth_preparedness_ind, "sort": True},
    "Labor Care Guide": {"kind": "indicators", "indicators": lcg_ind},
    "Partograph Review": {"kind": "indicators", "indicators": partograph_ind},
    "Technical Quality After Birth": {"kind": "indicators", "indicators": tqab_ind, "sort": True},
    "Maternal Vitals & Documentation": {"kind": "indicators", "indicators": vitals_ind, "sort": True},
    "Postbirth Infection Prevention": {"kind": "indicators", "indicators": infection_ind},
    "Respectful Maternity Care": {"kind": "indicators", "indicators": rmc_ind},
    "Avoidance of Harmful Practices": {"kind": "indicators", "indicators": harm_avoidance_ind},
    "Harmful Practices (% with instance)": {"kind": "indicators", "indicators": harm_rate_ind, "mode": "harm_rate"},
    "EMOTIVE": {"kind": "indicators", "indicators": emotive_ind, "sort": True},
    "Uterotonic administered (% by type)": {"kind": "category", "field": "uterotonic_administered", "row_label": "Uterotonic", "multi": False},
    "Method of blood loss measurement (% by method)": {"kind": "category", "field": "method_blood_loss", "row_label": "Method of blood loss measurement", "multi": False},
}

category_invalid = {"", "unable to observe", "not applicable", "na", "n/a", "nan"}

SHEET_INDEX = 'Index'
SHEET_ALL = 'All facilities'

COLOR_TITLE = '#2b8aa8'
COLOR_SECTION = '#1f6f8a'
COLOR_HEADER = '#f2f2f2'
COLOR_MONTH = '#e7f5f8'
COLOR_ZEBRA = '#f7fbfc'
COLOR_NOTE = '#5f6368'
COLOR_INK = '#202124'


def normalize(series):
    return series.astype(str).str.strip()


def yes_no_flags(series, col, invert=None):
    """Two boolean Series (yes, no). Invalid answers are False in both."""
    valid = series.notna() & ~series.isin(invalid_values)
    text = normalize(series).str.lower()

    if col == "uterotonic_administered":
        none = text == "none of the above"
        return valid & ~none, valid & none
    if col == "method_blood_loss":
        yes = valid & text.isin(blood_loss_valid_lower)
        return yes, valid & ~yes
    if col in frequency_cols:
        return (valid & text.isin(["yes", "always"]),
                valid & text.isin(["no", "sometimes", "rarely", "never"]))

    if invert is None:
        invert = col in inverted_cols
    pos, neg = ("no", "yes") if invert else ("yes", "no")
    return valid & (text == pos), valid & (text == neg)


def compute_score(series, col, invert=None):
    yes, no = yes_no_flags(series, col, invert)
    denom = int(yes.sum() + no.sum())
    return np.nan if denom == 0 else yes.sum() / denom * 100


def section_score(data, cols):
    scores = [compute_score(data[c], c) for c in cols if c in data.columns]
    scores = [s for s in scores if not pd.isna(s)]
    return np.mean(scores) if scores else np.nan


def yes_mask(series):
    return normalize(series).str.lower() == "yes"


def pct_single_yes(data, col, total):
    if col not in data.columns:
        return 0.0
    return data.loc[yes_mask(data[col]), '_uuid'].nunique() / total * 100


def pct_all_yes(data, cols, total):
    if not all(c in data.columns for c in cols):
        return 0.0
    mask = pd.Series(True, index=data.index)
    for col in cols:
        mask &= yes_mask(data[col])
    return data.loc[mask, '_uuid'].nunique() / total * 100


def pct_section_threshold(data, cols, threshold, total):
    present = [c for c in cols if c in data.columns]
    if not present:
        return 0.0
    by_delivery = data['_uuid']
    ratios = {}
    for col in present:
        yes, no = yes_no_flags(data[col], col)
        y = yes.groupby(by_delivery).sum()
        den = y + no.groupby(by_delivery).sum()
        ratios[col] = y / den.where(den > 0)
    delivery_score = pd.DataFrame(ratios).mean(axis=1, skipna=True) * 100
    return (delivery_score >= threshold - 1e-9).sum() / total * 100


def quips_score(data, spec):
    if data.empty:
        return np.nan
    total = data['_uuid'].nunique()
    if total == 0:
        return np.nan
    kind = spec["kind"]
    if kind == "mentee":
        if 'cadre' not in data.columns:
            return 0.0
        is_mentee = normalize(data['cadre']).str.lower() == CADRE_MENTEE
        return data.loc[is_mentee, '_uuid'].nunique() / total * 100
    if kind == "single":
        return pct_single_yes(data, spec["cols"][0], total)
    if kind == "all":
        return pct_all_yes(data, spec["cols"], total)
    if kind == "threshold":
        return pct_section_threshold(data, spec["cols"], spec["threshold"], total)
    if kind == "qoc":
        return data['quality_care_score'].mean() * 100 if 'quality_care_score' in data.columns else np.nan
    return np.nan


def valid_answers(series):
    cleaned = series.dropna().astype(str).str.strip()
    return cleaned[~cleaned.str.lower().isin(category_invalid)]


def category_pct(data, field, cat, multi=False):
    if field not in data.columns:
        return np.nan
    answers = valid_answers(data[field])
    if len(answers) == 0:
        return np.nan
    if multi:
        hits = answers.apply(lambda value: cat in value.split()).sum()
    else:
        hits = (answers == cat).sum()
    return hits / len(answers) * 100


def make_rows(view, range_df):
    """Same row builder as the dashboard. Uses the global df for column checks."""
    kind = view["kind"]
    opts = {"mode": view.get("mode", "good_high"), "status": True, "sort": view.get("sort", False)}

    if kind == "sections":
        rows = [(name, (lambda d, cols=cols: section_score(d, cols)))
                for name, cols in SECTION_MAPPING.items() if all(c in df.columns for c in cols)]
        return "Section", rows, opts

    if kind == "quips":
        return "Indicator", [(spec["label"], (lambda d, spec=spec: quips_score(d, spec))) for spec in quips_specs], opts

    if kind == "indicators":
        invert = False if opts["mode"] == "harm_rate" else None
        rows = [(label, (lambda d, c=col, invert=invert: compute_score(d[c], c, invert)))
                for col, label in view["indicators"].items() if col in df.columns]
        return "Indicator", rows, opts

    if kind == "category":
        field, multi = view["field"], view.get("multi", False)
        opts.update(mode="neutral", status=False)
        if field not in df.columns:
            return view["row_label"], [], opts
        categories = [cat for cat, _ in Counter(
            item
            for answer in valid_answers(range_df[field])
            for item in (answer.split() if multi else [answer])
        ).most_common()]
        rows = [(cat, (lambda d, cat=cat: category_pct(d, field, cat, multi))) for cat in categories]
        return view["row_label"], rows, opts

    return "Indicator", [], opts


def load_data(source=None):
    """Load the published scorecard sheet the same way the dashboard does."""
    loaded = pd.read_csv(source or DATA_URL)
    loaded.columns = loaded.columns.str.strip()
    if '_uuid' not in loaded.columns:
        loaded['_uuid'] = loaded.index
    loaded['date_submitted'] = pd.to_datetime(loaded['date_submitted'], errors='coerce')
    loaded = loaded.dropna(subset=['date_submitted'])
    loaded['month_period'] = loaded['date_submitted'].dt.to_period('M')
    if 'pph_diagnosis_time' in loaded.columns:
        pph_blank = (
            loaded['pph_diagnosis_time'].isna()
            | (loaded['pph_diagnosis_time'].astype(str).str.strip() == "")
        )
        loaded['complication'] = np.where(pph_blank, 'Normal Delivery', 'PPH Complication')
    else:
        loaded['complication'] = 'Normal Delivery'
    loaded['county'] = loaded['county'].fillna('').astype(str).str.strip()
    loaded['facility'] = loaded['facility'].fillna('').astype(str).str.strip()
    return loaded


def prepare_data(source=None):
    global df
    df = load_data(source)
    return df


def report_period(spec=None):
    """None means the previous calendar month in Africa/Nairobi."""
    if spec:
        return pd.Period(spec, freq='M')
    now = datetime.now(ZoneInfo(TIMEZONE))
    year, month = now.year, now.month - 1
    if month == 0:
        year, month = year - 1, 12
    return pd.Period(f'{year:04d}-{month:02d}', freq='M')


def as_number(value):
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        return None
    return float(value)


def status_mark(score, mode):
    if score is None or (isinstance(score, float) and np.isnan(score)):
        return '⚪'
    if mode == 'harm_rate':
        if score == 0:
            return '🟢'
        if score <= 5:
            return '🟠'
        return '🔴'
    if mode == 'neutral':
        return ''
    if score >= 80:
        return '🟢'
    if score >= 60:
        return '🟠'
    return '🔴'


def score_color(score, mode):
    if score is None:
        return '#808080'
    if mode == 'neutral':
        return COLOR_INK
    if mode == 'harm_rate':
        if score == 0:
            return '#188038'
        if score <= 5:
            return '#e37400'
        return '#d93025'
    if score >= 80:
        return '#188038'
    if score >= 60:
        return '#e37400'
    return '#d93025'


def trend_mark(current, previous, mode):
    if current is None or previous is None:
        return '▬ N/A', '#808080'
    diff = current - previous
    text = f" ({abs(diff):.1f}%)"
    up, down = '#188038', '#d93025'
    if mode == 'harm_rate':
        up, down = '#d93025', '#188038'
    elif mode == 'neutral':
        up, down = '#1f77b4', '#e37400'
    if diff > 0:
        return '▲' + text, up
    if diff < 0:
        return '▼' + text, down
    return '▬' + text, '#808080'


def evaluate_view(view_name, frame, export_period):
    view = VIEWS[view_name]
    first_col, row_defs, opts = make_rows(view, frame)
    months = sorted(frame['month_period'].dropna().unique().tolist())
    previous_period = export_period - 1
    built = []
    for label, fn in row_defs:
        score = as_number(fn(frame))
        by_month = [as_number(fn(frame[frame['month_period'] == month])) for month in months]
        current = as_number(fn(frame[frame['month_period'] == export_period]))
        previous = as_number(fn(frame[frame['month_period'] == previous_period]))
        built.append({
            'label': label,
            'score': score,
            'by_month': by_month,
            'current': current,
            'previous': previous,
        })
    if opts.get('sort'):
        built.sort(key=lambda row: (row['score'] is None, row['score'] if row['score'] is not None else 0))
    return {
        'title': view_name,
        'first_col': first_col,
        'mode': opts.get('mode', 'good_high'),
        'status': opts.get('status', True),
        'months': months,
        'rows': built,
    }


def scorecard_for(frame, export_period):
    sections = [evaluate_view(name, frame, export_period) for name in VIEWS]
    months = sorted(frame['month_period'].dropna().unique().tolist())
    this_month = frame[frame['month_period'] == export_period]
    return {
        'sections': sections,
        'months': months,
        'deliveries': int(frame['_uuid'].nunique()),
        'deliveries_this_month': int(this_month['_uuid'].nunique()),
        'deliveries_by_month': [int(frame.loc[frame['month_period'] == month, '_uuid'].nunique()) for month in months],
        'latest': _latest_label(frame),
    }


def _latest_label(frame):
    latest = frame['date_submitted'].max()
    if pd.isna(latest):
        return ''
    return f"{latest.day} {latest.strftime('%b %Y')}"


def build_export_plan(data, export_period):
    """One entry per county that has at least one submission in the report month."""
    window = data[data['month_period'] <= export_period]
    active = set(window.loc[window['month_period'] == export_period, 'county'])
    counties = sorted(active, key=lambda name: (name == '', name.lower()))
    plan = []
    for county in counties:
        county_df = window[window['county'] == county]
        facilities = []
        silent = []
        used_names = {SHEET_INDEX.lower(), SHEET_ALL.lower()}
        facility_names = sorted(set(county_df['facility']), key=lambda name: (name == '', name.lower()))
        for facility in facility_names:
            fac_df = county_df[county_df['facility'] == facility]
            this_month = int(fac_df.loc[fac_df['month_period'] == export_period, '_uuid'].nunique())
            entry = {
                'facility': facility,
                'label': facility or '(Blank)',
                'this_month': this_month,
                'through': int(fac_df['_uuid'].nunique()),
                'latest': _latest_label(fac_df),
            }
            if not this_month:
                silent.append(entry)
                continue
            entry['sheet'] = unique_sheet_name(entry['label'], used_names)
            entry['scorecard'] = scorecard_for(fac_df, export_period)
            facilities.append(entry)
        label = county or '(Blank)'
        plan.append({
            'county': county,
            'label': label,
            'file_name': f"QuIPS - {label} - {export_period.strftime('%b %Y')}",
            'this_month': int(county_df.loc[county_df['month_period'] == export_period, '_uuid'].nunique()),
            'through': int(county_df['_uuid'].nunique()),
            'latest': _latest_label(county_df),
            'scorecard': scorecard_for(county_df, export_period),
            'facilities': facilities,
            'silent': silent,
            'export_period': export_period,
        })
    return plan


def unique_sheet_name(name, used):
    import re
    clean = re.sub(r'[\[\]*?/\\:]', ' ', str(name or ''))
    clean = re.sub(r'\s+', ' ', clean).strip() or '(Blank)'
    clean = clean[:99].strip()
    candidate = clean
    n = 2
    while candidate.lower() in used:
        suffix = f' ({n})'
        candidate = clean[:100 - len(suffix)].strip() + suffix
        n += 1
    used.add(candidate.lower())
    return candidate


# ---------------------------------------------------------------------------
# Sheet grids (no Google calls)
# ---------------------------------------------------------------------------

def _cell(value, **style):
    cell = {'v': '' if value is None else value}
    cell.update(style)
    return cell


def _grid(cols):
    return {'cols': cols, 'rows': [], 'merges': [], 'borders': [], 'links': [], 'heights': []}


def _add(grid, cells, height=20, merge=False):
    row = list(cells)
    pad = {}
    if merge and cells:
        for key in ('bg', 'color'):
            if cells[0].get(key):
                pad[key] = cells[0][key]
    while len(row) < grid['cols']:
        row.append(_cell('', **pad))
    grid['rows'].append(row[:grid['cols']])
    grid['heights'].append(height)
    if merge:
        grid['merges'].append((len(grid['rows']) - 1, 0, len(grid['rows']), grid['cols']))
    return len(grid['rows']) - 1


def _score_cell(score, mode):
    if score is None:
        return _cell('N/A', color='#808080', align='CENTER')
    return _cell(score, fmt='percent', color=score_color(score, mode), align='CENTER', bold=(mode != 'plain'))


def layout_scorecard(card, place, export_period):
    months = card['months']
    cols = 4 + len(months)
    report_at = months.index(export_period) if export_period in months else -1
    grid = _grid(cols)
    first = months[0].strftime('%b %Y') if months else export_period.strftime('%b %Y')
    report = export_period.strftime('%b %Y')
    previous = (export_period - 1).strftime('%b %Y')

    _add(grid, [_cell('Quality Intrapartum Care Surveillance', bg=COLOR_TITLE, color='#ffffff', bold=True, size=16)], 36, merge=True)
    _add(grid, [_cell(place, bg='#e8f4f8', bold=True, size=12)], 24, merge=True)
    _add(grid, [_cell(f'Report month: {report}    ·    Trend: {report} vs {previous}')], 20, merge=True)
    _add(grid, [_cell(
        f"Deliveries this month: {card['deliveries_this_month']}"
        f"    ·    Deliveries in the score ({first} – {report}): {card['deliveries']}"
        f"    ·    Latest submission: {card['latest'] or '—'}"
    )], 20, merge=True)
    _add(grid, [_cell(
        f'All cadres and all complications. Score and Status use every submission from {first} '
        f'through {report}. The highlighted column is {report}.',
        color=COLOR_NOTE, size=9, wrap=True,
    )], 32, merge=True)
    _add(grid, [_cell('')], 10)

    header = [_cell('Submissions', bg=COLOR_HEADER, bold=True, align='LEFT')]
    header.append(_cell('Through report month', bg=COLOR_HEADER, bold=True, align='CENTER'))
    for i, month in enumerate(months):
        header.append(_cell(month.strftime('%b %Y'), bg=COLOR_MONTH if i == report_at else COLOR_HEADER, bold=True, align='CENTER'))
    header += [_cell('', bg=COLOR_HEADER), _cell('', bg=COLOR_HEADER)]
    header_row = _add(grid, header, 22)
    counts = [_cell('Deliveries (n)')]
    counts.append(_cell(card['deliveries'], fmt='int', align='CENTER'))
    for i, month in enumerate(months):
        counts.append(_cell(card['deliveries_by_month'][i], fmt='int', align='CENTER', bg=COLOR_MONTH if i == report_at else '#ffffff'))
    counts += [_cell(''), _cell('')]
    _add(grid, counts, 20)
    grid['borders'].append((header_row, 0, header_row + 2, cols))
    _add(grid, [_cell('')], 10)

    for number, section in enumerate(card['sections'], start=1):
        _append_section(grid, section, number, report_at)
    _add(grid, [_cell('How to read this tab', bg=COLOR_SECTION, color='#ffffff', bold=True, size=11)], 22, merge=True)
    _add(grid, [_cell('🟢 80% or above     🟠 60% up to 80%     🔴 below 60%     ⚪ no valid answers. Status describes the Score column.', color=COLOR_NOTE, size=9)], 18, merge=True)
    _add(grid, [_cell('Harmful Practices (% with instance): 🟢 0%     🟠 up to 5%     🔴 above 5%. Lower is better, so an increase is red.', color=COLOR_NOTE, size=9)], 18, merge=True)
    _add(grid, [_cell('Key QuIPS percentages use every delivery as the denominator. Indicator scores use valid answers only. Answer-mix sections have no status icon.', color=COLOR_NOTE, size=9, wrap=True)], 18, merge=True)
    _add(grid, [_cell('Sections are in dashboard order, first through last.', color=COLOR_NOTE, size=9)], 18, merge=True)
    return grid


def _append_section(grid, section, number, report_at):
    cols = grid['cols']
    _add(grid, [_cell(f"{number}. {section['title']}", bg=COLOR_SECTION, color='#ffffff', bold=True, size=12)], 24, merge=True)
    months = section['months']
    header = [_cell(section['first_col'], bg=COLOR_HEADER, bold=True)]
    header.append(_cell('Score', bg=COLOR_HEADER, bold=True, align='CENTER'))
    for i, month in enumerate(months):
        header.append(_cell(
            month.strftime('%b %Y'),
            bg=COLOR_MONTH if i == report_at else COLOR_HEADER,
            bold=True, align='CENTER',
        ))
    header.append(_cell('Status' if section['status'] else '', bg=COLOR_HEADER, bold=True, align='CENTER'))
    header.append(_cell('Trend', bg=COLOR_HEADER, bold=True, align='CENTER'))
    header_row = _add(grid, header, 22)
    if not section['rows']:
        _add(grid, [_cell('No valid answers in this period')], 20)
        grid['borders'].append((header_row, 0, header_row + 2, cols))
        _add(grid, [_cell('')], 10)
        return
    for r, item in enumerate(section['rows']):
        zebra = COLOR_ZEBRA if r % 2 else '#ffffff'
        trend, trend_color = trend_mark(item['current'], item['previous'], section['mode'])
        row = [_cell(item['label'], bg=zebra)]
        row.append(_score_cell(item['score'], section['mode']))
        row[-1]['bg'] = zebra
        for i, value in enumerate(item['by_month']):
            bg = COLOR_MONTH if i == report_at else zebra
            cell = _score_cell(value, section['mode'] if i == report_at else 'plain')
            cell['bg'] = bg
            row.append(cell)
        mark = status_mark(item['score'], section['mode']) if section['status'] else ''
        row.append(_cell(mark, align='CENTER', bg=zebra))
        row.append(_cell(trend, color=trend_color, bold=True, align='CENTER', bg=zebra))
        _add(grid, row, 20)
    grid['borders'].append((header_row, 0, header_row + 1 + len(section['rows']), cols))
    _add(grid, [_cell('')], 10)


def layout_index(county, generated_at):
    grid = _grid(4)
    report = county['export_period'].strftime('%b %Y')
    first = county['scorecard']['months'][0].strftime('%b %Y') if county['scorecard']['months'] else report
    _add(grid, [_cell('Quality Intrapartum Care Surveillance', bg=COLOR_TITLE, color='#ffffff', bold=True, size=16)], 36, merge=True)
    _add(grid, [_cell(f"{county['label']}  ·  {report}", bg='#e8f4f8', bold=True, size=13)], 24, merge=True)
    _add(grid, [_cell(f"Generated {generated_at}  ·  Latest submission in this file: {county['latest'] or '—'}", color=COLOR_NOTE, size=9)], 18, merge=True)
    _add(grid, [_cell(
        f"{county['this_month']} deliveries in {report} across {len(county['facilities'])} facilities. "
        f"Scores on each tab include {county['through']} deliveries from {first} through {report}.",
        wrap=True,
    )], 32, merge=True)
    _add(grid, [_cell('')], 10)
    _add(grid, [_cell('Tabs', bg=COLOR_SECTION, color='#ffffff', bold=True, size=12)], 22, merge=True)
    header_row = _add(grid, [
        _cell('Facility', bg=COLOR_HEADER, bold=True),
        _cell('Deliveries this month', bg=COLOR_HEADER, bold=True, align='CENTER'),
        _cell('Deliveries in the score', bg=COLOR_HEADER, bold=True, align='CENTER'),
        _cell('Open', bg=COLOR_HEADER, bold=True, align='CENTER'),
    ], 22)
    link_row = _add(grid, [
        _cell(SHEET_ALL, bold=True),
        _cell(county['this_month'], fmt='int', align='CENTER'),
        _cell(county['through'], fmt='int', align='CENTER'),
        _cell('Open', align='CENTER', link=SHEET_ALL),
    ], 20)
    grid['links'].append((link_row, 3, SHEET_ALL))
    for i, facility in enumerate(county['facilities']):
        zebra = COLOR_ZEBRA if i % 2 else '#ffffff'
        row = _add(grid, [
            _cell(facility['label'], bg=zebra),
            _cell(facility['this_month'], fmt='int', align='CENTER', bg=zebra),
            _cell(facility['through'], fmt='int', align='CENTER', bg=zebra),
            _cell('Open', align='CENTER', bg=zebra, link=facility['sheet']),
        ], 20)
        grid['links'].append((row, 3, facility['sheet']))
    grid['borders'].append((header_row, 0, header_row + 2 + len(county['facilities']), 4))
    if county['silent']:
        _add(grid, [_cell('')], 10)
        _add(grid, [_cell(f'No submission in {report}', bg=COLOR_SECTION, color='#ffffff', bold=True, size=12)], 22, merge=True)
        silent_header = _add(grid, [
            _cell('Facility', bg=COLOR_HEADER, bold=True),
            _cell('Deliveries before this month', bg=COLOR_HEADER, bold=True, align='CENTER'),
            _cell('Latest previous submission', bg=COLOR_HEADER, bold=True, align='CENTER'),
            _cell('', bg=COLOR_HEADER),
        ], 22)
        for i, facility in enumerate(county['silent']):
            zebra = COLOR_ZEBRA if i % 2 else '#ffffff'
            _add(grid, [
                _cell(facility['label'], bg=zebra),
                _cell(facility['through'], fmt='int', align='CENTER', bg=zebra),
                _cell(facility['latest'] or '—', align='CENTER', bg=zebra),
                _cell('', bg=zebra),
            ], 20)
        grid['borders'].append((silent_header, 0, silent_header + 1 + len(county['silent']), 4))
    _add(grid, [_cell('')], 10)
    _add(grid, [_cell('Sections on every tab, first to last', bg=COLOR_SECTION, color='#ffffff', bold=True, size=12)], 22, merge=True)
    for i, name in enumerate(VIEWS, start=1):
        _add(grid, [_cell(f'{i}. {name}')], 18, merge=True)
    _add(grid, [_cell('')], 10)
    _add(grid, [_cell('How to read the scores', bg=COLOR_SECTION, color='#ffffff', bold=True, size=12)], 22, merge=True)
    _add(grid, [_cell('🟢 80% or above     🟠 60% up to 80%     🔴 below 60%     ⚪ no valid answers.')], 18, merge=True)
    _add(grid, [_cell('Harmful Practices (% with instance) reads the other way: 🟢 0%, 🟠 up to 5%, 🔴 above 5%. Lower is better.')], 18, merge=True)
    _add(grid, [_cell('Score and Status cover the whole window. Trend compares the report month with the previous month. The report month column is highlighted.', wrap=True)], 32, merge=True)
    _add(grid, [_cell('Key QuIPS percentages use every delivery as the denominator. The other indicator scores use valid answers only.', wrap=True)], 18, merge=True)
    _add(grid, [_cell('Running this export again for the same month updates this file in place, so the link stays the same.', color=COLOR_NOTE)], 18, merge=True)
    return grid


def grid_values(grid):
    values = []
    for row in grid['rows']:
        out = []
        for cell in row:
            value = cell.get('v', '')
            if isinstance(value, str) and value[:1] in '=+-@':
                value = "'" + value
            out.append(value)
        values.append(out)
    return values


# ---------------------------------------------------------------------------
# Google Sheets (runs in Colab)
# ---------------------------------------------------------------------------

def _rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return {
        'red': int(hex_color[0:2], 16) / 255,
        'green': int(hex_color[2:4], 16) / 255,
        'blue': int(hex_color[4:6], 16) / 255,
    }


def _colab_clients():
    try:
        from google.colab import auth
    except ImportError as exc:
        raise RuntimeError(
            'Open QuIPS Analysis Export and Data Sharing.ipynb in Google Colab and run it there. '
            'That is what creates the spreadsheets in your Drive.'
        ) from exc
    auth.authenticate_user()
    import gspread
    from google.auth import default
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
    ]
    try:
        creds, _ = default(scopes=scopes)
    except TypeError:
        creds, _ = default()
    return gspread.authorize(creds), creds


def _drive(creds):
    from googleapiclient.discovery import build
    return build('drive', 'v3', credentials=creds, cache_discovery=False)


def _escape(value):
    return str(value).replace('\\', '\\\\').replace("'", "\\'")


def _folder(drive, name, parent_id=None):
    query = "mimeType='application/vnd.google-apps.folder' and trashed=false and name='%s'" % _escape(name)
    if parent_id:
        query += " and '%s' in parents" % parent_id
    found = drive.files().list(q=query, fields='files(id,name)', pageSize=1).execute().get('files', [])
    if found:
        return found[0]['id']
    body = {'name': name, 'mimeType': 'application/vnd.google-apps.folder'}
    if parent_id:
        body['parents'] = [parent_id]
    return drive.files().create(body=body, fields='id').execute()['id']


def _find_spreadsheet(drive, name, parent_id):
    query = (
        "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false "
        "and name='%s' and '%s' in parents" % (_escape(name), parent_id)
    )
    found = drive.files().list(q=query, fields='files(id,name)', pageSize=1).execute().get('files', [])
    return found[0]['id'] if found else None


def _update_values(worksheet, values):
    try:
        worksheet.update(values, 'A1', value_input_option='RAW')
    except TypeError:
        worksheet.update('A1', values, value_input_option='RAW')


def _format_requests(sheet_id, grid):
    requests = []
    for r, row in enumerate(grid['rows']):
        for c, cell in enumerate(row):
            text = {
                'fontFamily': 'Arial',
                'fontSize': cell.get('size', 10),
                'bold': bool(cell.get('bold')),
            }
            if cell.get('color'):
                text['foregroundColor'] = _rgb(cell['color'])
            fmt = {
                'textFormat': text,
                'horizontalAlignment': cell.get('align', 'LEFT'),
                'verticalAlignment': 'MIDDLE',
                'wrapStrategy': 'WRAP' if cell.get('wrap') else 'CLIP',
            }
            if cell.get('bg'):
                fmt['backgroundColor'] = _rgb(cell['bg'])
            if cell.get('fmt') == 'percent':
                # Quoted percent sign: 57.1 stays 57.1%, it is not multiplied by 100.
                fmt['numberFormat'] = {'type': 'NUMBER', 'pattern': '0.0"%"'}
            elif cell.get('fmt') == 'int':
                fmt['numberFormat'] = {'type': 'NUMBER', 'pattern': '0'}
            requests.append({'repeatCell': {
                'range': {
                    'sheetId': sheet_id,
                    'startRowIndex': r, 'endRowIndex': r + 1,
                    'startColumnIndex': c, 'endColumnIndex': c + 1,
                },
                'cell': {'userEnteredFormat': fmt},
                'fields': 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy,numberFormat)',
            }})
    for r0, c0, r1, c1 in grid['merges']:
        requests.append({'mergeCells': {
            'range': {
                'sheetId': sheet_id,
                'startRowIndex': r0, 'endRowIndex': r1,
                'startColumnIndex': c0, 'endColumnIndex': c1,
            },
            'mergeType': 'MERGE_ALL',
        }})
    for r0, c0, r1, c1 in grid['borders']:
        edge = {'style': 'SOLID', 'color': _rgb('#e0e0e0')}
        requests.append({'updateBorders': {
            'range': {
                'sheetId': sheet_id,
                'startRowIndex': r0, 'endRowIndex': r1,
                'startColumnIndex': c0, 'endColumnIndex': c1,
            },
            'top': edge, 'bottom': edge, 'left': edge, 'right': edge,
            'innerHorizontal': edge, 'innerVertical': edge,
        }})
    for r, height in enumerate(grid['heights']):
        if not height:
            continue
        requests.append({'updateDimensionProperties': {
            'range': {'sheetId': sheet_id, 'dimension': 'ROWS', 'startIndex': r, 'endIndex': r + 1},
            'properties': {'pixelSize': height},
            'fields': 'pixelSize',
        }})
    requests.append({'updateSheetProperties': {
        'properties': {
            'sheetId': sheet_id,
            'gridProperties': {'frozenRowCount': 1, 'frozenColumnCount': 1},
        },
        'fields': 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
    }})
    return requests


def _batch(spreadsheet, requests, size=400):
    for start in range(0, len(requests), size):
        spreadsheet.batch_update({'requests': requests[start:start + size]})


def _reset_or_add(spreadsheet, title, rows, cols):
    existing = None
    for worksheet in spreadsheet.worksheets():
        if worksheet.title == title:
            existing = worksheet
            break
    if existing is None:
        return spreadsheet.add_worksheet(title, rows=max(rows, 1), cols=max(cols, 1))
    if existing.row_count < rows or existing.col_count < cols:
        existing.resize(rows=max(existing.row_count, rows), cols=max(existing.col_count, cols))
    try:
        spreadsheet.batch_update({'requests': [
            {'unmergeCells': {'range': {'sheetId': existing.id}}},
        ]})
    except Exception:
        pass
    existing.clear()
    return existing


def _write_grid(spreadsheet, worksheet, grid):
    values = grid_values(grid)
    rows = max(len(values), 1)
    cols = max(grid['cols'], 1)
    if worksheet.row_count < rows or worksheet.col_count < cols:
        worksheet.resize(rows=max(worksheet.row_count, rows), cols=max(worksheet.col_count, cols))
    _update_values(worksheet, values)
    _batch(spreadsheet, _format_requests(worksheet.id, grid))
    widths = [360, 180, 240, 90] if cols == 4 else [640] + [120 if i == cols - 1 else 112 for i in range(1, cols)]
    width_requests = []
    for i, width in enumerate(widths):
        width_requests.append({'updateDimensionProperties': {
            'range': {'sheetId': worksheet.id, 'dimension': 'COLUMNS', 'startIndex': i, 'endIndex': i + 1},
            'properties': {'pixelSize': width},
            'fields': 'pixelSize',
        }})
    _batch(spreadsheet, width_requests)
    return worksheet


def _share(spreadsheet, emails, link_sharing):
    for email in emails or []:
        email = str(email or '').strip()
        if '@' not in email:
            continue
        try:
            spreadsheet.share(email, perm_type='user', role='reader', notify=True)
        except Exception as err:
            print(f'  Could not share with {email}: {err}')
    if link_sharing:
        try:
            spreadsheet.share(None, perm_type='anyone', role='reader', notify=False, with_link=True)
        except Exception as err:
            print(f'  Could not turn on link sharing: {err}')


def export_to_sheets(report_month=None, folder_id='', share_with=None, link_sharing=False, source=None):
    """Create or update one spreadsheet per county for the report month.

    Run this in Google Colab. report_month is 'YYYY-MM', or None for the
    previous month. folder_id is a Drive folder the recipients can open.
    Leave it blank to create "QuIPS Analysis Export and Data Sharing".
    """
    prepare_data(source)
    export_period = report_period(report_month)
    plan = build_export_plan(df, export_period)
    label = export_period.strftime('%b %Y')
    if not plan:
        print(f'No submissions in {label}. No files created.')
        return []
    print(f'{label}: {len(plan)} county file(s)')
    for county in plan:
        print(f"  {county['label']}: {county['this_month']} deliveries, {len(county['facilities'])} facility tab(s)")

    gc, creds = _colab_clients()
    drive = _drive(creds)
    root_id = folder_id.strip() if folder_id else _folder(drive, ROOT_FOLDER_NAME)
    month_id = _folder(drive, label, root_id)
    generated_at = datetime.now(ZoneInfo(TIMEZONE)).strftime('%d %b %Y %H:%M')
    written = []

    for county in plan:
        file_id = _find_spreadsheet(drive, county['file_name'], month_id)
        if file_id:
            spreadsheet = gc.open_by_key(file_id)
            action = 'updated'
        else:
            created = drive.files().create(body={
                'name': county['file_name'],
                'mimeType': 'application/vnd.google-apps.spreadsheet',
                'parents': [month_id],
            }, fields='id').execute()
            spreadsheet = gc.open_by_key(created['id'])
            action = 'created'
        try:
            spreadsheet.batch_update({'requests': [{
                'updateSpreadsheetProperties': {
                    'properties': {'timeZone': TIMEZONE, 'title': county['file_name']},
                    'fields': 'timeZone,title',
                }
            }]})
        except Exception:
            pass

        sheets = {}
        index_grid = layout_index(county, generated_at)
        sheets[SHEET_INDEX] = index_grid
        all_card = county['scorecard']
        sheets[SHEET_ALL] = layout_scorecard(
            all_card,
            f"{county['label']}  ·  All facilities",
            county['export_period'],
        )
        for facility in county['facilities']:
            sheets[facility['sheet']] = layout_scorecard(
                facility['scorecard'],
                f"{county['label']}  ·  {facility['label']}",
                county['export_period'],
            )

        order = [SHEET_INDEX, SHEET_ALL] + [facility['sheet'] for facility in county['facilities']]
        holders = {}
        for title in order:
            grid = sheets[title]
            rows = max(len(grid['rows']), 2)
            cols = max(grid['cols'], 2)
            holders[title] = _reset_or_add(spreadsheet, title, rows, cols)
            _write_grid(spreadsheet, holders[title], grid)

        for row, col, target in index_grid['links']:
            gid = holders[target].id
            formula = f'=HYPERLINK("#gid={gid}","Open")'
            try:
                holders[SHEET_INDEX].update(
                    [[formula]],
                    f'{_a1(row, col)}',
                    value_input_option='USER_ENTERED',
                )
            except TypeError:
                holders[SHEET_INDEX].update(
                    f'{_a1(row, col)}',
                    [[formula]],
                    value_input_option='USER_ENTERED',
                )

        keep = set(order)
        for worksheet in list(spreadsheet.worksheets()):
            if worksheet.title not in keep and len(spreadsheet.worksheets()) > 1:
                spreadsheet.del_worksheet(worksheet)
        try:
            spreadsheet.reorder_worksheets([holders[title] for title in order])
        except Exception:
            pass
        try:
            holders[SHEET_ALL].update_tab_color(_rgb(COLOR_TITLE))
            holders[SHEET_INDEX].update_tab_color(_rgb('#5f6368'))
        except Exception:
            pass
        _share(spreadsheet, share_with, link_sharing)
        print(f"  {county['label']} ({action}): {spreadsheet.url}")
        written.append({'county': county['label'], 'action': action, 'url': spreadsheet.url})

    print(f'Folder: https://drive.google.com/drive/folders/{month_id}')
    return written


def _a1(row, col):
    letters = ''
    n = col + 1
    while n:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return f'{letters}{row + 1}'


def describe_plan(data, report_month=None):
    """Print the files that would be created, without touching Drive."""
    global df
    if data is not None:
        df = data
    elif df is None:
        prepare_data()
    export_period = report_period(report_month)
    plan = build_export_plan(df, export_period)
    print(f"{export_period.strftime('%b %Y')}: {len(plan)} county file(s)")
    for county in plan:
        print(
            f"  {county['label']}: {county['this_month']} deliveries, "
            f"{len(county['facilities'])} facility tab(s), "
            f"{len(county['silent'])} with no submission"
        )
    return plan
