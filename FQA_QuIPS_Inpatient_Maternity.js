/**
 * Inpatient Maternity transformation and preferred headers.
 *
 * The user paste labelled “Inpatient Maternity Transformations”
 * duplicated the Newborn Unit functions. This file is reconstructed
 * from INPATIENT_MATERNITY_SOURCE_KEYS and the maternity maps in
 * FQA_QuIPS_Config.js. Dual-cased Kobo groups use firstValue_.
 */

function maternityLatrineMap_(rec) {
  const version = firstValue_(rec, ['__version__', '_version_']);
  if (String(version).indexOf(MATERNITY_LEGACY_LATRINE_VERSION) !== -1) {
    return MATERNITY_LEGACY_LATRINE_MAP;
  }
  return MATERNITY_LATRINE_MAP;
}

function transformInpatientMaternityRecord_(rec) {
  const out = {};
  out[UUID_FIELD] = rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  assignPassthrough_(out, rec, INPATIENT_MATERNITY_SOURCE_KEYS);

  const dateStarted = formatDateMinute_(
    firstValue_(rec, ['starttime', 'start'])
  );
  const dateEnded = formatDateMinute_(
    firstValue_(rec, ['endtime', 'end'])
  );
  const dateSubmitted = formatDateMinute_(
    firstValue_(rec, ['_submission_time'])
  );

  out.date_started = dateStarted;
  out.date_ended = dateEnded;
  out.date_submitted = dateSubmitted;

  const facilityLevelKey =
    rec['facility_profile/gazetted_facility'] != null &&
    rec['facility_profile/gazetted_facility'] !== ''
      ? 'facility_profile/gazetted_facility'
      : 'facility_profile/gaz_facility';
  assignFacilityProfile_(out, rec, dateSubmitted, facilityLevelKey);

  out.functional_maternity_unit = lookupCoded_(
    rec['facility_profile/units'],
    YES_NO_MAP
  );

  out.birth_notification = lookupCoded_(
    rec['health_records/birth'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.birth_death_notification = lookupCoded_(
    rec['health_records/birth_death'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.birth_register = lookupCoded_(
    rec['health_records/bregister'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.death_notification = lookupCoded_(
    rec['health_records/death'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.delivery_notes = lookupCoded_(
    rec['health_records/delivery'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.delivery_register = lookupCoded_(
    rec['health_records/dl_register'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.death_register = lookupCoded_(
    rec['health_records/dregister'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.autopsy_forms = lookupCoded_(
    rec['health_records/autopsy_forms'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.inpatient_maternity_file = lookupCoded_(
    rec['health_records/imf'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.kmc_chart = lookupCoded_(
    rec['health_records/kmc'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.maternal_death_notification = lookupCoded_(
    rec['health_records/maternal_death'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.maternal_death_review = lookupCoded_(
    rec['health_records/maternal_review'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.newborn_file = lookupCoded_(
    rec['health_records/newborn'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.newborn_register = lookupCoded_(
    rec['health_records/newborn_register'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.nursing_register = lookupCoded_(
    rec['health_records/nregister'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.nutrition_form = lookupCoded_(
    rec['health_records/nutrition'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.perinatal_death_notification = lookupCoded_(
    rec['health_records/perinatal_death'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.perinatal_death_review = lookupCoded_(
    rec['health_records/perinatl_review'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.postnatal_register = lookupCoded_(
    rec['health_records/postnatal'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  out.postnatal_register_alt = lookupCoded_(
    rec['health_records/pregister'],
    MATERNITY_FILE_AVAILABILITY_MAP
  );

  expandSelectMultiple_(
    out,
    rec['health_records/patient_file'],
    'health_records_patient_file',
    MATERNITY_PATIENT_FILE_CHOICES
  );

  out.rehab_staff = toIntegerOrBlank_(
    rec['hrh/rehab']
  );

  out.auditory_privacy = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/auditory',
      'Section_5_Privacy_Confidentiality/auditory'
    ]),
    ROOM_PRIVACY_MAP
  );
  out.visual_barrier = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/barrier',
      'Section_5_Privacy_Confidentiality/barrier'
    ]),
    MATERNITY_BARRIER_MAP
  );
  out.privacy_beds = toIntegerOrBlank_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/beds',
      'Section_5_Privacy_Confidentiality/beds'
    ])
  );
  out.bed_spacing = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/beds_space',
      'Section_5_Privacy_Confidentiality/beds_space'
    ]),
    MATERNITY_BED_SPACE_MAP
  );
  out.files_privacy = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/files',
      'Section_5_Privacy_Confidentiality/files'
    ]),
    YES_NO_MAP
  );
  out.single_rooms = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/single_rooms',
      'Section_5_Privacy_Confidentiality/single_rooms'
    ]),
    YES_NO_MAP
  );
  out.visual_privacy = lookupCoded_(
    firstValue_(rec, [
      'Section_5_Privacy_confidentiality/visual',
      'Section_5_Privacy_Confidentiality/visual'
    ]),
    ROOM_PRIVACY_MAP
  );

  out.eclampsia_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/eclampsia'],
    SOP_PROTOCOL_MAP
  );

  out.handwashing_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/handwashing'],
    SOP_PROTOCOL_MAP
  );

  out.intrapartum_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/intrapartum'],
    SOP_PROTOCOL_MAP
  );

  out.newborn_mgt_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/newborn_mgt'],
    SOP_PROTOCOL_MAP
  );

  out.pph_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/pph'],
    SOP_PROTOCOL_MAP
  );

  out.pre_eclampsia_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/pre_eclampsia'],
    SOP_PROTOCOL_MAP
  );

  out.referral_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/referral'],
    SOP_PROTOCOL_MAP
  );

  out.resuscitation_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/rescuscitation'],
    SOP_PROTOCOL_MAP
  );

  out.sepsis_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/sepsis'],
    SOP_PROTOCOL_MAP
  );

  out.maternity_sop = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/sop'],
    SOP_PROTOCOL_MAP
  );

  out.procurement_protocol = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/procure'],
    YES_NO_MAP
  );
  out.maternity_checklist = lookupCoded_(
    rec['Section_7_Standard_operating_procedure/checklist'],
    YES_NO_MAP
  );

  expandSelectMultiple_(
    out,
    rec['Section_7_Standard_operating_procedure/policy_a'],
    'sop_policy_a',
    MATERNITY_POLICY_A_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['Section_7_Standard_operating_procedure/policy_b'],
    'sop_policy_b',
    MATERNITY_POLICY_B_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['Section_7_Standard_operating_procedure/policy_c'],
    'sop_policy_c',
    MATERNITY_POLICY_C_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['Section_7_Standard_operating_procedure/policy_d'],
    'sop_policy_d',
    MATERNITY_POLICY_D_CHOICES
  );

  out.triage_area = lookupCoded_(
    rec['Section_9_Infrastructure/triage'],
    YES_NO_MAP
  );

  out.waiting_area = lookupCoded_(
    rec['Section_9_Infrastructure/waiting_area'],
    YES_NO_MAP
  );

  out.disabled_access = lookupCoded_(
    rec['Section_9_Infrastructure/access'],
    YES_NO_MAP
  );

  out.waiting_benches = lookupCoded_(
    rec['Section_9_Infrastructure/benches'],
    YES_NO_MAP
  );

  out.cabinets = lookupCoded_(
    rec['Section_9_Infrastructure/cabinets'],
    YES_NO_MAP
  );

  out.service_charter = lookupCoded_(
    rec['Section_9_Infrastructure/charter'],
    YES_NO_MAP
  );

  out.draught_free = lookupCoded_(
    rec['Section_9_Infrastructure/draught'],
    YES_NO_MAP
  );

  out.dust_evidence = lookupCoded_(
    rec['Section_9_Infrastructure/dust'],
    YES_NO_MAP
  );

  out.fire_extinguishers = lookupCoded_(
    rec['Section_9_Infrastructure/extinguishers'],
    YES_NO_MAP
  );

  out.fan_available = lookupCoded_(
    rec['Section_9_Infrastructure/fan'],
    YES_NO_MAP
  );

  out.isolation_space = lookupCoded_(
    rec['Section_9_Infrastructure/isolate'],
    YES_NO_MAP
  );

  out.well_lit = lookupCoded_(
    rec['Section_9_Infrastructure/lighting'],
    YES_NO_MAP
  );

  out.maintenance_infrastructure = lookupCoded_(
    rec['Section_9_Infrastructure/maintenance'],
    YES_NO_MAP
  );

  out.building_material = lookupCoded_(
    rec['Section_9_Infrastructure/material'],
    YES_NO_MAP
  );

  out.recovery_room = lookupCoded_(
    rec['Section_9_Infrastructure/recovery_room'],
    YES_NO_MAP
  );

  out.resuscitation_area = lookupCoded_(
    rec['Section_9_Infrastructure/resus_area'],
    YES_NO_MAP
  );

  out.clear_signage = lookupCoded_(
    rec['Section_9_Infrastructure/signs'],
    YES_NO_MAP
  );

  out.sound_structures = lookupCoded_(
    rec['Section_9_Infrastructure/structures'],
    YES_NO_MAP
  );

  out.temperature_control = lookupCoded_(
    rec['Section_9_Infrastructure/temperature'],
    YES_NO_MAP
  );

  out.ventilation = lookupCoded_(
    rec['Section_9_Infrastructure/ventilation'],
    YES_NO_MAP
  );

  out.labour_ward_beds = toIntegerOrBlank_(
    rec['Section_9_Infrastructure/beds_001']
  );
  out.exam_rooms = toIntegerOrBlank_(
    rec['Section_9_Infrastructure/rooms']
  );

  expandSelectMultiple_(
    out,
    rec['Section_9_Infrastructure/education'],
    'infrastructure_education',
    MATERNITY_EDUCATION_CHOICES
  );

  out.labour_area_privacy = lookupCoded_(
    rec['Section_9_Infrastructure/labour_area'],
    MATERNITY_LABOUR_AREA_PRIVACY_MAP
  );
  out.childbirth_area_privacy = lookupCoded_(
    rec['Section_9_Infrastructure/childbirth_area'],
    MATERNITY_CHILDBIRTH_AREA_PRIVACY_MAP
  );

  out.ambubags = lookupCoded_(
    rec['Section_10_Equipment/ambubags'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.doppler = lookupCoded_(
    rec['Section_10_Equipment/doppler'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.exam_light = lookupCoded_(
    rec['Section_10_Equipment/exam_light'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.fetoscopes = lookupCoded_(
    rec['Section_10_Equipment/fetoscopes'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.glucometer = lookupCoded_(
    rec['Section_10_Equipment/glucometer'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.obstetric_kit = lookupCoded_(
    rec['Section_10_Equipment/obstetric'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.oximeter = lookupCoded_(
    rec['Section_10_Equipment/oximeter'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.pharyngeal_airway = lookupCoded_(
    rec['Section_10_Equipment/pharyngeal'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.preeclampsia_kit = lookupCoded_(
    rec['Section_10_Equipment/preclampsia'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.resus_kits = lookupCoded_(
    rec['Section_10_Equipment/resus_kits'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.vd_kits = lookupCoded_(
    rec['Section_10_Equipment/vd_kits'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.vacuum_extractor = lookupCoded_(
    rec['Section_10_Equipment/vacuum'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.suction = lookupCoded_(
    rec['Section_10_Equipment/suction'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.adult_scale = lookupCoded_(
    rec['Section_10_Equipment/adult'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.infant_scale = lookupCoded_(
    rec['Section_10_Equipment/infant'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.stadiometer = lookupCoded_(
    rec['Section_10_Equipment/stadiometer'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.thermometers = lookupCoded_(
    rec['Section_10_Equipment/thermometers'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.stethoscopes = lookupCoded_(
    rec['Section_10_Equipment/stethoscopes'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.laryngoscope = lookupCoded_(
    rec['Section_10_Equipment/laryngoscope'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.bp_apparatus = lookupCoded_(
    rec['Section_10_Equipment/apparatus'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.ctg_machine = lookupCoded_(
    rec['Section_10_Equipment/ctg_001'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.oxygen_equipment = lookupCoded_(
    rec['Section_10_Equipment/oxygen'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.o2_source = lookupCoded_(
    rec['Section_10_Equipment/o2'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.storage = lookupCoded_(
    rec['Section_10_Equipment/storage'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.milk_bank = lookupCoded_(
    rec['Section_10_Equipment/milk_bank'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.refrigerator = lookupCoded_(
    rec['Section_10_Equipment/refrigerator'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.resuscitaire = lookupCoded_(
    rec['Section_10_Equipment/resuscitaire'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.incubators = lookupCoded_(
    rec['Section_10_Equipment/incubators'],
    MATERNITY_INCUBATOR_MAP
  );
  out.ultrasound_in_unit = lookupCoded_(
    rec['Section_10_Equipment/ultrasound_001'],
    ULTRASOUND_AVAIL_MAP
  );
  out.delivery_beds = toIntegerOrBlank_(
    rec['Section_10_Equipment/beds_002']
  );
  out.catheter_quantity = toIntegerOrBlank_(
    rec['Section_10_Equipment/catheters']
  );
  out.suction_bulbs = lookupCoded_(
    rec['Section_10_Equipment/bulbs'],
    YES_NO_MAP
  );
  out.towels = lookupCoded_(
    rec['Section_10_Equipment/towels'],
    YES_NO_MAP
  );
  out.oxygen_quantity = toIntegerOrBlank_(
    rec['Section_10_Equipment/quantity']
  );

  expandSelectMultiple_(
    out,
    rec['Section_10_Equipment/supplies'],
    'equipment_supplies',
    MATERNITY_SUPPLIES_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['Section_10_Equipment/em_tray'],
    'equipment_em_tray',
    MATERNITY_EM_TRAY_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['Section_10_Equipment/equipment'],
    'equipment_resus_cart',
    MATERNITY_RESUS_CART_CHOICES
  );

  out.tetracycline = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/tetracycline',
      'Section_11_Commodit_cific_to_Labour_Ward/tetracycline'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.chlorhexidine = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/chlorhexidine',
      'Section_11_Commodit_cific_to_Labour_Ward/chlorhexidine'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.vit_k = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/vit_k',
      'Section_11_Commodit_cific_to_Labour_Ward/vit_k'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.oxytocin = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/oxytocin',
      'Section_11_Commodit_cific_to_Labour_Ward/oxytocin'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.hsc = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/hsc',
      'Section_11_Commodit_cific_to_Labour_Ward/hsc'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.misoprostol = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/misoprostol',
      'Section_11_Commodit_cific_to_Labour_Ward/misoprostol'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.tranexamic = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/tranexamic',
      'Section_11_Commodit_cific_to_Labour_Ward/tranexamic'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.magnesium = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/magnesium',
      'Section_11_Commodit_cific_to_Labour_Ward/magnesium'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.calcium = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/calcium',
      'Section_11_Commodit_cific_to_Labour_Ward/calcium'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.hydralazine = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/hydralazine',
      'Section_11_Commodit_cific_to_Labour_Ward/hydralazine'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.saline = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/saline',
      'Section_11_Commodit_cific_to_Labour_Ward/saline'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.methyldopa = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/methyldopa',
      'Section_11_Commodit_cific_to_Labour_Ward/methyldopa'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.dexamethasone = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/dexamethasone',
      'Section_11_Commodit_cific_to_Labour_Ward/dexamethasone'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.latex_gloves = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/latex',
      'Section_11_Commodit_cific_to_Labour_Ward/latex'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.sterile_gloves = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/sterile',
      'Section_11_Commodit_cific_to_Labour_Ward/sterile'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.masks = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/masks',
      'Section_11_Commodit_cific_to_Labour_Ward/masks'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.aprons = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/aprons',
      'Section_11_Commodit_cific_to_Labour_Ward/aprons'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.iv_cannulae = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/iv',
      'Section_11_Commodit_cific_to_Labour_Ward/iv'
    ]),
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.bcg_availability = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/bcg',
      'Section_11_Commodit_cific_to_Labour_Ward/bcg'
    ]),
    MATERNITY_BCG_AVAIL_MAP
  );
  out.hepb_availability = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/hepb',
      'Section_11_Commodit_cific_to_Labour_Ward/hepb'
    ]),
    MATERNITY_HEPB_AVAIL_MAP
  );

  out.malaria_rdt = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/malaria_001',
      'Section_11_Commodit_cific_to_Labour_Ward/malaria_001'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.hiv_test_kits = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/hiv',
      'Section_11_Commodit_cific_to_Labour_Ward/hiv'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.glucose_strips = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/glucose_001',
      'Section_11_Commodit_cific_to_Labour_Ward/glucose_001'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.ketone_strips = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/ketone',
      'Section_11_Commodit_cific_to_Labour_Ward/ketone'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.glucometer_strips = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/glucometer_001',
      'Section_11_Commodit_cific_to_Labour_Ward/glucometer_001'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.protein_strips = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/protein',
      'Section_11_Commodit_cific_to_Labour_Ward/protein'
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.syphilis_test_kits = lookupCoded_(
    firstValue_(rec, [
      'Section_11_Commodit_cific_to_labour_ward/syphilis',
      'Section_11_Commodit_cific_to_labour_ward/syphillis',
      'Section_11_Commodit_cific_to_Labour_Ward/syphilis',
      'Section_11_Commodit_cific_to_Labour_Ward/syphillis',
    ]),
    MATERNITY_LAB_UNIT_AVAIL_MAP
  );

  out.ultrasound_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/ultrasound_002',
      'Section_12_Adherenc_ence_Based_Practices/ultrasound_002',
      'Section_12_Adherenc_ence_based_Practices/ultrasound_002'
    ]),
    ULTRASOUND_AVAIL_MAP
  );

  out.equipment_calibration = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/calibration',
      'Section_12_Adherenc_ence_Based_Practices/calibration',
      'Section_12_Adherenc_ence_based_Practices/calibration'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.documentation_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/documentation',
      'Section_12_Adherenc_ence_Based_Practices/documentation',
      'Section_12_Adherenc_ence_based_Practices/documentation'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.informed_consent = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/consent_001',
      'Section_12_Adherenc_ence_Based_Practices/consent_001',
      'Section_12_Adherenc_ence_based_Practices/consent_001'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.staff_meeting = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/meeting',
      'Section_12_Adherenc_ence_Based_Practices/meeting',
      'Section_12_Adherenc_ence_based_Practices/meeting'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.arrival_assessment = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/arrival',
      'Section_12_Adherenc_ence_Based_Practices/arrival',
      'Section_12_Adherenc_ence_based_Practices/arrival'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.labour_care_guide = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/guide',
      'Section_12_Adherenc_ence_Based_Practices/guide',
      'Section_12_Adherenc_ence_based_Practices/guide'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.companion_support = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/companion_001',
      'Section_12_Adherenc_ence_Based_Practices/companion_001',
      'Section_12_Adherenc_ence_based_Practices/companion_001'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.delivery_practices = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/delivery_001',
      'Section_12_Adherenc_ence_Based_Practices/delivery_001',
      'Section_12_Adherenc_ence_based_Practices/delivery_001'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.information_sharing = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/information',
      'Section_12_Adherenc_ence_Based_Practices/information',
      'Section_12_Adherenc_ence_based_Practices/information'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.counselling_offered = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/counselling',
      'Section_12_Adherenc_ence_Based_Practices/counselling',
      'Section_12_Adherenc_ence_based_Practices/counselling'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.svd_support = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/svd',
      'Section_12_Adherenc_ence_Based_Practices/svd',
      'Section_12_Adherenc_ence_based_Practices/svd'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.roaming_staff = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/roaming',
      'Section_12_Adherenc_ence_Based_Practices/roaming',
      'Section_12_Adherenc_ence_based_Practices/roaming'
    ]),
    YES_NO_MAP
  );

  out.labour_support = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/support_001',
      'Section_12_Adherenc_ence_Based_Practices/support_001',
      'Section_12_Adherenc_ence_based_Practices/support_001'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.vital_signs_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/vital_signs',
      'Section_12_Adherenc_ence_Based_Practices/vital_signs',
      'Section_12_Adherenc_ence_based_Practices/vital_signs'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.pnc_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/pnc_001',
      'Section_12_Adherenc_ence_Based_Practices/pnc_001',
      'Section_12_Adherenc_ence_based_Practices/pnc_001'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.grief_support = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/grief',
      'Section_12_Adherenc_ence_Based_Practices/grief',
      'Section_12_Adherenc_ence_based_Practices/grief'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.pain_drugs = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/pain_drugs',
      'Section_12_Adherenc_ence_Based_Practices/pain_drugs',
      'Section_12_Adherenc_ence_based_Practices/pain_drugs'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.examination_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/examination',
      'Section_12_Adherenc_ence_Based_Practices/examination',
      'Section_12_Adherenc_ence_based_Practices/examination'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.clinical_review = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/clinical',
      'Section_12_Adherenc_ence_Based_Practices/clinical',
      'Section_12_Adherenc_ence_based_Practices/clinical'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.latching_support = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/latching',
      'Section_12_Adherenc_ence_Based_Practices/latching',
      'Section_12_Adherenc_ence_based_Practices/latching'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.passage_of_urine = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/passage',
      'Section_12_Adherenc_ence_Based_Practices/passage',
      'Section_12_Adherenc_ence_based_Practices/passage'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.register_complete = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/register',
      'Section_12_Adherenc_ence_Based_Practices/register',
      'Section_12_Adherenc_ence_based_Practices/register'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.maternal_observation = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/maternal',
      'Section_12_Adherenc_ence_Based_Practices/maternal',
      'Section_12_Adherenc_ence_based_Practices/maternal'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.feeding_adherence = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/feeding',
      'Section_12_Adherenc_ence_Based_Practices/feeding',
      'Section_12_Adherenc_ence_based_Practices/feeding'
    ]),
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.emergency_system = lookupCoded_(
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/system',
      'Section_12_Adherenc_ence_Based_Practices/system',
      'Section_12_Adherenc_ence_based_Practices/system'
    ]),
    YES_NO_MAP
  );

  expandSelectMultiple_(
    out,
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/triage_001',
      'Section_12_Adherenc_ence_Based_Practices/triage_001',
      'Section_12_Adherenc_ence_based_Practices/triage_001'
    ]),
    'triage_assessment',
    MATERNITY_TRIAGE_ASSESSMENT_CHOICES
  );

  expandSelectMultiple_(
    out,
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/charts',
      'Section_12_Adherenc_ence_Based_Practices/charts',
      'Section_12_Adherenc_ence_based_Practices/charts'
    ]),
    'labour_charts',
    MATERNITY_CHARTS_CHOICES
  );

  expandSelectMultiple_(
    out,
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/encourage',
      'Section_12_Adherenc_ence_Based_Practices/encourage',
      'Section_12_Adherenc_ence_based_Practices/encourage'
    ]),
    'labour_counselling',
    MATERNITY_LABOUR_COUNSELLING_CHOICES
  );

  expandSelectMultiple_(
    out,
    firstValue_(rec, [
      'Section_12_Adheranc_ence_based_practices/discharge',
      'Section_12_Adherenc_ence_Based_Practices/discharge',
      'Section_12_Adherenc_ence_based_Practices/discharge'
    ]),
    'discharge_counselling',
    MATERNITY_DISCHARGE_COUNSELLING_CHOICES
  );

  out.caesarean_wait_hours = lookupCoded_(
    rec['operation/operation_001'],
    MATERNITY_OPERATION_HOURS_MAP
  );

  out.anomalies_service = lookupCoded_(
    rec['services_offered/anomalies'],
    YES_NO_MAP
  );

  out.antibiotics_service = lookupCoded_(
    rec['services_offered/antibiotics'],
    YES_NO_MAP
  );

  out.avd_service = lookupCoded_(
    rec['services_offered/avd'],
    YES_NO_MAP
  );

  out.breastfeeding_service = lookupCoded_(
    rec['services_offered/breastfeeding'],
    YES_NO_MAP
  );

  out.newborn_care_service = lookupCoded_(
    rec['services_offered/newborn_care'],
    YES_NO_MAP
  );

  out.perineal_care = lookupCoded_(
    rec['services_offered/perineal_care'],
    YES_NO_MAP
  );

  out.placenta_service = lookupCoded_(
    rec['services_offered/placenta'],
    YES_NO_MAP
  );

  out.ppfp_service = lookupCoded_(
    rec['services_offered/ppfp'],
    YES_NO_MAP
  );

  out.resuscitation_service = lookupCoded_(
    rec['services_offered/resuscitation'],
    YES_NO_MAP
  );

  out.retained_placenta_service = lookupCoded_(
    rec['services_offered/retained'],
    YES_NO_MAP
  );

  out.understand_service = lookupCoded_(
    rec['services_offered/understand'],
    YES_NO_MAP
  );

  out.uterotonics_service = lookupCoded_(
    rec['services_offered/uterotonics'],
    YES_NO_MAP
  );

  out.uterotonics_alt = lookupCoded_(
    rec['services_offered/uterotonis'],
    YES_NO_MAP
  );

  out.antibiotics_freq = lookupCoded_(
    rec['services_offered/antibiotics_001'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.anticonvulsant_freq = lookupCoded_(
    rec['services_offered/anticonvu_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.avd_freq = lookupCoded_(
    rec['services_offered/avd_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.placenta_freq = lookupCoded_(
    rec['services_offered/placenta_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.resuscitation_freq = lookupCoded_(
    rec['services_offered/resusci_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.retained_freq = lookupCoded_(
    rec['services_offered/retained_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.uterotonics_freq = lookupCoded_(
    rec['services_offered/uterotinics_freq'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.anticonvulsant_lab = lookupCoded_(
    rec['services_offered/anticonvulsant'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.blood_group_lab = lookupCoded_(
    rec['services_offered/blood_group'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.bs_malaria_lab = lookupCoded_(
    rec['services_offered/bs_malaria'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.dbs_lab = lookupCoded_(
    rec['services_offered/dbs'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.foetal_viability = lookupCoded_(
    rec['services_offered/foetal_viability'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.gestation_ultrasound = lookupCoded_(
    rec['services_offered/gestation'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.glucose_lab = lookupCoded_(
    rec['services_offered/glucose'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.hep_b_lab = lookupCoded_(
    rec['services_offered/hep_b'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.hgb_lab = lookupCoded_(
    rec['services_offered/hgb'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.hiv_rapid_lab = lookupCoded_(
    rec['services_offered/hiv_rapid'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.malaria_lab = lookupCoded_(
    rec['services_offered/malaria'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.microscopy_lab = lookupCoded_(
    rec['services_offered/microscopy'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.no_foetuses = lookupCoded_(
    rec['services_offered/no_foetuses'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.placenta_det = lookupCoded_(
    rec['services_offered/placenta_det'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.rpr_vdrl = lookupCoded_(
    rec['services_offered/rpr_vdrl'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.tb_testing = lookupCoded_(
    rec['services_offered/tb_testing'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.urinalysis_lab = lookupCoded_(
    rec['services_offered/urinalysis'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.urine_glucose_lab = lookupCoded_(
    rec['services_offered/urine_glucose'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.urine_protein_lab = lookupCoded_(
    rec['services_offered/urine_protein'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.urine_rapid_lab = lookupCoded_(
    rec['services_offered/urine_rapid'],
    MATERNITY_LAB_AVAILABILITY_MAP
  );

  out.ctg_service = lookupCoded_(
    rec['services_offered/ctg'],
    RADIOLOGY_AVAILABILITY_MAP
  );
  out.pocus_service = lookupCoded_(
    rec['services_offered/pocus'],
    ULTRASOUND_AVAIL_MAP
  );
  out.ultrasound_service = lookupCoded_(
    rec['services_offered/ultrasound'],
    ULTRASOUND_AVAIL_MAP
  );
  out.xray_service = lookupCoded_(
    rec['services_offered/xray'],
    RADIOLOGY_AVAILABILITY_MAP
  );

  expandSelectMultiple_(
    out,
    rec['services_offered/immunization'],
    'services_immunization',
    MATERNITY_IMMUNIZATION_CHOICES
  );

  out.training_abortion_care = formatYearMonth_(
    rec['training/abortion_care']
  );

  out.training_breastfeeding = formatYearMonth_(
    rec['training/breastfeeding_001']
  );

  out.training_cardio = formatYearMonth_(
    rec['training/cardio']
  );

  out.training_communication = formatYearMonth_(
    rec['training/communication']
  );

  out.training_companion = formatYearMonth_(
    rec['training/companion']
  );

  out.training_emotional_support = formatYearMonth_(
    rec['training/emotional_sup']
  );

  out.training_emonc_guidelines = formatYearMonth_(
    rec['training/emonc_guidelines']
  );

  out.training_family_planning = formatYearMonth_(
    rec['training/family_planning']
  );

  out.training_haemovigilance = formatYearMonth_(
    rec['training/haemovigi']
  );

  out.training_harmful_practices = formatYearMonth_(
    rec['training/harmful_prac']
  );

  out.training_ipc = formatYearMonth_(
    rec['training/ipc']
  );

  out.training_mpdsr = formatYearMonth_(
    rec['training/mpdsr_001']
  );

  out.training_newborn_care = formatYearMonth_(
    rec['training/newborn_care_001']
  );

  out.training_newborn_infection = formatYearMonth_(
    rec['training/newborn_infection']
  );

  out.training_nnr = formatYearMonth_(
    rec['training/nnr']
  );

  out.training_obstetric_care = formatYearMonth_(
    rec['training/obstetric_care']
  );

  out.training_pain_relief = formatYearMonth_(
    rec['training/pain_relief']
  );

  out.training_pnc = formatYearMonth_(
    rec['training/pnc']
  );

  out.training_rmc = formatYearMonth_(
    rec['training/rmc']
  );

  out.training_stress_mgt = formatYearMonth_(
    rec['training/stress_mgt']
  );

  out.training_support = formatYearMonth_(
    rec['training/support']
  );

  out.wash_accessible = lookupCoded_(
    rec['wash/accessible'],
    YES_NO_MAP
  );
  out.wash_bathrooms = lookupCoded_(
    rec['wash/bathrooms'],
    MATERNITY_BATHROOM_CLEANING_MAP
  );
  out.wash_clean = lookupCoded_(
    rec['wash/clean'],
    YES_NO_MAP
  );
  out.wash_disposable_towels = lookupCoded_(
    rec['wash/disposable'],
    MATERNITY_DISPOSABLE_TOWELS_MAP
  );
  out.wash_disposal = lookupCoded_(
    rec['wash/disposal'],
    YES_NO_MAP
  );
  out.wash_drainage = lookupCoded_(
    rec['wash/drainage'],
    YES_NO_MAP
  );
  out.wash_gender = lookupCoded_(
    rec['wash/gender'],
    YES_NO_MAP
  );
  out.wash_hand_washing = lookupCoded_(
    rec['wash/hand_washing'],
    HAND_HYGIENE_MAP
  );
  out.wash_labour = lookupCoded_(
    rec['wash/labour'],
    YES_NO_MAP
  );
  out.wash_latrine = lookupCoded_(
    rec['wash/latrine'],
    maternityLatrineMap_(rec)
  );
  out.wash_leak_proof = lookupCoded_(
    rec['wash/leak_proof'],
    YES_NO_MAP
  );
  out.wash_menstrual = lookupCoded_(
    rec['wash/menstrual'],
    YES_NO_MAP
  );
  out.wash_no_toilets = toIntegerOrBlank_(
    rec['wash/no_toilets']
  );
  out.wash_sharp = lookupCoded_(
    rec['wash/sharp'],
    YES_NO_MAP
  );
  out.wash_source = lookupCoded_(
    rec['wash/source'],
    WATER_SOURCE_MAP
  );
  out.wash_station = lookupCoded_(
    rec['wash/station'],
    YES_NO_MAP
  );
  out.wash_visible = lookupCoded_(
    rec['wash/visible'],
    YES_NO_MAP
  );
  out.wash_water_freq = lookupCoded_(
    rec['wash/water_freq'],
    YES_NO_MAP
  );

  return out;
}

function inpatientMaternityPreferredHeaders_() {
  return [
    UUID_FIELD,
    'date_started',
    'date_ended',
    'date_submitted',
    'county',
    'facility',
    'facility_level',
    'contact_person',
    'name_contact',
    'phone_number',
    'functional_maternity_unit',
    'birth_notification',
    'birth_death_notification',
    'birth_register',
    'death_notification',
    'delivery_notes',
    'delivery_register',
    'death_register',
    'autopsy_forms',
    'inpatient_maternity_file',
    'kmc_chart',
    'maternal_death_notification',
    'maternal_death_review',
    'newborn_file',
    'newborn_register',
    'nursing_register',
    'nutrition_form',
    'perinatal_death_notification',
    'perinatal_death_review',
    'postnatal_register',
    'postnatal_register_alt',
    ...selectMultipleHeaders_('health_records_patient_file', MATERNITY_PATIENT_FILE_CHOICES),
    'rehab_staff',
    'auditory_privacy',
    'visual_barrier',
    'privacy_beds',
    'bed_spacing',
    'files_privacy',
    'single_rooms',
    'visual_privacy',
    'eclampsia_sop',
    'handwashing_sop',
    'intrapartum_sop',
    'newborn_mgt_sop',
    'pph_sop',
    'pre_eclampsia_sop',
    'referral_sop',
    'resuscitation_sop',
    'sepsis_sop',
    'maternity_sop',
    'procurement_protocol',
    'maternity_checklist',
    ...selectMultipleHeaders_('sop_policy_a', MATERNITY_POLICY_A_CHOICES),
    ...selectMultipleHeaders_('sop_policy_b', MATERNITY_POLICY_B_CHOICES),
    ...selectMultipleHeaders_('sop_policy_c', MATERNITY_POLICY_C_CHOICES),
    ...selectMultipleHeaders_('sop_policy_d', MATERNITY_POLICY_D_CHOICES),
    'triage_area',
    'waiting_area',
    'disabled_access',
    'waiting_benches',
    'cabinets',
    'service_charter',
    'draught_free',
    'dust_evidence',
    'fire_extinguishers',
    'fan_available',
    'isolation_space',
    'well_lit',
    'maintenance_infrastructure',
    'building_material',
    'recovery_room',
    'resuscitation_area',
    'clear_signage',
    'sound_structures',
    'temperature_control',
    'ventilation',
    'labour_ward_beds',
    'exam_rooms',
    ...selectMultipleHeaders_('infrastructure_education', MATERNITY_EDUCATION_CHOICES),
    'labour_area_privacy',
    'childbirth_area_privacy',
    'ambubags',
    'doppler',
    'exam_light',
    'fetoscopes',
    'glucometer',
    'obstetric_kit',
    'oximeter',
    'pharyngeal_airway',
    'preeclampsia_kit',
    'resus_kits',
    'vd_kits',
    'vacuum_extractor',
    'suction',
    'adult_scale',
    'infant_scale',
    'stadiometer',
    'thermometers',
    'stethoscopes',
    'laryngoscope',
    'bp_apparatus',
    'ctg_machine',
    'oxygen_equipment',
    'o2_source',
    'storage',
    'milk_bank',
    'refrigerator',
    'resuscitaire',
    'incubators',
    'ultrasound_in_unit',
    'delivery_beds',
    'catheter_quantity',
    'suction_bulbs',
    'towels',
    'oxygen_quantity',
    ...selectMultipleHeaders_('equipment_supplies', MATERNITY_SUPPLIES_CHOICES),
    ...selectMultipleHeaders_('equipment_em_tray', MATERNITY_EM_TRAY_CHOICES),
    ...selectMultipleHeaders_('equipment_resus_cart', MATERNITY_RESUS_CART_CHOICES),
    'tetracycline',
    'chlorhexidine',
    'vit_k',
    'oxytocin',
    'hsc',
    'misoprostol',
    'tranexamic',
    'magnesium',
    'calcium',
    'hydralazine',
    'saline',
    'methyldopa',
    'dexamethasone',
    'latex_gloves',
    'sterile_gloves',
    'masks',
    'aprons',
    'iv_cannulae',
    'bcg_availability',
    'hepb_availability',
    'malaria_rdt',
    'hiv_test_kits',
    'glucose_strips',
    'ketone_strips',
    'glucometer_strips',
    'protein_strips',
    'syphilis_test_kits',
    'ultrasound_adherence',
    'equipment_calibration',
    'documentation_adherence',
    'informed_consent',
    'staff_meeting',
    'arrival_assessment',
    'labour_care_guide',
    'companion_support',
    'delivery_practices',
    'information_sharing',
    'counselling_offered',
    'svd_support',
    'roaming_staff',
    'labour_support',
    'vital_signs_adherence',
    'pnc_adherence',
    'grief_support',
    'pain_drugs',
    'examination_adherence',
    'clinical_review',
    'latching_support',
    'passage_of_urine',
    'register_complete',
    'maternal_observation',
    'feeding_adherence',
    'emergency_system',
    ...selectMultipleHeaders_('triage_assessment', MATERNITY_TRIAGE_ASSESSMENT_CHOICES),
    ...selectMultipleHeaders_('labour_charts', MATERNITY_CHARTS_CHOICES),
    ...selectMultipleHeaders_('labour_counselling', MATERNITY_LABOUR_COUNSELLING_CHOICES),
    ...selectMultipleHeaders_('discharge_counselling', MATERNITY_DISCHARGE_COUNSELLING_CHOICES),
    'caesarean_wait_hours',
    'anomalies_service',
    'antibiotics_service',
    'avd_service',
    'breastfeeding_service',
    'newborn_care_service',
    'perineal_care',
    'placenta_service',
    'ppfp_service',
    'resuscitation_service',
    'retained_placenta_service',
    'understand_service',
    'uterotonics_service',
    'uterotonics_alt',
    'antibiotics_freq',
    'anticonvulsant_freq',
    'avd_freq',
    'placenta_freq',
    'resuscitation_freq',
    'retained_freq',
    'uterotonics_freq',
    'anticonvulsant_lab',
    'blood_group_lab',
    'bs_malaria_lab',
    'dbs_lab',
    'foetal_viability',
    'gestation_ultrasound',
    'glucose_lab',
    'hep_b_lab',
    'hgb_lab',
    'hiv_rapid_lab',
    'malaria_lab',
    'microscopy_lab',
    'no_foetuses',
    'placenta_det',
    'rpr_vdrl',
    'tb_testing',
    'urinalysis_lab',
    'urine_glucose_lab',
    'urine_protein_lab',
    'urine_rapid_lab',
    'ctg_service',
    'pocus_service',
    'ultrasound_service',
    'xray_service',
    ...selectMultipleHeaders_('services_immunization', MATERNITY_IMMUNIZATION_CHOICES),
    'training_abortion_care',
    'training_breastfeeding',
    'training_cardio',
    'training_communication',
    'training_companion',
    'training_emotional_support',
    'training_emonc_guidelines',
    'training_family_planning',
    'training_haemovigilance',
    'training_harmful_practices',
    'training_ipc',
    'training_mpdsr',
    'training_newborn_care',
    'training_newborn_infection',
    'training_nnr',
    'training_obstetric_care',
    'training_pain_relief',
    'training_pnc',
    'training_rmc',
    'training_stress_mgt',
    'training_support',
    'wash_accessible',
    'wash_bathrooms',
    'wash_clean',
    'wash_disposable_towels',
    'wash_disposal',
    'wash_drainage',
    'wash_gender',
    'wash_hand_washing',
    'wash_labour',
    'wash_latrine',
    'wash_leak_proof',
    'wash_menstrual',
    'wash_no_toilets',
    'wash_sharp',
    'wash_source',
    'wash_station',
    'wash_visible',
    'wash_water_freq',
  ];
}
