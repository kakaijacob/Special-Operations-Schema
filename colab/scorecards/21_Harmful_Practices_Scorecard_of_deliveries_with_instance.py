# @title Harmful Practices Scorecard (% of deliveries with instance)

import pandas as pd
import numpy as np
import ipywidgets as widgets
from IPython.display import display, HTML, Javascript, clear_output

# ----------------------------
# DATA IMPORTATION
# ----------------------------
url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPEUzmFeJeSDdQySj9OinUnelYoHGaWtVaU0UIaKJU0v4UZoGp3VSTnlroBkl6GDmW1YZ9w1y4bAIY/pub?gid=1114469965&single=true&output=csv'
df = pd.read_csv(url)

if '_uuid' not in df.columns:
    df['_uuid'] = df.index

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
# INDICATORS
# ----------------------------
harm_indicators = {
    'fundal_pressure': '% deliveries with fundal pressure',
    'perineum_stretching': '% deliveries with perineum stretching',
    'newborn_slapped': '% deliveries with newborn slapping',
    'newborn_upside_down': '% deliveries with newborn held upside down'
}

# ----------------------------
# YES / OBSERVED COUNTS
# ----------------------------
def yes_and_total(series):
    """Returns (yes_count, observed_count). Observed = Yes + No only;
    'Unable to observe', 'Not applicable', blanks etc. are excluded."""
    clean = series.dropna().astype(str).str.strip().str.lower()
    yes = int((clean == "yes").sum())
    no = int((clean == "no").sum())
    return yes, yes + no

def pct(series):
    yes, total = yes_and_total(series)
    return np.nan if total == 0 else yes / total * 100

def fmt_cell(series):
    yes, total = yes_and_total(series)
    if total == 0:
        return "N/A"
    return f"{yes / total * 100:.1f}%"

# ----------------------------
# STATUS + TREND (lower % = better)
# ----------------------------
def status_icon(p):
    if pd.isna(p):
        return "⚪"
    elif p == 0:
        return "🟢"
    elif p <= 5:          # adjust thresholds as needed
        return "🟠"
    else:
        return "🔴"

def trend_icon(current, previous):
    """Change in % from previous month to current month. Increase = BAD (red), decrease = GOOD (green)."""
    if pd.isna(current) or pd.isna(previous):
        return '<span style="color:grey; font-weight:bold;">▬ N/A</span>'

    diff = current - previous
    diff_str = f" ({abs(diff):.1f}%)"

    if diff > 0:
        return f'<span style="color:red; font-size:14px; font-weight:bold;">▲{diff_str}</span>'
    elif diff < 0:
        return f'<span style="color:green; font-size:14px; font-weight:bold;">▼{diff_str}</span>'
    else:
        return f'<span style="color:grey; font-size:14px; font-weight:bold;">▬{diff_str}</span>'

# ----------------------------
# FILTER WIDGETS
# ----------------------------
county_slicer = Slicer(df, 'county', 'County')
facility_slicer = Slicer(df, 'facility', 'Facility')

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
# SCORECARD FUNCTION
# ----------------------------
def build_harm_scorecard(counties, facilities, start_month, end_month):

    # 1) Apply the categorical (slicer) filters. Nothing ticked = All.
    base_df = df.copy()
    base_df = apply_slicer(base_df, 'county', counties)
    base_df = apply_slicer(base_df, 'facility', facilities)

    if base_df.empty:
        display(HTML("<h3>No data available for the selected filters.</h3>"))
        return

    # 2) Apply the month range (inclusive of both the From and To months).
    if start_month is not None and end_month is not None and start_month > end_month:
        display(HTML("<h3>The 'From' month must be on or before the 'To' month.</h3>"))
        return

    full_filtered_df = base_df.copy()
    if start_month is not None:
        full_filtered_df = full_filtered_df[full_filtered_df['month_period'] >= start_month]
    if end_month is not None:
        full_filtered_df = full_filtered_df[full_filtered_df['month_period'] <= end_month]

    if full_filtered_df.empty:
        display(HTML("<h3>No data available for the selected filters and month range.</h3>"))
        return

    # Months shown as columns = months that fall inside the selected range
    months_to_display = sorted(full_filtered_df['month_period'].dropna().unique().tolist())
    if not months_to_display:
        display(HTML("<h3>No monthly data available for trend calculation.</h3>"))
        return

    # ---- TREND: 'To' month vs the month before it ----
    if end_month is not None:
        trend_month = end_month
    else:
        trend_month = pd.Period(pd.Timestamp.today(), freq='M')   # current month
    prev_month = trend_month - 1

    # Taken from base_df (not month-limited) so the previous month is
    # available even if it is outside the selected range.
    df_trend_month = base_df[base_df['month_period'] == trend_month]
    df_prev_month = base_df[base_df['month_period'] == prev_month]

    rows = []

    for col, label in harm_indicators.items():
        if col not in df.columns:
            continue

        indicator_row = {"Indicator": label}

        indicator_row["Overall"] = fmt_cell(full_filtered_df[col])

        for m in months_to_display:
            df_m = full_filtered_df[full_filtered_df['month_period'] == m]
            indicator_row[m.strftime('%b %Y')] = fmt_cell(df_m[col])

        indicator_row["Status"] = status_icon(pct(full_filtered_df[col]))
        indicator_row["Trend"] = trend_icon(pct(df_trend_month[col]), pct(df_prev_month[col]))
        rows.append(indicator_row)

    if not rows:
        display(HTML("<h3>No indicator columns found for this section.</h3>"))
        return

    scorecard_df = pd.DataFrame(rows)

    ordered_columns = ["Indicator", "Overall"] + [m.strftime('%b %Y') for m in months_to_display] + ["Status", "Trend"]
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
            {'selector': 'th', 'props': [('text-align', 'left'), ('background-color', '#f2f2f2'), ('font-weight', 'bold')]},
            {'selector': 'td', 'props': [('border', '1px solid #ddd'), ('padding', '8px')]},
            {'selector': 'tr:nth-child(even)', 'props': [('background-color', '#f9f9f9')]},
            {'selector': 'tr:hover', 'props': [('background-color', '#f5f5f5')]}
        ])
        .hide(axis='index')
    )

# ----------------------------
# RUN DASHBOARD
# ----------------------------
out = widgets.Output()

def refresh(*_):
    with out:
        clear_output(wait=True)
        build_harm_scorecard(
            county_slicer.selected,
            facility_slicer.selected,
            start_month_widget.value,
            end_month_widget.value
        )

# Order matters: County change first narrows the Facility list, then the scorecard redraws.
county_slicer.on_change(update_facility_options)
county_slicer.on_change(refresh)
facility_slicer.on_change(refresh)
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
        [county_slicer.widget, facility_slicer.widget, month_box],
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
