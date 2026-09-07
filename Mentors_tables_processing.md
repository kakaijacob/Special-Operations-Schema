# Processing Code Dump

## mentee_curriculum_tracking
- **File Path**: [handle_mentee_curriculum_tracking.py](file:///home/ichybell/Projects/data-warehouse/app/handle_mentee_curriculum_tracking.py)
- **Table(s)**: `MenteeCurriculumTracking, FacilityInattendanceReasons`
- **Highlight Function(s)**: `handle_mentee_curriculum_tracking`

```python
import logging
from typing import Any, Dict, Iterable, List, Optional, Tuple

from models import FacilityInattendanceReasons, MenteeCurriculumTracking
from models.db_helper import DBHelper
from utils.date_parser import custom_date_parser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

activity_to_topic_key_suffix = {
    "videos": ["videos"],
    "case_scenarios": ["case_scenarios"],
    "video_case_scenarios": ["video_scenarios"],
    "videoa_case_scenarios": ["video_scenarios"],
    "cmes": ["cmes"],
    "skill_demos_mentor": ["mentor_skills_demo"],
    "skills_demos_mentee": ["mentee_skills_return_demo"],
    "drills": ["drills"],
}

ACTIVITY_KEYS = [
    "emonc_training_curriculum/emonc_curriculum_activities/emonc_activities",
    "group_activities/activity",
    "mentor/group_activities/activity",
    "mentor_checklist/mentor/group_ek78v70/activity",
    "group_ek78v70/activity",
]

TOPIC_PREFIXES = [
    "emonc_training_curriculum/",
    "group_activities/",
    "mentor/group_activities/",
    "mentor_checklist/mentor/group_ek78v70/",
    "group_ek78v70/",
]

MENTEE_PREFIXES = [
    "demographic_information/mentee_details_001/",
    "demographic_information/mentee_details/",
    "mentor_checklist/mentor/mentees/",
    "mentor/",
]

FACILITY_PREFIXES = [
    "demographic_information/facility_details/",
    "demographic_information/mentee_details/",
    "mentor_checklist/mentor/q_facility_",
    "mentor/q_facility_",
    "q_facility_",
]

COUNTY_KEYS = [
    "demographic_information/facility_details/county",
    "demographic_information/mentee_details/county",
    "mentor_checklist/mentor/q_county",
    "mentor/q_county",
    "q_county",
]

MENTOR_NAME_KEYS = [
    "demographic_information/mentor_details/mentor_name",
    "mentor_checklist/mentor/name",
    "mentor/name",
    "name",
]

SESSION_DATE_KEYS = [
    "demographic_information/mentor_details/session_date",
    "mentor/session_date",
    "mentor_checklist/mentor/session_date",
    "session_date",
]

REASON_KEYS = [
    "group_mo8aa12/Reasons_for_inattendance",
    "mentor_checklist/mentor/group_mo8aa12/Reasons_for_inattendance",
    "mentor/group_mo8aa12/Reasons_for_inattendance",
]


def is_present(value: Any) -> bool:
    return value not in (None, "", [], {})


def find_key_with_prefix(data, prefix):
    """Find a key in the dictionary that starts with the given prefix."""
    for key in data:
        if isinstance(key, str) and key.startswith(prefix):
            return key
    return None


def get_first(data: Dict[str, Any], keys: Iterable[str]) -> Optional[Any]:
    for key in keys:
        value = data.get(key)
        if is_present(value):
            return value
    return None


def title_case_value(value: Any) -> Optional[str]:
    if not is_present(value):
        return None
    text = " ".join(str(value).replace("_", " ").strip().split())
    return text.title() if text else None


def normalize_mentor_name(value: Any) -> Optional[str]:
    if not is_present(value):
        return None
    text = str(value).replace(",", "/")
    names = [title_case_value(part) for part in text.split("/")]
    names = [name for name in names if name]
    return "/".join(names) if names else None


def parse_date(value: Any):
    if not is_present(value):
        return None
    try:
        return custom_date_parser(value)
    except ValueError:
        logger.warning("Unable to parse datetime value: %s", value, exc_info=True)
        return None


def parse_date_only(value: Any):
    parsed = parse_date(value)
    return parsed.date() if parsed else None


def split_tokens(value: Any) -> List[str]:
    if not is_present(value):
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [token for token in str(value).split() if token]


def normalize_activity(activity: str) -> str:
    if activity == "videoa_case_scenarios":
        return "video_case_scenarios"
    return activity


def parse_facility_value(value: Any) -> Tuple[Optional[int], Optional[str]]:
    if not is_present(value):
        return None, None
    raw = str(value).strip()
    parts = raw.split("_", 1)
    if len(parts) == 2 and parts[0].isdigit():
        return int(parts[0]), title_case_value(parts[1])
    return None, title_case_value(raw)


def facility_key_match(key: str, prefix: str) -> bool:
    if prefix.endswith("q_facility_"):
        return key.startswith(prefix)
    if not key.startswith(prefix):
        return False
    return key.endswith("_facilities") or key.endswith("/next_group_hide1")


def parse_facility(data):
    """Parse facility code and name from any supported Kobo schema."""
    for prefix in FACILITY_PREFIXES:
        for key, value in data.items():
            if isinstance(key, str) and facility_key_match(key, prefix) and is_present(value):
                return parse_facility_value(value)
    return None, None


def mentee_key_match(key: str, prefix: str) -> bool:
    if not key.startswith(prefix):
        return False
    tail = key.rsplit("/", 1)[-1].lower()
    return tail.endswith("_mentees") or "_mentees_" in tail or tail == "kibera_community"


def parse_mentee_ids(data):
    """Extract mentee IDs and names from any supported Kobo schema."""
    for prefix in MENTEE_PREFIXES:
        mentees = []
        for key, value in data.items():
            if isinstance(key, str) and mentee_key_match(key, prefix) and is_present(value):
                for token in split_tokens(value):
                    parts = token.split("_", 1)
                    if len(parts) == 2:
                        mentees.append(
                            {"id": parts[0], "name": title_case_value(parts[1])}
                        )
        if mentees:
            return mentees
    return []


def extract_submission_time(json_data):
    """Extract submission time; return None instead of failing for best-effort loads."""
    return parse_date(json_data.get("_submission_time"))


def extract_activities(json_data):
    """Extract activity tokens and the raw key that supplied them."""
    for key in ACTIVITY_KEYS:
        activities = split_tokens(json_data.get(key))
        if activities:
            return activities, key
    return [], None


def construct_topic_key(
    json_data, activity, activity_to_topic_key_suffix, base_key_prefix=None
):
    """Return the first topic key matching an activity across supported schemas."""
    suffixes = activity_to_topic_key_suffix.get(activity)
    if isinstance(suffixes, str):
        suffixes = [suffixes]
    if not suffixes:
        return None

    prefixes = []
    if base_key_prefix:
        prefixes.append(base_key_prefix)
    prefixes.extend(prefix for prefix in TOPIC_PREFIXES if prefix not in prefixes)

    for prefix in prefixes:
        for key, value in json_data.items():
            if not isinstance(key, str) or not key.startswith(prefix) or not is_present(value):
                continue
            if any(key == suffix or key.endswith(f"/{suffix}") for suffix in suffixes):
                return key
    return None


def process_mentee_data(json_data, activity_to_topic_key_suffix):
    """Process mentee curriculum data for database insertion."""
    mentor_name = normalize_mentor_name(get_first(json_data, MENTOR_NAME_KEYS))
    county = title_case_value(get_first(json_data, COUNTY_KEYS))
    facility_code, facility = parse_facility(json_data)
    mentees = parse_mentee_ids(json_data)
    date_submitted = extract_submission_time(json_data)
    session_date = parse_date_only(get_first(json_data, SESSION_DATE_KEYS))
    submission_id = str(json_data.get("_id")) if is_present(json_data.get("_id")) else None
    activities, activity_key = extract_activities(json_data)
    base_key_prefix = activity_key.rsplit("/", 1)[0] if activity_key else None
    mentee_rows = mentees if mentees else [{"id": None, "name": None}]

    records = []
    for raw_activity in activities:
        activity = normalize_activity(raw_activity)
        topic_key = construct_topic_key(
            json_data, activity, activity_to_topic_key_suffix, base_key_prefix
        )
        topics = split_tokens(json_data.get(topic_key)) if topic_key else []
        if not topics:
            logger.warning(
                "Skipping activity without topic: submission_id=%s activity=%s",
                submission_id,
                raw_activity,
            )
            continue

        for topic in topics:
            for mentee in mentee_rows:
                records.append(
                    {
                        "county": county,
                        "mentee_name": mentee["name"],
                        "mentor_name": mentor_name,
                        "facility": facility,
                        "facility_code": facility_code,
                        "mentee_id": mentee["id"],
                        "mentorship_activity": activity,
                        "topic": topic,
                        "date_submitted": date_submitted,
                        "session_date": session_date,
                        "submission_id": submission_id,
                    }
                )

    return records


def process_facility_inattendance_reasons(json_data):
    """Process facility inattendance reasons for database insertion."""
    facility_code, _ = parse_facility(json_data)
    date_submitted = extract_submission_time(json_data)
    reasons = []
    for key in REASON_KEYS:
        reasons = split_tokens(json_data.get(key))
        if reasons:
            break

    if not reasons:
        reasons = [None]

    return [
        {
            "facility_code": facility_code,
            "date_submitted": date_submitted,
            "facility_level_reasons_for_inattendance": reason,
        }
        for reason in reasons
    ]


def handle_mentee_curriculum_tracking(data):
    logger.info("Received mentee curriculum tracking submission: %s", data.get("_id"))
    try:
        processed_mentee_data = process_mentee_data(
            data, activity_to_topic_key_suffix
        )
        db_helper = DBHelper(MenteeCurriculumTracking)
        for item in processed_mentee_data:
            db_helper.save_to_db(item)

        processed_reasons_data = process_facility_inattendance_reasons(data)
        db_helper = DBHelper(FacilityInattendanceReasons)
        for item in processed_reasons_data:
            db_helper.save_to_db(item)
    except Exception:
        logger.error("Error processing data", exc_info=True)
        raise

```

---

## newborn_curriculum_tracking
- **File Path**: [handle_newborn_curriculum_tracking.py](file:///home/ichybell/Projects/data-warehouse/app/handle_newborn_curriculum_tracking.py)
- **Table(s)**: `NewbornCurriculumTracking`
- **Highlight Function(s)**: `handle_newborn_curriculum_tracking, process_newborn_data`

```python
import logging
from typing import Any, Dict, Iterable, List, Optional, Tuple

from models import NewbornCurriculumTracking
from models.db_helper import DBHelper
from utils.date_parser import custom_date_parser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


ACTIVITY_TO_TOPIC_SUFFIXES = {
    "CMEs": ["CMEs", "cmes"],
    "Videos": ["videos"],
    "Case scenarios": ["case_scenarios"],
    "Mentor demonstrations": ["mentor_demonstrations", "mentor_skills_demo", "mentor_skills_demonstrations"],
    "Practicum": ["practicum"],
    "Role plays": ["role_plays"],
    "Drills": ["DRILLs", "drills", "Drills"],
    "Group discussions": ["group_discussions", "group_discussion"],
}


def _is_present(value: Any) -> bool:
    return value not in (None, "", [], {})


def _get_first_present(data: Dict[str, Any], keys: Iterable[str], default=None):
    for key in keys:
        if key in data and _is_present(data.get(key)):
            return data.get(key)

    lower_map = {str(key).lower(): key for key in data.keys()}
    for key in keys:
        mapped = lower_map.get(str(key).lower())
        if mapped and _is_present(data.get(mapped)):
            return data.get(mapped)
    return default


def _normalize_label(value: Any, *, title_case: bool = False) -> Optional[str]:
    if not _is_present(value):
        return None
    text = " ".join(str(value).replace("_", " ").strip().split())
    if not text:
        return None
    return text.title() if title_case else text


def _sentence_case_label(value: Any) -> Optional[str]:
    if not _is_present(value):
        return None
    text = " ".join(str(value).replace("_", " ").strip().split())
    if not text:
        return None
    return text[:1].upper() + text[1:].lower()


def _split_tokens(value: Any) -> List[str]:
    if not _is_present(value):
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [token for token in str(value).replace(",", " ").split() if token]


def _safe_datetime(value: Any):
    if not _is_present(value):
        return None
    try:
        return custom_date_parser(value)
    except ValueError:
        logger.warning("Unable to parse datetime value: %s", value, exc_info=True)
        return None


def _parse_date_only(value: Any):
    parsed = _safe_datetime(value)
    return parsed.date() if parsed else None


def _parse_facility_value(value: Any) -> Tuple[Optional[int], Optional[str]]:
    if not _is_present(value):
        return None, None
    raw = str(value).strip()
    parts = raw.split("_", 1)
    if len(parts) == 2 and parts[0].isdigit():
        return int(parts[0]), _normalize_label(parts[1], title_case=True)
    if raw.isdigit():
        return int(raw), None
    return None, _normalize_label(raw, title_case=True)


def _facility_candidates(data: Dict[str, Any]):
    for key, value in data.items():
        if not isinstance(key, str) or not _is_present(value):
            continue
        tail = key.rsplit("/", 1)[-1].lower()
        if (
            tail == "facility"
            or tail.startswith("facility_")
            or tail.endswith("_facilities")
            or tail.startswith("q_facility")
        ):
            yield value


def parse_facility(data: Dict[str, Any]):
    """Parse facility code and name from current or legacy Kobo payloads."""
    for key in (
        "demographic_information/po_details/facility",
        "demographic_information/po_details/facility_code",
        "demographic_information/mentee_details/facility",
        "demographic_information/mentee_details/facility_code",
        "demographic_information/mentor_details/facility",
        "mentor/facility",
        "mentor/facility_001",
    ):
        value = _get_first_present(data, (key,))
        if _is_present(value):
            return _parse_facility_value(value)

    for value in _facility_candidates(data):
        parsed = _parse_facility_value(value)
        if any(parsed):
            return parsed

    return None, None


def _person_candidates(data: Dict[str, Any]):
    for key, value in data.items():
        if not isinstance(key, str) or not _is_present(value):
            continue
        lower = key.lower()
        if (
            lower.endswith("_mentees")
            or lower.endswith("_attendees")
            or lower.endswith("_nbc_pos")
            or lower.endswith("/po_details")
            or lower.endswith("/po")
            or lower.endswith("/selected_po")
            or lower.endswith("/selected_pos")
        ):
            yield value


def find_mentee_key(data: Dict[str, Any]):
    for key in data:
        if not isinstance(key, str):
            continue
        lower = key.lower()
        if lower.startswith("mentor/") and (
            lower.endswith("_mentees")
            or lower.endswith("_attendees")
            or "mentees" in lower
            or "attendees" in lower
        ):
            return key
        if lower.startswith("demographic_information/po_details/") and (
            lower.endswith("_po_details")
            or lower.endswith("_nbc_pos")
            or lower.endswith("selected_pos")
            or lower.endswith("selected_po_details")
        ):
            return key
    return None


def parse_po_ids(data: Dict[str, Any]):
    """Return selected mentee rows as dictionaries containing id and name."""
    raw_candidates = [
        _get_first_present(
            data,
            (
                "demographic_information/po_details/po_details",
                "demographic_information/po_details/selected_po_details",
                "demographic_information/po_details/selected_pos",
                "po_details",
            ),
        )
    ]
    raw_candidates.extend(list(_person_candidates(data)))

    po_rows = []
    for raw in raw_candidates:
        for token in _split_tokens(raw):
            parts = token.split("_", 1)
            if len(parts) == 2:
                po_rows.append(
                    {
                        "id": parts[0] or None,
                        "name": _normalize_label(parts[1], title_case=True),
                    }
                )
            elif token.isdigit():
                po_rows.append({"id": token, "name": None})
            else:
                po_rows.append({"id": None, "name": _normalize_label(token, title_case=True)})

    if not po_rows:
        return [{"id": None, "name": None}]

    # Deduplicate while preserving order.
    seen = set()
    unique_rows = []
    for row in po_rows:
        marker = (row["id"], row["name"])
        if marker in seen:
            continue
        seen.add(marker)
        unique_rows.append(row)
    return unique_rows


def parse_mentee_ids(data: Dict[str, Any]):
    """Compatibility wrapper for the older unit tests."""
    return parse_po_ids(data)


def parse_mentor_name(data: Dict[str, Any]):
    mentor_name = _get_first_present(
        data,
        (
            "mentor/name",
            "name",
            "demographic_information/mentor_details/mentor_name",
        ),
    )
    if _is_present(mentor_name):
        return _normalize_label(mentor_name, title_case=True)

    first_name = _get_first_present(
        data,
        (
            "demographic_information/mentor_details/first_name",
            "first_name",
        ),
    )
    middle_name = _get_first_present(
        data,
        (
            "demographic_information/mentor_details/second_name",
            "demographic_information/mentor_details/middle_name",
            "second_name",
            "middle_name",
        ),
    )
    last_name = _get_first_present(
        data,
        (
            "demographic_information/mentor_details/last_name",
            "last_name",
        ),
    )
    combined = " ".join(
        part
        for part in (
            _normalize_label(first_name),
            _normalize_label(middle_name),
            _normalize_label(last_name),
        )
        if part
    )
    return _normalize_label(combined, title_case=True)


def parse_program(data: Dict[str, Any]):
    program = _get_first_present(
        data,
        (
            "demographic_information/mentor_details/program",
            "mentor/program",
            "program",
        ),
    )
    if not _is_present(program):
        return "Newborn curriculum"
    return _sentence_case_label(program)


def parse_session_date(data: Dict[str, Any], date_submitted):
    session_date = _get_first_present(
        data,
        (
            "demographic_information/mentor_details/session_date",
            "mentor/evaluation_date",
            "session_date",
        ),
    )
    if _is_present(session_date):
        parsed = _parse_date_only(session_date)
        if parsed:
            return parsed
    return date_submitted.date() if date_submitted else None


def extract_activities(data: Dict[str, Any]) -> List[str]:
    raw = _get_first_present(
        data,
        (
            "newborn_training_Curriculum/program_activities/newborn_activities",
            "group_nbc/Mentors_activity",
            "Mentors_activity",
            "Mentorship_activity",
            "newborn_activities",
            "group_activities/activity",
        ),
        default="",
    )

    activities = []
    for token in _split_tokens(raw):
        normalized = token.lower().strip()
        normalized_space = normalized.replace("_", " ")
        if normalized in {"cmes", "cme"}:
            activities.append("CMEs")
        elif normalized in {"drills", "drill"}:
            activities.append("Drills")
        elif normalized in {"videos", "video"}:
            activities.append("Videos")
        elif normalized in {"case scenarios", "case_scenarios"}:
            activities.append("Case scenarios")
        elif normalized in {
            "videos_case_scenarios",
            "videos case scenarios",
        }:
            activities.extend(["Videos", "Case scenarios"])
        elif normalized in {
            "mentor demonstrations",
            "mentor_demonstrations",
            "mentor skills demo",
            "mentor_skills_demo",
            "mentor_skills_demonstrations",
        }:
            activities.append("Mentor demonstrations")
        elif normalized in {"practicum", "practicums"}:
            activities.append("Practicum")
        elif normalized in {"role plays", "role_plays"}:
            activities.append("Role plays")
        elif normalized in {"group discussions", "group_discussions", "group discussion", "group_discussion"}:
            activities.append("Group discussions")
        elif normalized_space == "videos case scenarios":
            activities.extend(["Videos", "Case scenarios"])

    seen = set()
    ordered = []
    for activity in activities:
        if activity not in seen:
            seen.add(activity)
            ordered.append(activity)
    return ordered


def construct_topic_key(data: Dict[str, Any], activity: str):
    suffixes = ACTIVITY_TO_TOPIC_SUFFIXES.get(activity, [])
    activity_tokens = {
        "CMEs": ("cmes",),
        "Videos": ("videos_case_scenarios", "videos"),
        "Case scenarios": ("videos_case_scenarios", "case_scenarios"),
        "Mentor demonstrations": (
            "mentor_demonstrations",
            "mentor_skills_demo",
            "mentor_skills_demonstrations",
        ),
        "Practicum": ("practicum",),
        "Role plays": ("role_plays",),
        "Drills": ("drills",),
        "Group discussions": ("group_discussions", "group_discussion"),
    }.get(activity, tuple(s.lower() for s in suffixes))
    prefixes = (
        "newborn_training_curriculum/newborn_cmes/",
        "newborn_training_curriculum/newborn_videos/",
        "newborn_training_curriculum/newborn_videos_scenarios/",
        "newborn_training_curriculum/newborn_case_scenarios/",
        "newborn_training_curriculum/newborn_mentor_demonstrations/",
        "newborn_training_curriculum/newborn_skills_demonstrations/",
        "newborn_training_curriculum/newborn_practicum/",
        "newborn_training_curriculum/newborn_drills/",
        "newborn_training_curriculum/newborn_group_discussions/",
        "group_nbc/",
        "cmes",
        "videos",
        "case_scenarios",
        "mentor_demonstrations",
        "mentor_skills_demonstrations",
        "practicum",
        "drills",
        "group_discussions",
        "group_discussion",
    )
    for prefix in prefixes:
        for key, value in data.items():
            if not isinstance(key, str) or not _is_present(value):
                continue
            key_lower = key.lower()
            if not key_lower.startswith(prefix):
                continue
            if any(
                token in key_lower or key_lower.endswith(f"/{token}")
                for token in activity_tokens
            ):
                return key
    return None


def process_newborn_data(json_data):
    date_started = _safe_datetime(json_data.get("start"))
    date_ended = _safe_datetime(json_data.get("end"))
    submission_time = json_data.get("_submission_time")
    if not submission_time:
        raise ValueError("Submission time is missing or invalid.")
    try:
        date_submitted = _safe_datetime(submission_time)
    except ValueError:
        raise ValueError(f"Invalid date format: {submission_time}")

    if not date_submitted:
        raise ValueError("Submission time is missing or invalid.")

    mentor_name = parse_mentor_name(json_data)
    county = _normalize_label(
        _get_first_present(
            json_data,
            (
                "demographic_information/po_details/county",
                "demographic_information/mentee_details/county",
                "demographic_information/mentor_details/county",
                "mentor/county",
                "county",
            ),
            default="",
        ),
        title_case=True,
    )

    facility_code, facility = parse_facility(json_data)
    po_rows = parse_po_ids(json_data)
    activities = extract_activities(json_data)
    program = parse_program(json_data)
    session_date = parse_session_date(json_data, date_submitted)
    module = _normalize_label(
        _get_first_present(
            json_data,
            (
                "demographic_information/mentor_details/newborn_modules",
                "newborn_training_Curriculum/newborn_modules_section/newborn_modules",
                "newborn_modules",
            ),
        ),
        title_case=True,
    )
    submission_id = _get_first_present(json_data, ("_id",))
    submission_id = int(submission_id) if submission_id is not None else None

    if not activities:
        activities = ["CMEs", "Drills"]

    records = []
    for activity in activities:
        topic_key = construct_topic_key(json_data, activity)
        topics = _split_tokens(json_data.get(topic_key)) if topic_key else []
        if not topics and activity in {"CMEs", "Drills"}:
            legacy_key = "CMEs" if activity == "CMEs" else "DRILLs"
            topics = _split_tokens(json_data.get(legacy_key))
        if not topics and activity in {"CMEs", "Drills"}:
            topics = _split_tokens(json_data.get(activity))

        if not topics:
            logger.warning(
                "Skipping activity without topic: submission_id=%s activity=%s",
                submission_id,
                activity,
            )
            continue

        for po in po_rows:
            for topic in topics:
                record = {
                    "submission_id": submission_id,
                    "date_started": date_started,
                    "date_ended": date_ended,
                    "date_submitted": date_submitted,
                    "mentor_name": mentor_name,
                    "session_date": session_date,
                    "program": program,
                    "county": county,
                    "facility": facility,
                    "facility_code": facility_code,
                    "mentee_name": po["name"],
                    "mentee_id": po["id"],
                    "module": module,
                    "mentorship_activity": activity,
                    "topic": _normalize_label(topic, title_case=True),
                }
                records.append(record)

    if not records:
        raise ValueError("No records (data to insert) were generated from the data.")
    return records


def handle_newborn_curriculum_tracking(data):
    logger.info("Request Data: %s", data)
    try:
        if isinstance(data, list):
            all_records = []
            for record in data:
                if not isinstance(record, dict):
                    logger.warning("Skipping non-dict item in payload: %s", type(record))
                    continue
                all_records.extend(process_newborn_data(record))
        elif isinstance(data, dict):
            all_records = process_newborn_data(data)
        else:
            raise ValueError("Payload must be a dict or a list of dicts.")

        if not all_records:
            raise ValueError("No records generated from payload.")

        db_helper = DBHelper(NewbornCurriculumTracking)
        db_helper.bulk_insert(all_records)
    except Exception as e:
        logger.error("Error processing data", exc_info=True)
        raise e

```

---

## moh_skills_checklist
- **File Path**: [handle_moh_skills_checklist.py](file:///home/ichybell/Projects/data-warehouse/app/handle_moh_skills_checklist.py)
- **Table(s)**: `MOHSkillsChecklist`
- **Highlight Function(s)**: `handle_moh_skills_checklist, process_checklist_data`

```python
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

```

---

## quips
- **File Path**: [handle_quips_submission.py](file:///home/ichybell/Projects/data-warehouse/app/handle_quips_submission.py)
- **Table(s)**: `Quips`
- **Highlight Function(s)**: `handle_quips_data, extract_quips_fields`

```python
import logging
from datetime import datetime, timedelta
from typing import Any, Iterable

from models import Quips
from models.db_helper import DBHelper
from utils.date_parser import custom_date_parser

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _is_present(value: Any) -> bool:
    return value not in (None, "", [], {})


def _get_any(data: dict, *keys: str):
    for key in keys:
        value = data.get(key)
        if _is_present(value):
            return value

    lower_map = {str(key).lower(): key for key in data.keys()}
    for key in keys:
        mapped_key = lower_map.get(str(key).lower())
        if mapped_key and _is_present(data.get(mapped_key)):
            return data.get(mapped_key)
    return None


def _get_by_suffix(data: dict, prefixes: Iterable[str], suffixes: Iterable[str]):
    suffixes = tuple(suffix.lower() for suffix in suffixes)
    for key, value in data.items():
        if not isinstance(key, str) or not _is_present(value):
            continue
        key_lower = key.lower()
        if not any(key_lower.startswith(prefix.lower()) for prefix in prefixes):
            continue
        tail = key_lower.rsplit("/", 1)[-1]
        if tail in suffixes:
            return value
    return None


def _normalize_text(value: Any, *, title_case: bool = False) -> str | None:
    if not _is_present(value):
        return None
    text = " ".join(str(value).replace("_", " ").strip().split())
    if not text:
        return None
    return text.title() if title_case else text


def _sentence_label(value: Any) -> str | None:
    text = _normalize_text(value)
    if not text:
        return None
    return text[:1].upper() + text[1:].lower()


def _yes_no(value: Any) -> str | None:
    if not _is_present(value):
        return None
    normalized = str(value).strip().lower()
    if normalized in {"yes", "y", "true", "1", "correct"}:
        return "Yes"
    if normalized in {"no", "n", "false", "0", "wrong"}:
        return "No"
    return _sentence_label(value)


def _safe_int(value: Any):
    if not _is_present(value):
        return None
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _safe_datetime(value: Any):
    if not _is_present(value):
        return None
    try:
        return custom_date_parser(value)
    except Exception:
        return None


def _safe_date(value: Any):
    parsed = _safe_datetime(value)
    return parsed.date() if parsed else None


def _safe_time(value: Any):
    if not _is_present(value):
        return None
    if isinstance(value, datetime):
        return value.time().replace(microsecond=0)
    try:
        return custom_date_parser(value).time().replace(microsecond=0)
    except Exception:
        text = str(value).strip()
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(text, fmt).time()
            except ValueError:
                continue
    return None


def _duration(start_value: Any, end_value: Any) -> str | None:
    start = _safe_time(start_value)
    end = _safe_time(end_value)
    if not start or not end:
        return None

    start_dt = datetime.combine(datetime.min.date(), start)
    end_dt = datetime.combine(datetime.min.date(), end)
    delta = end_dt - start_dt
    if delta.total_seconds() < 0:
        delta += timedelta(days=1)
    return _format_timedelta(delta)


def _has_negative_duration(start_value: Any, end_value: Any) -> bool:
    start = _safe_time(start_value)
    end = _safe_time(end_value)
    if not start or not end:
        return False

    start_dt = datetime.combine(datetime.min.date(), start)
    end_dt = datetime.combine(datetime.min.date(), end)
    return (end_dt - start_dt).total_seconds() < 0


def _format_timedelta(delta: timedelta) -> str:
    total_seconds = int(delta.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def _duration_seconds(value: str | None) -> int | None:
    if not value:
        return None
    try:
        hours, minutes, seconds = [int(part) for part in value.split(":", 2)]
    except ValueError:
        return None
    return hours * 3600 + minutes * 60 + seconds


def _timely_at_most(duration: str | None, seconds: int) -> str | None:
    total = _duration_seconds(duration)
    if total is None:
        return None
    return "Yes" if total <= seconds else "No"


def _timely_at_least(duration: str | None, seconds: int) -> str | None:
    total = _duration_seconds(duration)
    if total is None:
        return None
    return "Yes" if total >= seconds else "No"


def _timely_between(duration: str | None, lower_seconds: int, upper_seconds: int) -> str | None:
    total = _duration_seconds(duration)
    if total is None:
        return None
    return "Yes" if lower_seconds <= total <= upper_seconds else "No"


def _blank_if_negative(value: str | None, start_value: Any, end_value: Any) -> str | None:
    if _has_negative_duration(start_value, end_value):
        return None
    return value


def _tokens(value: Any) -> set[str]:
    if not _is_present(value):
        return set()
    if isinstance(value, list):
        raw_tokens = [str(item) for item in value]
    else:
        raw_tokens = str(value).replace(",", " ").split()
    return {token.strip().lower() for token in raw_tokens if token.strip()}


def _set_select_multiple(record: dict, raw_value: Any, mapping: dict[str, str]):
    selected = _tokens(raw_value)
    for token, field in mapping.items():
        record[field] = "Yes" if token.lower() in selected else "No"


def _summary_from_multiselect(
    raw_value: Any,
    positive_tokens: set[str],
    *,
    unable_token: str = "unable_to_observe",
    none_token: str = "none_of_above",
) -> str | None:
    selected = _tokens(raw_value)
    if not selected:
        return None
    if unable_token.lower() in selected:
        return "Unable To Observe"
    if none_token.lower() in selected:
        return "Never"
    if positive_tokens and positive_tokens <= selected:
        return "Always"
    return "Sometimes"


def _facility_value(data: dict):
    candidates = [
        _get_any(
            data,
            "facility_observer_details/facility_mombasa",
            "facility_observer_details/facility_muranga",
            "facility_observer_details/facility_nakuru",
            "facility_observer_details/facility_kilifi",
            "facility_observer_details/facility_nyeri",
            "facility_observer_details/facility_busia",
            "facility_observer_details/facility_kakamega",
            "facility_observer_details/facility_kiambu",
            "facility_observer_details/facility_machakos",
            "facility_observer_details/facility_kajiado",
            "facility_observer_details/facility_kwale",
            "facility_observer_details/facilities",
            "facility_details/mentors_facilities/facility_nakuru",
            "group_cd5ni99/group_lq7wp97/facility_nakuru",
            "group_cd5ni99/group_lq7wp97/q_facility_kilifi",
            "group_cd5ni99/group_lq7wp97/q_facility_muranga",
            "group_cd5ni99/group_lq7wp97/q_facility_nakuru",
            "group_cd5ni99/group_lq7wp97/q_facility_nairobi",
        ),
        _get_by_suffix(
            data,
            ("facility_observer_details/", "group_cd5ni99/group_lq7wp97/"),
            (
                "facility_mombasa",
                "facility_muranga",
                "facility_nakuru",
                "facility_kilifi",
                "facility_nyeri",
                "facility_busia",
                "facility_kakamega",
                "facility_kiambu",
                "facility_machakos",
                "facility_kajiado",
                "facility_kwale",
                "facilities",
                "q_facility_kilifi",
                "q_facility_muranga",
                "q_facility_nakuru",
                "q_facility_nairobi",
            ),
        ),
    ]
    raw = next((value for value in candidates if _is_present(value)), None)
    if not raw:
        return None, None
    text = str(raw).strip()
    parts = text.split("_", 1)
    if len(parts) == 2 and parts[0].isdigit():
        return parts[0], _normalize_text(parts[1], title_case=True)
    return None, _normalize_text(text, title_case=True)


def _observer_name(data: dict):
    explicit = _get_any(data, "facility_details/mentor_name", "group_cd5ni99/mentor_name")
    if explicit:
        return _normalize_text(explicit, title_case=True)

    first = _get_any(data, "facility_observer_details/first_name", "facility_details/first_name")
    second = _get_any(
        data,
        "facility_observer_details/second_name",
        "facility_observer_details/last_name",
        "facility_details/last_name",
    )
    name = " ".join(part for part in (_normalize_text(first), _normalize_text(second)) if part)
    return _normalize_text(name, title_case=True)


def extract_quips_fields(data):
    try:
        facility_code, facility = _facility_value(data)
        delivery_time_raw = _get_any(data, "technical_quality/delivery_time", "delivery_time")
        uterotonic_time_raw = _get_any(data, "technical_quality/uterotonic_time", "technical_quality/uterotonic_administration_time")
        skin_to_skin_start_raw = _get_any(data, "technical_quality/skin_to_skin_initiation")
        skin_to_skin_end_raw = _get_any(data, "technical_quality/skin_to_skin_discontinued")
        delayed_cord_clamp_raw = _get_any(data, "technical_quality/delayed_cord_clamp", "delivery_tqq/delayed_cord_clamping")
        pph_diagnosis_time_raw = _get_any(data, "technical_quality/pph_diagnosis_time")
        uterine_massage_time_raw = _get_any(data, "technical_quality/uterine_massage_time")
        oxytocin_time_raw = _get_any(data, "technical_quality/oxytocin_administration_time")
        txa_time_raw = _get_any(data, "technical_quality/txa_administration_time")
        iv_establishment_time_raw = _get_any(data, "technical_quality/iv_establishment_time")
        mother_bp_time_raw = _get_any(data, "technical_quality/mother_bp_time")
        mother_temp_time_raw = _get_any(data, "technical_quality/mother_temp_time")
        mother_pulse_time_raw = _get_any(data, "technical_quality/mother_pulse_time")
        vitamin_k_time_raw = _get_any(data, "technical_quality/vitamin_K_time", "technical_quality/vitamin_k_time")
        breastfeeding_time_raw = _get_any(data, "technical_quality/breastfeeding_initiation_time")

        uterotonic_duration = _duration(delivery_time_raw, uterotonic_time_raw)
        skin_to_skin_duration = _duration(skin_to_skin_start_raw, skin_to_skin_end_raw)
        cord_clamp_duration = _duration(delivery_time_raw, delayed_cord_clamp_raw)
        uterine_massage_duration = _duration(pph_diagnosis_time_raw, uterine_massage_time_raw)
        oxytocin_duration = _duration(pph_diagnosis_time_raw, oxytocin_time_raw)
        txa_duration = _duration(pph_diagnosis_time_raw, txa_time_raw)
        iv_establishment_duration = _duration(pph_diagnosis_time_raw, iv_establishment_time_raw)
        mother_bp_duration = _duration(delivery_time_raw, mother_bp_time_raw)
        mother_temp_duration = _duration(delivery_time_raw, mother_temp_time_raw)
        mother_pulse_duration = _duration(delivery_time_raw, mother_pulse_time_raw)
        vitamin_k_duration = _duration(delivery_time_raw, vitamin_k_time_raw)
        breastfeeding_duration = _duration(delivery_time_raw, breastfeeding_time_raw)

        protective_gear = _get_any(
            data,
            "birth_preparation/protective_gear",
            "birth_preparation/protective_clothing",
            "birth_preparation/clean_protective_clothing",
        )
        pph_identified_cause = _get_any(data, "technical_quality/pph_identified_cause")
        provider_explanations = _get_any(
            data,
            "respectful_maternity_care/provider_explanations",
            "respectful_maternity_care/provider_provided_explanations",
        )
        spoken_to_directly = _get_any(data, "respectful_maternity_care/spoken_to_directly")
        spoken_to_kindly = _get_any(
            data,
            "respectful_maternity_care/spoken_to_kindly",
            "respectful_maternity_care/mother_spoken_to_kindly",
        )
        disrespect_to_mother = _get_any(data, "respectful_maternity_care/disrespect_to_mother")
        accuracy_concern = _get_any(data, "partograph_review/accuracy_concern_category")
        lcg_accuracy_concern = _get_any(data, "labor_care_guide/accuracy_concern_category_lcg")
        intervention_section = _get_any(
            data,
            "group_observer_feedback/intervention_section",
            "partograph_review/group_observer_feedback/intervention_section",
            "partograph_review/observer_feedback/intervention_section",
            "partograph_review/group_wu9ic32/intervention_section",
        )

        record = {
            "submission_id": _safe_int(data.get("_id")),
            "date_started": _safe_datetime(data.get("start")),
            "date_ended": _safe_datetime(data.get("end")),
            "date_submitted": _safe_datetime(data.get("_submission_time")),
            "observation_date": _safe_date(
                _get_any(
                    data,
                    "facility_observer_details/date",
                    "facility_details/date",
                    "group_cd5ni99/debrief_date",
                )
            ),
            "county": _sentence_label(
                _get_any(data, "facility_details/county", "facility_observer_details/county", "group_cd5ni99/county")
            ),
            "facility_code": facility_code,
            "facility": facility,
            "observer_name": _observer_name(data),
            "cadre": _sentence_label(
                _get_any(data, "facility_observer_details/primary_provider", "facility_details/primary_provider")
            ),
            "mentee_id": str(
                _safe_int(
                    _get_any(
                        data,
                        "facility_observer_details/phone_number",
                        "facility_details/phone_number",
                        "group_cd5ni99/primary_provider",
                    )
                )
                or ""
            )
            or None,
            "labor_monitoring_tool": _sentence_label(
                _get_any(data, "facility_observer_details/labor_monitoring_tool", "labor_monitoring_tool")
            ),
            "hand_hygiene": _yes_no(_get_any(data, "birth_preparation/hand_washing")),
            "nnr_equipment_preparation": _yes_no(_get_any(data, "birth_preparation/nnr_equipment_prep")),
            "uterotonic_preparation": _yes_no(
                _get_any(data, "birth_preparation/uterotonic_prep", "birth_preparation/uterotonic_drug")
            ),
            "ruleout_twin": _yes_no(_get_any(data, "technical_quality/ruleout_twin", "delivery_tqq/rule_out_2nd_twin", "ruleout_twin")),
            "delivery_time": _safe_time(delivery_time_raw),
            "uterotonic_administered": _yes_no(
                _get_any(data, "technical_quality/uterotonic_administered", "delivery_tqq/uterotonic_1_minute")
            ),
            "uterotonic_administration_time": _safe_time(uterotonic_time_raw),
            "uterotonic_administration_duration": uterotonic_duration,
            "timely_uterotonic_administration": _blank_if_negative(
                _timely_at_most(uterotonic_duration, 60), delivery_time_raw, uterotonic_time_raw
            ),
            "drying_stimulation": _yes_no(_get_any(data, "technical_quality/drying_stimulation", "delivery_tqq/drying_stimulation", "drying_stimulation")),
            "discard_wet_towel": _yes_no(_get_any(data, "technical_quality/discard_wet_towel", "delivery_tqq/discards_wet_towel")),
            "baby_resuscitation": _yes_no(
                _get_any(data, "technical_quality/baby_resuscitation", "delivery_tqq/baby_resuscitation", "delivery_tqq/baby_needing_resuscitation")
            ),
            "skin_to_skin": _yes_no(_get_any(data, "technical_quality/skin_to_skin", "delivery_tqq/skin_to_skin")),
            "skin_to_skin_initiation_time": _safe_time(skin_to_skin_start_raw),
            "skin_to_skin_discontinued_time": _safe_time(skin_to_skin_end_raw),
            "skin_to_skin_duration": skin_to_skin_duration,
            "adequate_skin_to_skin_time": _blank_if_negative(
                _timely_at_least(skin_to_skin_duration, 3600), skin_to_skin_start_raw, skin_to_skin_end_raw
            ),
            "delayed_cord_clamp_time": _safe_time(delayed_cord_clamp_raw),
            "cord_clamp_duration": cord_clamp_duration,
            "timely_cord_clamp": _blank_if_negative(
                _timely_between(cord_clamp_duration, 120, 180), delivery_time_raw, delayed_cord_clamp_raw
            ),
            "sterilized_blade_clamp": _yes_no(
                _get_any(data, "technical_quality/sterilized_blade_clamp", "delivery_tqq/provider_cut_the_cord", "delivery_tqq/provider_cut_cord")
            ),
            "newborn_kept_warm": _yes_no(_get_any(data, "technical_quality/newborn_kept_warm", "delivery_tqq/newbor_kept_warm", "delivery_tqq/newborn_kept_warm")),
            "controlled_cord_traction": _yes_no(_get_any(data, "technical_quality/controlled_cord_traction", "delivery_tqq/controlled_cord_traction")),
            "placenta_delivery_time": _safe_time(_get_any(data, "technical_quality/placenta_delivery_time")),
            "placenta_examination": _yes_no(_get_any(data, "technical_quality/placenta_examination", "delivery_tqq/placenta_examination")),
            "uterine_tone_assessed": _yes_no(_get_any(data, "technical_quality/uterine_tone_assessed", "delivery_tqq/uterine_tone_assessed")),
            "laceration_check": _yes_no(_get_any(data, "technical_quality/laceration_check", "delivery_tqq/assess_for_trauma")),
            "method_blood_loss": _sentence_label(_get_any(data, "technical_quality/method_blood_loss", "method_blood_loss")),
            "proper_vdrape_use": _yes_no(_get_any(data, "technical_quality/proper_vdrape_use", "proper_vdrape_use")),
            "blood_loss_over_500ml": _yes_no(_get_any(data, "technical_quality/blood_loss_amount", "blood_loss_amount")),
            "pph_suspicion_diagnosis": _yes_no(_get_any(data, "technical_quality/pph_suspicion_diagnosis")),
            "pph_clinical_signs": _yes_no(_get_any(data, "technical_quality/pph_clinical_signs")),
            "pph_diagnosis_time": _safe_time(pph_diagnosis_time_raw),
            "uterine_massage_initiated": _yes_no(_get_any(data, "technical_quality/uterine_massage_initiated", "uterine_massage_initiated")),
            "uterine_massage_time": _safe_time(uterine_massage_time_raw),
            "uterine_massage_duration": uterine_massage_duration,
            "oxytocin_first_line": _yes_no(_get_any(data, "technical_quality/oxytocin_first_line")),
            "oxytocin_administration_time": _safe_time(oxytocin_time_raw),
            "oxytocin_administration_duration": oxytocin_duration,
            "timely_oxytocin_administration": _timely_at_most(oxytocin_duration, 60),
            "txa_administered": _yes_no(_get_any(data, "technical_quality/txa_administered")),
            "txa_administration_time": _safe_time(txa_time_raw),
            "txa_administration_duration": txa_duration,
            "iv_access_fluids": _yes_no(_get_any(data, "technical_quality/iv_access_fluids")),
            "iv_establishment_time": _safe_time(iv_establishment_time_raw),
            "iv_establishment_duration": iv_establishment_duration,
            "pph_identified_cause": _sentence_label(pph_identified_cause),
            "take_mother_bp": _yes_no(_get_any(data, "technical_quality/take_mother_bp", "delivery_tqq/mothers_15min_bp", "take_mother_bp")),
            "mother_bp_time": _safe_time(mother_bp_time_raw),
            "mother_bp_duration": mother_bp_duration,
            "timely_mother_bp": _blank_if_negative(
                _timely_at_most(mother_bp_duration, 900), delivery_time_raw, mother_bp_time_raw
            ),
            "take_mother_temperature": _yes_no(_get_any(data, "technical_quality/take_mother_temperature", "take_mother_temperature")),
            "mother_temp_time": _safe_time(mother_temp_time_raw),
            "mother_temp_duration": mother_temp_duration,
            "timely_mother_temp": _blank_if_negative(
                _timely_at_most(mother_temp_duration, 900), delivery_time_raw, mother_temp_time_raw
            ),
            "take_mother_pulse": _yes_no(_get_any(data, "technical_quality/take_mother_pulse", "delivery_tqq/mothers_15min_pulse", "take_mother_pulse")),
            "mother_pulse_time": _safe_time(mother_pulse_time_raw),
            "mother_pulse_duration": mother_pulse_duration,
            "timely_mother_pulse": _blank_if_negative(
                _timely_at_most(mother_pulse_duration, 900), delivery_time_raw, mother_pulse_time_raw
            ),
            "apgar_min1": _yes_no(_get_any(data, "technical_quality/apgar_min1", "delivery_tqq/apgar_min1_min5", "apgar_min1")),
            "apgar_min5": _yes_no(_get_any(data, "technical_quality/apgar_min5", "delivery_tqq/apgar_min1_min5", "apgar_min5")),
            "administer_vitamin_k": _yes_no(_get_any(data, "technical_quality/administer_vitamin", "delivery_tqq/vitk_administered")),
            "vitamink_administration_time": _safe_time(vitamin_k_time_raw),
            "vitamink_administration_duration": vitamin_k_duration,
            "timely_vitamink_administration": _blank_if_negative(
                _timely_at_most(vitamin_k_duration, 3600), delivery_time_raw, vitamin_k_time_raw
            ),
            "provider_initiate_breastfeeding": _yes_no(_get_any(data, "technical_quality/initiate_breastfeeding", "delivery_tqq/bf_within_1hr")),
            "breastfeeding_initiation_time": _safe_time(breastfeeding_time_raw),
            "breastfeeding_initiation_duration": breastfeeding_duration,
            "timely_breastfeeding_initiation": _blank_if_negative(
                _timely_at_most(breastfeeding_duration, 3600), delivery_time_raw, breastfeeding_time_raw
            ),
            "maternal_bleeding_assessed": _yes_no(_get_any(data, "technical_quality/mbleeding_assessed", "delivery_tqq/maternal_bleeding_assessed")),
            "sharps_disposal": _yes_no(_get_any(data, "post_birth_ip/sharps_disposal", "post_birth_ipc/proper_sharps_disposal", "post_birth_ipc/sharps_disposal", "sharps_disposal")),
            "waste_disposal": _yes_no(_get_any(data, "post_birth_ip/waste_disposal", "post_birth_ipc/proper_waste_disposal", "post_birth_ipc/waste_disposal", "waste_disposal")),
            "birth_companion": _yes_no(_get_any(data, "respectful_maternity_care/birth_companion", "birth_companion")),
            "provider_explanations": _summary_from_multiselect(
                provider_explanations,
                {
                    "labor_explained_mother",
                    "language_simple_clear",
                    "procedure_explained_first",
                    "mother_informed_choices",
                    "consent_obtained_before",
                    "progress_updated_regularly",
                    "questions_asked_mother",
                },
            ),
            "spoken_to_directly": _summary_from_multiselect(
                spoken_to_directly,
                {
                    "introduced_self_mother",
                    "addressed_mother_name",
                    "spoke_directly_mother",
                    "encouraged_needs_expression",
                    "engaged_companion_support",
                },
            ),
            "spoken_to_kindly": _summary_from_multiselect(
                spoken_to_kindly,
                {
                    "responded_mother_needs",
                    "showed_empathy_compassion",
                    "used_encouragement_praise",
                    "listened_actively_mother",
                    "positive_attitude_respect",
                    "privacy_confidentiality_ensured",
                },
            ),
            "fundal_pressure": _yes_no(_get_any(data, "harmful_practices/fundal_pressure")),
            "perineum_stretching": _yes_no(_get_any(data, "harmful_practices/perineum_stretching")),
            "newborn_slapped": _yes_no(_get_any(data, "harmful_practices/nb_slapped", "harmful_practices/newborn_slapped")),
            "newborn_upside_down": _yes_no(_get_any(data, "harmful_practices/nb_upside_down", "harmful_practices/newborn_held_upside_down")),
            "partogragh_initiation": _yes_no(_get_any(data, "partograph_review/partogragh_initiation", "partograph_review/proper_partogragh_initiation")),
            "partograph_half_hr": _yes_no(_get_any(data, "partograph_review/partograph_half_hr", "partograph_review/parto_filled_q_0_5hrs")),
            "fetal_heart_correct": _yes_no(_get_any(data, "partograph_review/fetal_heart_correct", "partograph_review/fetal_heart_correctly_filled")),
            "maternal_pulse_correct": _yes_no(_get_any(data, "partograph_review/maternal_pulse_correct", "partograph_review/maternal_pulse_filled_correctl")),
            "bp_4hrs": _yes_no(_get_any(data, "partograph_review/bp_4hrs", "partograph_review/bp_q_4hrs")),
            "partograph_summary_filled": _yes_no(_get_any(data, "partograph_review/partograph_summary_filled", "partograph_review/parto_summary_filled")),
            "delivery_method_filled": _yes_no(_get_any(data, "partograph_review/delivery_method_filled")),
            "blood_loss_estimation": _yes_no(_get_any(data, "partograph_review/blood_loss_estimation", "partograph_review/correct_blood_loss_estimation")),
            "partograph_accuracy_concern": _yes_no(_get_any(data, "partograph_review/partograph_accuracy_concern")),
            "lcg_initiated_correct": _yes_no(_get_any(data, "labor_care_guide/lcg_initiated_correct", "lcg_initiated_correct")),
            "contractions_monitored_1st": _yes_no(_get_any(data, "labor_care_guide/contractions_monitored_1st", "contractions_monitored_1st")),
            "fhr_monitored_1st": _yes_no(_get_any(data, "labor_care_guide/fhr_monitored_1st")),
            "bp_monitored_recorded": _yes_no(_get_any(data, "labor_care_guide/bp_monitored_recorded", "bp_monitored_recorded")),
            "contractions_monitored_2nd": _yes_no(_get_any(data, "labor_care_guide/contractions_monitored_2nd", "contractions_monitored_2nd")),
            "fhr_monitored_2nd": _yes_no(_get_any(data, "labor_care_guide/fhr_monitored_2nd")),
            "delivery_time_documented": _yes_no(_get_any(data, "labor_care_guide/delivery_time_documented")),
            "delivery_method_documented": _yes_no(_get_any(data, "labor_care_guide/delivery_method_documented", "delivery_method_documented")),
            "ebl_documented_correctly": _yes_no(_get_any(data, "labor_care_guide/ebl_documented_correctly")),
            "lcg_accuracy_concerns": _yes_no(_get_any(data, "labor_care_guide/lcg_data_concerns", "lcg_data_concerns")),
            "observer_intervention": _yes_no(
                _get_any(
                    data,
                    "group_observer_feedback/observer_intervention",
                    "partograph_review/group_observer_feedback/observer_intervention",
                    "partograph_review/observer_feedback/observer_intervention",
                    "partograph_review/group_wu9ic32/observer_intervention",
                )
            ),
            "observer_intervention_description": _sentence_label(
                _get_any(
                    data,
                    "group_observer_feedback/intervention_description",
                    "partograph_review/group_observer_feedback/intervention_description",
                    "partograph_review/observer_feedback/intervention_description",
                    "intervention_description",
                )
            ),
            "further_feedback": _sentence_label(
                _get_any(
                    data,
                    "group_observer_feedback/further_feedback",
                    "partograph_review/group_observer_feedback/further_feedback",
                    "partograph_review/observer_feedback/further_feedback",
                    "partograph_review/group_wu9ic32/further_feedback",
                    "further_feedback",
                )
            ),
            "observer_confidence": _sentence_label(
                _get_any(
                    data,
                    "group_observer_feedback/observer_confidence",
                    "partograph_review/group_observer_feedback/observer_confidence",
                    "partograph_review/observer_feedback/observer_confidence",
                    "partograph_review/group_wu9ic32/observer_confidence_results",
                    "observer_confidence",
                )
            ),
        }

        _set_select_multiple(
            record,
            protective_gear,
            {
                "gloves": "ppe_gloves",
                "mask": "ppe_mask",
                "gown": "ppe_gown",
                "boots": "ppe_boots",
                "face_shield_goggles": "ppe_goggles",
                "face_shield_googles": "ppe_goggles",
                "cap": "ppe_cap",
                "no_ppe_was_used": "no_ppe_used",
            },
        )
        _set_select_multiple(
            record,
            pph_identified_cause,
            {
                "tone_uterine_atony": "pph_tone_uterine_atony",
                "tissue_retained_placenta": "pph_tissue_retained_placenta",
                "trauma_genital_tract_injury": "pph_trauma_genital_tract_injury",
                "thrombin_clotting_disorder": "pph_thrombin_clotting_disorder",
                "unidentified_or_unknown": "pph_unidentified_or_unknown",
            },
        )
        _set_select_multiple(
            record,
            provider_explanations,
            {
                "labor_explained_mother": "explanations_labor_explained_mother",
                "language_simple_clear": "explanations_language_simple_clear",
                "procedure_explained_first": "explanations_procedure_explained_first",
                "mother_informed_choices": "explanations_mother_informed_choices",
                "consent_obtained_before": "explanations_consent_obtained_before",
                "progress_updated_regularly": "explanations_progress_updated_regularly",
                "questions_asked_mother": "explanations_questions_asked_mother",
                "unable_to_observe": "explanations_unable_to_observe",
                "none_of_above": "explanations_none_of_above",
            },
        )
        _set_select_multiple(
            record,
            spoken_to_directly,
            {
                "introduced_self_mother": "directly_introduced_self_mother",
                "addressed_mother_name": "directly_addressed_mother_name",
                "spoke_directly_mother": "directly_spoke_directly_mother",
                "encouraged_needs_expression": "directly_encouraged_needs_expression",
                "engaged_companion_support": "directly_engaged_companion_support",
                "unable_to_observe": "directly_unable_to_observe",
                "none_of_above": "directly_none_of_above",
            },
        )
        _set_select_multiple(
            record,
            spoken_to_kindly,
            {
                "responded_mother_needs": "kindly_responded_mother_needs",
                "showed_empathy_compassion": "kindly_showed_empathy_compassion",
                "used_encouragement_praise": "kindly_used_encouragement_praise",
                "listened_actively_mother": "kindly_listened_actively_mother",
                "positive_attitude_respect": "kindly_positive_attitude_respect",
                "privacy_confidentiality_ensured": "kindly_privacy_confidentiality_ensured",
                "unable_to_observe": "kindly_unable_to_observe",
                "none_of_above": "kindly_none_of_above",
            },
        )
        _set_select_multiple(
            record,
            disrespect_to_mother,
            {
                "lack_of_privacy": "rmc_lack_of_privacy",
                "non_consented_care": "rmc_non_consented_care",
                "physical_abuse": "rmc_physical_abuse",
                "verbal_abuse": "rmc_verbal_abuse",
                "discrimination": "rmc_discrimination",
                "abadonment": "rmc_abandonment",
                "abandonment": "rmc_abandonment",
                "denied_pain_relief": "rmc_denied_pain_relief",
                "coerced_procedures": "rmc_coerced_procedures",
                "unable_to_observe": "rmc_unable_to_observe",
                "mother_did_not_experience_disrespect": "rmc_no_disrespect_to_mother",
            },
        )
        _set_select_multiple(
            record,
            accuracy_concern,
            {
                "passenger__foetal_heart_rate__moulding_a": "accuracy_passenger",
                "passage__cervical_dilatation_and_head_de": "accuracy_passage",
                "powers__contractions": "accuracy_powers",
                "maternal_status__vital_signs": "accuracy_maternal_status_vital_signs",
                "summary_of_labour_after_delivery": "accuracy_labour_summary",
            },
        )
        _set_select_multiple(
            record,
            lcg_accuracy_concern,
            {
                "passenger__foetal_heart_rate__moulding_a": "lcg_accuracy_passenger",
                "passage__cervical_dilatation_and_head_de": "lcg_accuracy_passage",
                "powers__contractions": "lcg_accuracy_powers",
                "maternal_status__vital_signs": "lcg_accuracy_maternal_vital_signs",
                "summary_of_labour_after_delivery": "lcg_accuracy_labour_summary",
            },
        )
        _set_select_multiple(
            record,
            intervention_section,
            {
                "birth_preparedness": "observer_intervention_birth_preparedness",
                "technical_quality_immediately_following_": "observer_intervention_technical_quality_immediately_following",
                "technical_quality_immediately_following": "observer_intervention_technical_quality_immediately_following",
                "post-birth_infection_prevention": "observer_intervention_post_birth_infection_prevention",
                "post_birth_infection_prevention": "observer_intervention_post_birth_infection_prevention",
                "respectful_maternity_care": "observer_intervention_respectful_maternity_care",
                "avoidance_of_harmful_practices": "observer_intervention_avoidance_of_harmful_practices",
                "partograph": "observer_intervention_partograph",
                "labor_care_guide": "observer_intervention_labor_care_guide",
            },
        )

        return record

    except Exception as e:
        logger.exception("Error extracting fields for Quips")
        raise ValueError("Failed to extract Quips fields correctly") from e


def handle_quips_data(data):
    logger.info("Processing Quips submission")
    processed_data = extract_quips_fields(data)
    db_helper = DBHelper(Quips)
    db_helper.save_to_db(processed_data)

```

---
