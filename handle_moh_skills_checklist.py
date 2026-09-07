import logging
import re
from sqlalchemy.sql.sqltypes import Boolean

from app.handle_mentee_curriculum_tracking import find_key_with_prefix
from models import MOHSkillsChecklist
from models.db_helper import DBHelper
from utils.date_parser import custom_date_parser
from typing import Any, Dict, List, Union
from app.google_sheet import GoogleSheetAuth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# oogle Sheet key and worksheet name
GOOGLE_SHEET_KEY = "1EpplypjBI5HLnmIuM_Vu6CKgnL1S8cz9e1SJRIIGqWA"
WORKSHEET_NAME = "moh_skills_checklist"

google_sheet = GoogleSheetAuth()

SPECIFIC_FIELD_PREFIXES = (
    "group_shoulder_dystocia",
    "group_perineal_tear",
    "group_nasg",
    "group_nnr",
    "group_maternal_shock",
    "group_maternal_resuscitation",
    "group_manual_placenta_removal",
    "group_UBT",
    "group_ubt_free_flow",
    "group_aortic_compression",
    "group_cervical_tear",
    "group_bimanual_compressions",
    "group_b-lynch",
    "group_assisted_breech",
    "group_avd",
    "group_amtsl",
    "group_cord_prolapse",
    "group_hip",
    "group_emotive",
    "group_partograph",
    "group_Uterine_inversion",
    "skills_assessment/group_shoulder_dystocia",
    "skills_assessment/group_perineal_tear",
    "skills_assessment/group_nasg",
    "skills_assessment/group_nnr",
    "skills_assessment/group_maternal_shock",
    "skills_assessment/group_maternal_resuscitation",
    "skills_assessment/group_manual_placenta_removal",
    "skills_assessment/group_UBT",
    "skills_assessment/group_ubt_free_flow",
    "skills_assessment/group_aortic_compression",
    "skills_assessment/group_cervical_tear",
    "skills_assessment/group_bimanual_compressions",
    "skills_assessment/group_b-lynch",
    "skills_assessment/group_assisted_breech",
    "skills_assessment/group_avd",
    "skills_assessment/group_amtsl",
    "skills_assessment/group_cord_prolapse",
    "skills_assessment/group_hip",
    "skills_assessment/group_emotive",
    "skills_assessment/group_partograph",
    "skills_assessment/group_Uterine_inversion",
)
SPECIFIC_FIELD_PREFIX_MATCHES = tuple(f"{prefix}/" for prefix in SPECIFIC_FIELD_PREFIXES)

FIELD_ALIASES = {
    "hors_off_breech": "hands_off_breech",
}

COMMENT_FIELD_MARKERS = ("comment", "_omment")

REQUIRED_FIELDS = (
    "mentee_id",
    "mentee_name",
    "county",
    "facility",
    "facility_code",
    "skill_evaluation",
)

SELECT_MULTIPLE_FIELD_MAPS = {
    "review_anc_history": {
        "gestational_age": ("q1a_gestational_age",),
        "maternal_comorbidities_complications": (
            "q1a_maternal_comorbidities",
            "q1a_complications",
        ),
        "prenatal_care_visits": ("q1a_prenatal_care_visits",),
        "anc_profile_lab_work": ("q1a_anc_profile_lab_work",),
        "anc_profile_lab_works": ("q1a_anc_profile_lab_work",),
        "ultrasound_report_if_any": ("q1a_sultrasound_report_if_any",),
        "missed_all_steps": ("q1a_missed_all_steps",),
    },
    "check_safety": {
        "warm_room_25_28c_digital_room_thermometer": (
            "q1b_warm_room_25_28c",
            "q1b_digital_room_thermometer",
        ),
        "environment_no_sharps_spilage": ("q1b_environment_no_sharps_spilage",),
        "gloves_both_sterile_and_clean": ("q1b_gloves_both_sterile_and_clean",),
        "missed_all_steps": ("q1b_missed_all_steps",),
    },
    "check_equipment_warmth": {
        "perform_hand_hygiene_and_wear_clean_gloves": ("q1c_perform_hand_hygiene_and_wear_clean_gloves",),
        "radiant_warmer_prewarm_mode_with_two_towels_and_hat": (
            "q1c_radiant_warmer_prewarm_mode_with_two_towels_and_hat",
        ),
        "two_prewarmed_towels_and_hat": ("q1c_two_prewarmed_towels_and_hat",),
        "mentions_about_clock": ("q1c_mentions_about_clock",),
        "missed_all_steps": ("q1c_missed_all_steps",),
    },
    "check_airway": {
        "penguine_sucker_or_suction_machine": ("q1d_penguine_sucker_or_suction_machine",),
        "set_suction_machine_pressure_80_100mmhg": ("q1d_set_suction_machine_pressure_80_100mmhg",),
        "suction_catheter_6f_8f_and_wide_bore_yankauer_sucker": (
            "q1d_suction_catheter_6f_8f_and_wide_bore_yankauer_sucker",
        ),
        "equipment_clean_and_functionality_checked": ("q1d_equipment_clean_and_functionality_checked",),
        "missed_all_steps": ("q1d_missed_all_steps",),
    },
    "check_breathing": {
        "bvm_size_200_300ml": ("q1e_bvm_size_200_300ml",),
        "bvm_size_00_0_1": ("q1e_bvm_size_00_0_1",),
        "nasal_prongs": ("q1e_nasal_prongs",),
        "neonatal_non_rebreather_mask": ("q1e_neonatal_non_rebreather_mask",),
        "oxygen_source": ("q1e_oxygen_source",),
        "oxygen_tubings": ("q1e_oxygen_tubings",),
        "pulse_oximeter_with_neonatal_probe_cardiorespiratory_monitor": (
            "q1e_pulse_oximeter_with_neonatal_probe",
            "q1e_cardiorespiratory_monitor",
        ),
        "equipment_clean_and_functionality_checked": ("q1e_equipment_clean_and_functionality_checked",),
        "missed_all_steps": ("q1e_missed_all_steps",),
    },
    "check_circulation": {
        "stethoscope": ("q1f_stethoscope",),
        "iv_adrenaline_0_2ml_per_kg_1_10000": ("q1f_iv_adrenaline_0_2ml_per_kg_1_10000",),
        "normal_saline": ("q1f_normal_saline",),
        "missed_all_steps": ("q1f_missed_all_steps",),
    },
    "dry_stimulate": {
        "cry_respiratory_effort": ("q2_cry_respiratory_effort",),
        "tone_activity": ("q2_tone_activity",),
        "missed_all_steps": ("q2_missed_all_steps",),
    },
    "wet_dry_cloth": {
        "remove_wet_cloth": ("q3_remove_wet_cloth",),
        "wrap_in_dry_warm_towel_cloth": ("q3_wrap_in_dry_warm_towel_cloth",),
        "put_hat_on_baby_head": ("q3_put_hat_on_baby_head",),
        "missed_all_steps": ("q3_missed_all_steps",),
    },
    "immediate_nb_management": {
        "immediately_cut_cord": ("q4_immediately_cut_cord",),
        "place_baby_on_prewarmed_radiant_warmer": ("q4_place_baby_on_prewarmed_radiant_warmer",),
        "missed_all_steps": ("q4_missed_all_steps",),
    },
    "initial_abc_assessment": {
        "look_in_mouth_and_nose": ("q5_look_in_mouth_and_nose",),
        "clear_airway": ("q5_clear_airway",),
        "missed_all_steps": ("q5_missed_all_steps",),
    },
    "abc_assessment": {
        "open_airway_sniffing_position_head_tilt_chin_lift": (
            "q6_open_airway_sniffing_position_head_tilt_chin_lift",
        ),
        "look_listen_feel_breathing_5_seconds": ("q6_look_listen_feel_breathing_5_seconds",),
        "missed_all_steps": ("q6_missed_all_steps",),
    },
    "begin_bvm": {
        "size_bvm_mask": ("q8_size_bvm_mask",),
        "good_c_and_e_grip": ("q8_good_c_and_e_grip",),
        "give_40_60_continuous_ventilations_60_seconds": (
            "q8_give_40_60_continuous_ventilations_60_seconds",
        ),
        "correct_rate_breath_two_three": ("q8_correct_rate_breath_two_three",),
        "ensure_chest_rises": ("q8_ensure_chest_rises",),
        "missed_all_steps": ("q8_missed_all_steps",),
    },
    "assess_pulse": {
        "feel_umbilical_pulse_5_seconds": ("q9_feel_umbilical_pulse_5_seconds",),
        "connect_bvm_to_100_percent_oxygen": ("q9_connect_bvm_to_100_percent_oxygen",),
        "connect_pulse_oximeter": ("q9_connect_pulse_oximeter",),
        "missed_all_steps": ("q9_missed_all_steps",),
    },
    "continue_bvm": {
        "give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute": (
            "q10_give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute",
        ),
        "use_2_thumb_hand_encircling_technique": ("q10_use_2_thumb_hand_encircling_technique",),
        "location_lower_1_3_sternum": ("q10_location_lower_1_3_sternum",),
        "compress_1_3_ap_diameter": ("q10_compress_1_3_ap_diameter",),
        "allow_chest_to_recoil": ("q10_allow_chest_to_recoil",),
        "about_120_events_30_ventilations_90_chest_compressions_per_minute": (
            "q10_about_120_events_30_ventilations_90_chest_compressions_per_minute",
        ),
        "missed_all_steps": ("q10_missed_all_steps",),
    },
    "vetilations": {
        "give_ventilations_40_60_breaths_per_min_60_seconds": (
            "q12_give_ventilations_40_60_breaths_per_min_60_seconds",
        ),
        "give_ventilations_40_60_breaths_per_min_60_seconds_chest_rise": (
            "q12_give_ventilations_40_60_breaths_per_min_60_seconds",
            "q12_chest_rise_checking_for_chest_movement",
        ),
        "checking_for_chest_movement": ("q12_chest_rise_checking_for_chest_movement",),
        "chest_rise_checking_for_chest_movement": ("q12_chest_rise_checking_for_chest_movement",),
        "ensure_baby_kept_warm": ("q12_ensure_baby_kept_warm",),
        "missed_all_steps": ("q12_missed_all_steps",),
    },
    "post_resus_stablization": {
        "connect_pulse_oximeter_and_monitor_spo2": ("q14_connect_pulse_oximeter_and_monitor_spo2",),
        "monitor_breathing_adequacy": ("q14_monitor_breathing_adequacy",),
        "switch_to_baby_mode_on_radiant_warmer": ("q14_switch_to_baby_mode_on_radiant_warmer",),
        "give_oxygen_using_nrm_10l_min": ("q14_give_oxygen_using_nrm_10l_min",),
        "give_oxygen_using_nrm_10l_min_monitor_spo2_and_work_of_breathing": (
            "q14_give_oxygen_using_nrm_10l_min",
            "q14_monitor_spo2_and_work_of_breathing",
        ),
        "monitor_spo2_and_work_of_breathing": ("q14_monitor_spo2_and_work_of_breathing",),
        "titrate_wean_off_oxygen_based_on_spo2": ("q14_titrate_wean_off_oxygen_based_on_spo2",),
        "ensure_baby_kept_warm_36_5_37_5c": ("q14_ensure_baby_kept_warm_36_5_37_5c",),
        "missed_all_steps": ("q14_missed_all_steps",),
    },
    "continue_observation": {
        "airway": ("q15_airway",),
        "breathing": ("q15_breathing",),
        "circulation": ("q15_circulation",),
        "disability": ("q15_disability",),
        "exposure": ("q15_exposure",),
        "ifcdc": ("q15_ifcdc",),
        "missed_all_steps": ("q15_missed_all_steps",),
    },
}

MODEL_FIELD_NAMES = {column.key for column in MOHSkillsChecklist.__table__.columns}
BOOLEAN_MODEL_FIELD_NAMES = {
    column.key
    for column in MOHSkillsChecklist.__table__.columns
    if isinstance(column.type, Boolean)
}


def handle_moh_skills_checklist(data):
    # logger.info(f"Request Data: {data}")
    try:
        processed_checklist_data = process_checklist_data(data)
        google_sheet.write_moh_checklist_data(
            processed_checklist_data, GOOGLE_SHEET_KEY, WORKSHEET_NAME
        )
        db_helper = DBHelper(MOHSkillsChecklist)
        db_helper.bulk_insert(processed_checklist_data)
    except Exception as e:
        logger.error("Error processing data", exc_info=True)
        raise e  # Rethrow the exception to be caught by the Flask handler


def process_checklist_data(data):
    common_fields = extract_common_fields(data)
    specific_fields = extract_specific_fields(data)
    processed_data = {**common_fields, **specific_fields}
    validate_required_fields(processed_data)
    return [processed_data]


def extract_common_fields(data):
    start_date = custom_date_parser(data.get("start"))
    end_date = custom_date_parser(data.get("end"))
    return {
        "submission_id": data.get("_id"),
        "date_started": start_date,
        "date_ended": end_date,
        "date_submitted": custom_date_parser(data.get("_submission_time")),
        "session_date": custom_date_parser(
            get_first(data, "group_mentorship_details/mentor_details/evaluation_date")
        ),
        "mentor_name": format_name(
            get_first(data, "group_mentorship_details/mentor_details/mentor_name")
        ),
        "program": format_choice(
            get_first(data, "group_mentorship_details/mentor_details/program")
        ),
        "county": get_first(
            data,
            "group_mentorship_details/county",
            "group_mentorship_details/mentee_details/county",
        ),
        "facility": extract_facility(data),
        "facility_code": extract_facility_code(data),
        "mentee_id": extract_mentee_id(data),
        "mentee_name": extract_mentee_name(data),
        "skill_evaluation": extract_skill_evaluation(data),
    }


def get_first(data, *keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None


def format_name(value):
    if not value:
        return None
    raw = str(value).strip()
    if raw.isupper() and any(ch.isalpha() for ch in raw):
        return raw
    parts = re.split(r"[/,]", raw.replace("_", " "))
    return "/".join(part.strip().title() for part in parts if part.strip())


def format_choice(value):
    if not value:
        return None
    formatted = str(value).replace("_", " ").strip()
    return formatted[:1].upper() + formatted[1:].lower()


def extract_skill_evaluation(data):
    skill_evaluation_keys = (
        "group_skills_checklist/skill_evaluation",
        "skills_assessment/group_skills_checklist/skill_evaluation",
    )
    for key in skill_evaluation_keys:
        value = data.get(key)
        if value:
            return normalize_skill_evaluation(value)
    return None


def normalize_skill_evaluation(value):
    text = str(value).replace("_", " ").strip()
    return " ".join(text.split()) if text else None


def extract_facility(data):
    facility_key = find_facility_key(data)
    if facility_key:
        value = data.get(facility_key)
        if not value:
            return None
        value = str(value)
        if "_" in value:
            return format_name(value.split("_", 1)[1])
        return format_name(value)
    return None


def extract_facility_code(data):
    facility_key = find_facility_key(data)
    if facility_key:
        value = data.get(facility_key)
        if value in (None, ""):
            return None
        value = str(value)
        if "_" in value:
            return value.split("_", 1)[0]
        return value
    return None


def find_facility_key(data):
    for key, value in data.items():
        if (
            key.startswith("group_mentorship_details/group_mentorship_facilities/")
            and "/mentees/" not in key
            and value not in (None, "")
        ):
            return key
    for key, value in data.items():
        if (
            key.startswith("group_mentorship_details/mentee_details/")
            and key.split("/")[-1].endswith("_facilities")
            and value not in (None, "")
        ):
            return key
    return None


def find_mentee_key(data):
    prefixes = (
        "group_mentorship_details/group_mentorship_facilities/mentees/",
        "group_mentorship_details/mentees/",
    )
    for prefix in prefixes:
        mentee_key = find_key_with_prefix(data, prefix)
        if mentee_key and data.get(mentee_key) not in (None, ""):
            return mentee_key
    return None


def extract_mentee_id(data):
    ifm_id = get_first(data, "group_mentorship_details/mentees/ifm_id")
    if ifm_id:
        return ifm_id
    lm_po = get_first(data, "group_mentorship_details/mentees/lm_po")
    if lm_po and "_" in lm_po:
        return lm_po.split("_", 1)[0]
    mentee_key = find_mentee_key(data)
    if mentee_key:
        mentee_id, _ = parse_mentee_reference(data[mentee_key], mentee_key)
        return mentee_id
    return None


def extract_mentee_name(data):
    ifm_name = get_first(data, "group_mentorship_details/mentees/ifm_name")
    if ifm_name:
        return format_name(ifm_name)
    lm_po = get_first(data, "group_mentorship_details/mentees/lm_po")
    if lm_po and "_" in lm_po:
        return format_name(lm_po.split("_", 1)[1])
    mentee_key = find_mentee_key(data)
    if mentee_key:
        _, mentee_name = parse_mentee_reference(data[mentee_key], mentee_key)
        return mentee_name
    return None


def parse_mentee_reference(value, mentee_key=None):
    if value in (None, ""):
        return None, None

    text = str(value).strip()
    if not text:
        return None, None

    candidate = text.lstrip("_")
    if not candidate:
        return None, None

    if "_" in candidate:
        first_token, remainder = candidate.split("_", 1)
        if first_token.isdigit():
            return first_token, format_name(remainder)
        return candidate, format_name(candidate)

    if mentee_key:
        key_name = mentee_key.rsplit("/", 1)[-1]
        if "_" in key_name:
            return candidate, format_name(key_name.split("_", 1)[1])

    return candidate, format_name(candidate)


def validate_required_fields(processed_data):
    missing_fields = [
        field
        for field in REQUIRED_FIELDS
        if processed_data.get(field) in (None, "", [])
    ]
    if missing_fields:
        raise ValueError(
            "Missing required MOH Skills fields: " + ", ".join(missing_fields)
        )


def parse_select_multiple(value):
    if value in (None, ""):
        return set()
    if isinstance(value, list):
        return {str(item).strip() for item in value if str(item).strip()}
    return {part for part in str(value).replace(",", " ").split() if part}


def coerce_kobo_value(value, *, boolean_field=False):
    if value in (None, ""):
        return None
    if not boolean_field:
        return value
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        tokens = {str(item).strip().lower() for item in value if str(item).strip()}
    else:
        normalized = str(value).strip().lower()
        tokens = {part for part in re.split(r"[\s,]+", normalized) if part}

    true_values = {"yes", "true", "1"}
    false_values = {"no", "false", "0"}
    if tokens and tokens <= true_values:
        return True
    if tokens and tokens <= false_values:
        return False
    if tokens and tokens <= true_values | false_values:
        return None
    return value


def normalize_field_name(field_name):
    normalized = field_name.lower()
    return FIELD_ALIASES.get(normalized, normalized)


def is_comment_field(field_name):
    return any(marker in field_name for marker in COMMENT_FIELD_MARKERS)


def expand_select_multiple(field_name, value):
    choice_map = SELECT_MULTIPLE_FIELD_MAPS[field_name]
    selected_choices = parse_select_multiple(value)
    if not selected_choices:
        return {}

    expanded = {target: False for targets in choice_map.values() for target in targets}
    for choice in selected_choices:
        for target in choice_map.get(choice, ()):
            expanded[target] = True
    return expanded


def extract_specific_fields(data):
    specific_fields = {}
    for key, value in data.items():
        if not key.startswith(SPECIFIC_FIELD_PREFIX_MATCHES):
            continue

        field_name = key.split("/")[-1]
        normalized_field = normalize_field_name(field_name)
        if is_comment_field(normalized_field):
            continue
        if normalized_field in SELECT_MULTIPLE_FIELD_MAPS:
            specific_fields.update(expand_select_multiple(normalized_field, value))
            continue

        mapped_value = coerce_kobo_value(
            value,
            boolean_field=normalized_field in BOOLEAN_MODEL_FIELD_NAMES,
        )
        if mapped_value is not None and normalized_field in MODEL_FIELD_NAMES:
            specific_fields[normalized_field] = mapped_value
    return specific_fields

