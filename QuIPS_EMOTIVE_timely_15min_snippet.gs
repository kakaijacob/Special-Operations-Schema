//==============EMOTIVE TIMELY FIELDS (15-minute threshold = 900s)==============
// Paste over the existing timely_* EMOTIVE IIFEs only.

      timely_uterine_massage:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const u = timeToSeconds(formatTime(flat["technical_quality/uterine_massage_time"]));

        if (p == null || u == null) return "";
        const diff = u - p;
        if (diff < 0) return "";
        return (u - p <= 900) ? "Yes" : "No";
      })(),

      timely_oxytocin_administration:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const o = timeToSeconds(formatTime(flat["technical_quality/oxytocin_administration_time"]));

        if (p == null || o == null) return "";
        const diff = o - p;
        if (diff < 0) return "";
        return (o - p <= 900) ? "Yes" : "No";
      })(),

      timely_txa_administration:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const t = timeToSeconds(formatTime(flat["technical_quality/txa_administration_time"]));

        if (p == null || t == null) return "";
        const diff = t - p;
        if (diff < 0) return "";
        return (t - p <= 900) ? "Yes" : "No";
      })(),

      timely_iv_establishment:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const i = timeToSeconds(formatTime(flat["technical_quality/iv_establishment_time"]));

        if (p == null || i == null) return "";
        const diff = i - p;
        if (diff < 0) return "";
        return (i - p <= 900) ? "Yes" : "No";
      })(),
