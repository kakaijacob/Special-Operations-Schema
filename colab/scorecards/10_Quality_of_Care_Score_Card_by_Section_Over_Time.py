# @title Quality of Care Score Card by Section Over Time

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import ipywidgets as widgets
from IPython.display import display, HTML, Javascript, clear_output

# ----------------------------
# DATA IMPORTATION
# ----------------------------
url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPEUzmFeJeSDdQySj9OinUnelYoHGaWtVaU0UIaKJU0v4UZoGp3VSTnlroBkl6GDmW1YZ9w1y4bAIY/pub?gid=1114469965&single=true&output=csv'
df = pd.read_csv(url)

# Ensure '_uuid' is available for unique delivery counting
if '_uuid' not in df.columns:
    df['_uuid'] = df.index

# Convert date + derive month period
df['date_submitted'] = pd.to_datetime(df['date_submitted'], errors='coerce')
df = df.dropna(subset=['date_submitted'])
df['month_period'] = df['date_submitted'].dt.to_period('M')

# ----------------------------
# POWER BI-STYLE DROPDOWN SLICER
# ----------------------------
class Slicer:
    """Dropdown header (shows 'All' / selection) that opens a panel with a search box,
    Select all and a scrollable checkbox list. Nothing ticked = All.
    Options can be rebuilt with set_options() (used for the County -> Facility cascade)."""

    BLANK = "(Blank)"

    def __init__(self, data, column, title, width='230px', height='200px'):
        self.column = column
        self._callbacks = []
        self._busy = False
        self._open = False
        self.options = []
        self.checks = {}

        # Title bar + dropdown header
        self.title = widgets.HTML(
            f"<div style='background:#2b8aa8; color:white; font-weight:bold; "
            f"padding:4px 8px; width:{width}; box-sizing:border-box;'>{title}</div>"
        )
        self.header = widgets.Button(
            description='All  ▾',
            layout=widgets.Layout(width=width, height='30px', margin='0')
        )

        # Panel contents
        self.search = widgets.Text(
            placeholder='🔍 Search',
            layout=widgets.Layout(width=width)
        )
        self.select_all = widgets.Checkbox(
            value=False, description='Select all', indent=False,
            layout=widgets.Layout(width='auto', margin='4px 0 0 0')
        )
        self.list_box = widgets.VBox(
            [],
            layout=widgets.Layout(
                height=height, width=width, overflow='auto',
                border='1px solid #ddd', padding='4px'
            )
        )
        self.panel = widgets.VBox(
            [self.search, self.select_all, self.list_box],
            layout=widgets.Layout(display='none', width=width, border='1px solid #ccc', padding='4px')
        )

        # Events
        self.header.on_click(self._toggle)
        self.search.observe(self._on_search, names='value')
        self.select_all.observe(self._on_select_all, names='value')

        self.widget = widgets.VBox(
            [self.title, self.header, self.panel],
            layout=widgets.Layout(margin='0 16px 0 0', align_items='flex-start')
        )
        self.widget.add_class('slicer-root')
        self.header.add_class('slicer-header')
        self.panel.add_class('slicer-panel')

        # Build the checkbox list from the data
        self.set_options(data[column])

    # ---- (re)build the option list ----
    def set_options(self, column_values):
        """Rebuild the list from a pandas Series. Ticks that are still valid are kept."""
        keep = {str(o) for o in self.options if o in self.checks and self.checks[o].value}

        values = sorted(column_values.dropna().unique().tolist())
        has_blank = column_values.isna().any()

        self._busy = True
        self.options = ([self.BLANK] if has_blank else []) + values
        self.checks = {
            opt: widgets.Checkbox(
                value=(str(opt) in keep), description=str(opt), indent=False,
                layout=widgets.Layout(width='auto', margin='0', flex='0 0 auto')
            )
            for opt in self.options
        }
        for chk in self.checks.values():
            chk.observe(self._on_check, names='value')

        self.search.value = ''
        self.list_box.children = list(self.checks.values())
        self._busy = False

        self._sync_select_all()
        self._update_header()

    # ---- helpers ----
    def _visible_options(self):
        term = self.search.value.strip().lower()
        return [o for o in self.options if term in str(o).lower()]

    def _sync_select_all(self):
        visible = self._visible_options()
        all_on = bool(visible) and all(self.checks[o].value for o in visible)
        self._busy = True
        self.select_all.value = all_on
        self._busy = False

    def _update_header(self):
        ticked = [str(o) for o in self.options if self.checks[o].value]
        if not ticked or len(ticked) == len(self.options):
            text = "All"
        elif len(ticked) <= 2:
            text = ", ".join(ticked)
        else:
            text = f"{len(ticked)} selected"
        if len(text) > 24:
            text = text[:22] + "…"
        arrow = "▴" if self._open else "▾"
        self.header.description = f"{text}  {arrow}"

    def _fire(self):
        for cb in self._callbacks:
            cb()

    # ---- event handlers ----
    def _toggle(self, _):
        self._open = not self._open
        self.panel.layout.display = 'flex' if self._open else 'none'
        self._update_header()

    def _on_search(self, change):
        visible = self._visible_options()
        self.list_box.children = [self.checks[o] for o in visible]
        self._sync_select_all()

    def _on_select_all(self, change):
        if self._busy:
            return
        self._busy = True
        for o in self._visible_options():          # only affects what the search shows
            self.checks[o].value = change['new']
        self._busy = False
        self._update_header()
        self._fire()

    def _on_check(self, change):
        if self._busy:
            return
        self._sync_select_all()
        self._update_header()
        self._fire()

    # ---- public API ----
    @property
    def selected(self):
        """List of ticked values (None stands for Blank). Empty list = no filter."""
        return [None if o == self.BLANK else o for o in self.options if self.checks[o].value]

    def on_change(self, callback):
        self._callbacks.append(callback)


def apply_slicer(data, column, selected):
    """Filter rows to the ticked values. Empty selection = All."""
    if not selected:
        return data
    mask = data[column].isin([v for v in selected if v is not None])
    if None in selected:
        mask = mask | data[column].isna()
    return data[mask]

    """Filter rows to the ticked values. Empty selection = All."""
    if not selected:
        return data
    mask = data[column].isin([v for v in selected if v is not None])
    if None in selected:
        mask = mask | data[column].isna()
    return data[mask]

# ----------------------------
# WIDGETS (FILTERS)
# ----------------------------
county_slicer = Slicer(df, 'county', 'County')
facility_slicer = Slicer(df, 'facility', 'Facility')
cadre_slicer = Slicer(df, 'cadre', 'Cadre')

def update_facility_options(*_):
    """Show only facilities belonging to the selected county(ies). No county ticked = all."""
    subset = apply_slicer(df, 'county', county_slicer.selected)
    facility_slicer.set_options(subset['facility'])


# Month range (From / To). "All" = no limit.
available_months = sorted(df['month_period'].dropna().unique().tolist())
month_options = [("All", None)] + [(m.strftime('%b %Y'), m) for m in available_months]

start_month_widget = widgets.Dropdown(
    options=month_options, value=None, description="From:",
    layout=widgets.Layout(width='220px'), style={'description_width': '45px'}
)
end_month_widget = widgets.Dropdown(
    options=month_options, value=None, description="To:",
    layout=widgets.Layout(width='220px'), style={'description_width': '45px'}
)

date_hint = widgets.HTML(
    f"<span style='color:grey; font-size:12px;'>Data available: "
    f"{available_months[0].strftime('%b %Y')} to {available_months[-1].strftime('%b %Y')}. "
    f"Month range: All = no limit. Nothing ticked in a list = All.</span>"
)

# ----------------------------
# GLOBAL INVALID VALUES
# ----------------------------
invalid_values = ["", "Unable to observe", "Not applicable", "NA", "N/A"]

# ----------------------------
# NORMALIZATION
# ----------------------------
def normalize(series):
    return series.astype(str).str.strip()

blood_loss_valid = ["Measure with a calibrated jar", "V drape", "Weighing of bloodsoaked materials"]

# ----------------------------
# INDICATORS
# ----------------------------
birth_preparedness = ['hand_hygiene', 'ppe_gloves', 'ppe_mask', 'ppe_gown', 'ppe_boots', 'ppe_goggles', 'ppe_cap', 'nnr_equipment_preparation', 'uterotonic_preparation']

emotive_indicators = ['uterine_massage_initiated', 'timely_uterine_massage',
                      'oxytocin_first_line', 'timely_oxytocin_administration',
                      'txa_administered', 'timely_txa_administration',
                      'iv_access_fluids', 'timely_iv_establishment']

# Technical Quality After Birth (29 indicators)
# = former "Technical Quality Immediately Following Birth" (21)
#   + former "Maternal Vitals & Documentation" (8)
tqab_indicators = ['ruleout_twin', 'uterotonic_administered', 'timely_uterotonic_administration', 'drying_stimulation', 'discard_wet_towel', 'skin_to_skin', 'adequate_skin_to_skin_time',
                   'timely_cord_clamp', 'sterilized_blade_clamp', 'newborn_kept_warm', 'controlled_cord_traction', 'placenta_examination', 'uterine_tone_assessed', 'laceration_check',
                   'method_blood_loss', 'proper_vdrape_use', 'maternal_bleeding_assessed',
                   'administer_vitamin_k', 'timely_vitamink_administration',
                   'provider_initiate_breastfeeding', 'timely_breastfeeding_initiation',
                   'take_mother_bp', 'timely_mother_bp',
                   'take_mother_temperature', 'timely_mother_temp',
                   'take_mother_pulse', 'timely_mother_pulse',
                   'apgar_min1', 'apgar_min5']

infection_indicators = ['sharps_disposal', 'waste_disposal']
rmc_indicators = ['birth_companion', 'provider_explanations', 'spoken_to_directly', 'spoken_to_kindly', 'rmc_no_disrespect_to_mother']
harm_indicators = ['fundal_pressure', 'perineum_stretching', 'newborn_slapped', 'newborn_upside_down']

partograph_indicators = ['partogragh_initiation', 'partograph_half_hr', 'fetal_heart_correct', 'maternal_pulse_correct', 'bp_4hrs', 'partograph_summary_filled', 'delivery_method_filled',
                         'blood_loss_estimation', 'partograph_accuracy_concern']

lcg_indicators = ['lcg_initiated_correct', 'contractions_monitored_1st', 'fhr_monitored_1st', 'bp_monitored_recorded', 'contractions_monitored_2nd', 'fhr_monitored_2nd', 'delivery_time_documented',
                  'delivery_method_documented', 'ebl_documented_correctly', 'lcg_accuracy_concerns']

# ----------------------------
# SCORE FUNCTION
# ----------------------------
def compute_score_unified(series, col_name):
    clean = series[~series.isin(invalid_values)].dropna()

    if col_name == "uterotonic_administered":
        valid_responses = series[~series.isin(invalid_values)]
        yes_count = (valid_responses != "None of the above").sum()
        no_count = (valid_responses == "None of the above").sum()

    elif col_name == "method_blood_loss":
        yes_count = clean.isin(blood_loss_valid).sum()
        no_count = len(clean) - yes_count

    elif col_name in ["provider_explanations", "spoken_to_directly", "spoken_to_kindly"]:
        yes_count = (clean.isin(["Yes", "Always"])).sum()
        no_count = (clean.isin(["No", "Sometimes", "Rarely", "Never"])).sum()

    elif col_name in harm_indicators + ["partograph_accuracy_concern", "lcg_accuracy_concerns"]:
        yes_count = (clean == "No").sum()
        no_count = (clean == "Yes").sum()

    else:
        yes_count = (clean == "Yes").sum()
        no_count = (clean == "No").sum()

    denom = yes_count + no_count
    if denom == 0:
        return np.nan

    return yes_count / denom

# ----------------------------
# STATUS + TREND FUNCTIONS
# ----------------------------
def status_icon(score):
    if pd.isna(score):
        return "⚪"
    elif score >= 80:
        return "🟢"
    elif score >= 60:
        return "🟠"
    else:
        return "🔴"

def trend_icon(current, previous):
    """Change from previous month to current month, in percentage points (pp)."""
    if pd.isna(current) or pd.isna(previous):
        return '<span style="color:grey; font-weight:bold;">▬ N/A</span>'

    diff = current - previous
    diff_str = f" ({abs(diff):.1f}%)"

    if diff > 0:
        return f'<span style="color:green; font-size:14px; font-weight:bold;">▲{diff_str}</span>'
    elif diff < 0:
        return f'<span style="color:red; font-size:14px; font-weight:bold;">▼{diff_str}</span>'
    else:
        return f'<span style="color:grey; font-size:14px; font-weight:bold;">▬{diff_str}</span>'

def section_score_for_period(data, indicators, period):
    """Mean indicator score (0-100) for one section in one month."""
    sub = data[data['month_period'] == period]
    scores = [compute_score_unified(sub[c], c) for c in indicators]
    scores = [s for s in scores if not pd.isna(s)]
    return np.mean(scores) * 100 if scores else np.nan

# ----------------------------
# MAIN SCORECARD FUNCTION
# ----------------------------
def build_section_scorecard(counties, facilities, cadres, start_month, end_month):

    # 1) Apply the categorical (slicer) filters. Nothing ticked = All.
    base_df = df.copy()
    base_df = apply_slicer(base_df, "county", counties)
    base_df = apply_slicer(base_df, "facility", facilities)
    base_df = apply_slicer(base_df, "cadre", cadres)

    if base_df.empty:
        display(HTML("<h3>No data available for the selected filters.</h3>"))
        return

    # 2) Apply the month range (inclusive of both the From and To months).
    if start_month is not None and end_month is not None and start_month > end_month:
        display(HTML("<h3>The 'From' month must be on or before the 'To' month.</h3>"))
        return

    range_df = base_df.copy()
    if start_month is not None:
        range_df = range_df[range_df['month_period'] >= start_month]
    if end_month is not None:
        range_df = range_df[range_df['month_period'] <= end_month]

    if range_df.empty:
        display(HTML("<h3>No data available for the selected filters and month range.</h3>"))
        return

    section_mapping = {
        "Birth Preparedness": birth_preparedness,
        "Technical Quality After Birth": tqab_indicators,
        "Postbirth Infection Prevention": infection_indicators,
        "Respectful Maternity Care": rmc_indicators,
        "Avoidance Harmful Practices": harm_indicators,
        "Partograph Review": partograph_indicators,
        "Labor Care Guide Review": lcg_indicators,
        "EMOTIVE": emotive_indicators
    }

    # Months shown as columns = months that fall inside the selected range
    months_to_display = sorted(range_df['month_period'].dropna().unique().tolist())

    if not months_to_display:
        display(HTML("<h3>No monthly data available for trend calculation.</h3>"))
        return

    # ---- TREND: 'To' month vs the month before it ----
    if end_month is not None:
        trend_month = end_month
    else:
        trend_month = pd.Period(pd.Timestamp.today(), freq='M')   # current month
    prev_month = trend_month - 1

    trend_col = "Trend"

    rows = []

    for section_name, indicators in section_mapping.items():
        if not all(col in range_df.columns for col in indicators):
            continue

        indicator_row = {"Section": section_name}

        # Overall score for the selected filters + month range
        overall_scores_list = []
        for col in indicators:
            score = compute_score_unified(range_df[col], col)
            if not pd.isna(score):
                overall_scores_list.append(score)
        overall_mean_score = np.mean(overall_scores_list) * 100 if overall_scores_list else np.nan
        indicator_row["Score"] = f"{overall_mean_score:.1f}%" if not pd.isna(overall_mean_score) else "N/A"

        # Monthly columns (within the range)
        for m in months_to_display:
            s = section_score_for_period(range_df, indicators, m)
            indicator_row[m.strftime('%b %Y')] = f"{s:.1f}%" if not pd.isna(s) else "N/A"

        # Trend uses base_df (not month-limited) so the previous month is always available
        current_score = section_score_for_period(base_df, indicators, trend_month)
        previous_score = section_score_for_period(base_df, indicators, prev_month)

        indicator_row["Status"] = status_icon(overall_mean_score)
        indicator_row[trend_col] = trend_icon(current_score, previous_score)
        rows.append(indicator_row)

    scorecard_df = pd.DataFrame(rows)

    # Convert 'Score' column to numeric for sorting, handling 'N/A'
    scorecard_df['Sort_Score'] = scorecard_df['Score'].str.replace('%', '').replace('N/A', np.nan).astype(float)
    scorecard_df = scorecard_df.sort_values(by='Sort_Score', ascending=True).drop(columns=['Sort_Score'])

    # Reorder columns: Section, Score, monthly scores (chronological), Status, Trend
    ordered_columns = ["Section", "Score"] + [m.strftime('%b %Y') for m in months_to_display] + ["Status", trend_col]
    scorecard_df = scorecard_df[ordered_columns]

    start_label = start_month.strftime('%b %Y') if start_month is not None else 'start'
    end_label = end_month.strftime('%b %Y') if end_month is not None else 'latest'
    display(HTML(
        f"<p style='margin:4px 0;'><b>Month range:</b> {start_label} to {end_label} &nbsp;|&nbsp; "
        f"<b>Trend:</b> {trend_month.strftime('%b %Y')} vs {prev_month.strftime('%b %Y')}</p>"
    ))
    display(
        scorecard_df.style
        .set_properties(**{'text-align': 'left'})
        .set_table_styles([
            {'selector': 'th',
             'props': [('text-align', 'left'), ('background-color', '#f2f2f2'), ('font-weight', 'bold')]},
            {'selector': 'td', 'props': [('border', '1px solid #ddd'), ('padding', '8px')]},
            {'selector': 'tr:nth-child(even)', 'props': [('background-color', '#f9f9f9')]},
            {'selector': 'tr:hover', 'props': [('background-color', '#f5f5f5')]}
        ])
        .hide(axis='index')
    )

# ----------------------------
# INTERACTIVE DISPLAY
# ----------------------------
out = widgets.Output()

def refresh(*_):
    with out:
        clear_output(wait=True)
        build_section_scorecard(
            county_slicer.selected,
            facility_slicer.selected,
            cadre_slicer.selected,
            start_month_widget.value,
            end_month_widget.value
        )

# Order matters: County change first narrows the Facility list, then the scorecard redraws.
county_slicer.on_change(update_facility_options)
county_slicer.on_change(refresh)
facility_slicer.on_change(refresh)
cadre_slicer.on_change(refresh)
start_month_widget.observe(refresh, names='value')
end_month_widget.observe(refresh, names='value')

month_box = widgets.VBox([
    widgets.HTML(
        "<div style='background:#2b8aa8; color:white; font-weight:bold; "
        "padding:4px 8px; width:220px; box-sizing:border-box;'>Month range</div>"
    ),
    start_month_widget, end_month_widget
])
ui = widgets.VBox([
    widgets.HBox(
        [county_slicer.widget, facility_slicer.widget, cadre_slicer.widget, month_box],
        layout=widgets.Layout(align_items='flex-start')
    ),
    date_hint
])

display(ui, out)
refresh()

# ----------------------------
# AUTO-CLOSE DROPDOWNS ON OUTSIDE CLICK
# ----------------------------
display(Javascript("""
(function () {
  if (window._slicerCleanup) { window._slicerCleanup(); }

  // Close every open slicer (header text ends in ▴), except the one containing 'keepTarget'
  function closeSlicers(keepTarget) {
    document.querySelectorAll('button').forEach(function (btn) {
      if (!/▴\\s*$/.test(btn.textContent)) return;
      var root = btn.closest('.widget-vbox') || btn.parentElement;
      if (keepTarget && root && root.contains(keepTarget)) return;
      btn.click();   // uses the existing toggle so the arrow and label update
    });
  }

  function onDown(e)  { closeSlicers(e.target); }
  function onBlur()   { closeSlicers(null); }
  function onLeave()  { closeSlicers(null); }

  document.addEventListener('mousedown', onDown, true);
  document.addEventListener('touchstart', onDown, true);
  window.addEventListener('blur', onBlur);
  document.documentElement.addEventListener('mouseleave', onLeave);

  window._slicerCleanup = function () {
    document.removeEventListener('mousedown', onDown, true);
    document.removeEventListener('touchstart', onDown, true);
    window.removeEventListener('blur', onBlur);
    document.documentElement.removeEventListener('mouseleave', onLeave);
  };
  console.log('slicer auto-close active');
})();
"""))
