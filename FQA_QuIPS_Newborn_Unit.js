/** Newborn Unit transformation and preferred headers. */

function transformNewbornUnitRecord_(rec) {
  const out = {};
  out[UUID_FIELD] = rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  // Preserve every field not explicitly transformed below.
  assignPassthrough_(out, rec, NEWBORN_UNIT_SOURCE_KEYS);

  const dateStarted = formatDateMinute_(
    firstValue_(rec, ['starttime', 'start'])
  );
  const dateEnded = formatDateMinute_(
    firstValue_(rec, ['endtime', 'end'])
  );
  const dateSubmitted = formatDateMinute_(
    firstValue_(rec, ['today', '_submission_time'])
  );

  out.date_started = dateStarted;
  out.date_ended = dateEnded;
  out.date_submitted = dateSubmitted;

  assignFacilityProfile_(
    out,
    rec,
    dateSubmitted,
    'facility_profile/gazetted_facility'
  );

  out.functional_nbu = lookupCoded_(
    rec['facility_profile/unit'],
    YES_NO_MAP
  );

  out.newborn_admissions = toIntegerOrBlank_(
    rec['service/needs']
  );

  out.premature_care = lookupCoded_(
    rec['service/premature_care'],
    YES_NO_MAP
  );

  out.referral_weight = lookupCoded_(
    rec['service/referral_weight'],
    REFERRAL_WEIGHT_MAP
  );

  out.nutritional_services = lookupCoded_(
    rec['service/nutritional_services'],
    YES_NO_MAP
  );

  out.nursing_care = lookupCoded_(
    rec['service/nursing_care'],
    YES_NO_MAP
  );

  out.congenital_care = lookupCoded_(
    rec['service/congenital_care'],
    YES_NO_MAP
  );

  out.asphyxia_care = lookupCoded_(
    rec['service/asphyxia_care'],
    YES_NO_MAP
  );

  out.blood_count = lookupCoded_(
    rec['service/blood_count'],
    LAB_AVAILABILITY_MAP
  );

  out.malaria_test = lookupCoded_(
    rec['service/malaria_test'],
    LAB_AVAILABILITY_MAP
  );

  out.urine = lookupCoded_(
    rec['service/urine'],
    LAB_AVAILABILITY_MAP
  );

  out.blood_cultures = lookupCoded_(
    rec['service/blood_cultures'],
    LAB_AVAILABILITY_MAP
  );

  out.lumbar_puncture = lookupCoded_(
    rec['service/lumbar'],
    LAB_AVAILABILITY_MAP
  );

  out.hiv_test = lookupCoded_(
    rec['service/hiv_antibody'],
    LAB_AVAILABILITY_MAP
  );

  out.coombs_testing = lookupCoded_(
    rec['service/coombs'],
    LAB_AVAILABILITY_MAP
  );

  out.bone_chemistry = lookupCoded_(
    rec['service/bone_chem'],
    LAB_AVAILABILITY_MAP
  );

  out.blood_group = lookupCoded_(
    rec['service/blood_group'],
    LAB_AVAILABILITY_MAP
  );

  out.urinalysis = lookupCoded_(
    rec['service/urinalysis'],
    LAB_AVAILABILITY_MAP
  );

  out.crp_test = lookupCoded_(
    rec['service/crp_test'],
    LAB_AVAILABILITY_MAP
  );

  out.thyroid_test = lookupCoded_(
    rec['service/thyroid_test'],
    LAB_AVAILABILITY_MAP
  );

  out.electrolyte = lookupCoded_(
    rec['service/electrolyte'],
    LAB_AVAILABILITY_MAP
  );

  out.liver_function = lookupCoded_(
    rec['service/liver_func'],
    LAB_AVAILABILITY_MAP
  );

  out.creatinine = lookupCoded_(
    rec['service/creatinine'],
    LAB_AVAILABILITY_MAP
  );

  out.glucose_tests = lookupCoded_(
    rec['service/glucose'],
    UNIT_AVAILABILITY_MAP
  );

  out.bilirubin_testing = lookupCoded_(
    rec['service/bilirubin'],
    UNIT_AVAILABILITY_MAP
  );

  out.cranial_ultrasound = lookupCoded_(
    rec['service/cranial_ultras'],
    RADIOLOGY_AVAILABILITY_MAP
  );

  out.x_ray = lookupCoded_(
    rec['service/x_ray'],
    RADIOLOGY_AVAILABILITY_MAP
  );

  out.imaging_time = lookupCoded_(
    rec['service/avg_time'],
    IMAGING_TIME_MAP
  );

  out.employed_neonatologists = toIntegerOrBlank_(
    rec['resource/employed_neonatologists']
  );

  out.contract_neonatologists = toIntegerOrBlank_(
    rec['resource/contract_neonatologists']
  );

  out.employed_paediatrician = toIntegerOrBlank_(
    rec['resource/employed_paed']
  );

  out.contracted_paediatrician = toIntegerOrBlank_(
    rec['resource/contract_paed']
  );

  out.neo_ped_24hrs = lookupCoded_(
    rec['resource/available_24hrs'],
    YES_NO_MAP
  );

  out.employed_mo = toIntegerOrBlank_(
    rec['resource/employed_mos']
  );

  out.contract_mo = toIntegerOrBlank_(
    rec['resource/contract_mos']
  );

  out.adequate_mo = lookupCoded_(
    rec['resource/adeq_mos'],
    YES_NO_MAP
  );

  out.employed_nurses = toIntegerOrBlank_(
    rec['resource/employed_rn']
  );

  out.contract_nurses = toIntegerOrBlank_(
    rec['resource/contract_rn']
  );

  out.adequate_reg_nurses = lookupCoded_(
    rec['resource/adeq_rn'],
    YES_NO_MAP
  );

  out.employed_co = toIntegerOrBlank_(
    rec['resource/employed_cos']
  );

  out.contract_co = toIntegerOrBlank_(
    rec['resource/contract_cos']
  );

  out.adequate_co = lookupCoded_(
    rec['resource/adeq_cos'],
    YES_NO_MAP
  );

  out.death_register = lookupCoded_(
    rec['records/death_reg'],
    YES_NO_MAP
  );

  out.deathreg_consistent_use = lookupCoded_(
    rec['records/consistent_use'],
    YES_NO_MAP
  );

  out.summary_register = lookupCoded_(
    rec['records/integrated_rh_mch'],
    YES_NO_MAP
  );

  out.neonatal_register = lookupCoded_(
    rec['records/inpatient_neonatal_reg'],
    YES_NO_MAP
  );

  out.newborn_admission = lookupCoded_(
    rec['records/nb_admission'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  expandSelectMultiple_(
    out,
    rec['records/patient_files'],
    'patient_files',
    PATIENT_FILES_CHOICES
  );

  out.perinatal_notification = lookupCoded_(
    rec['records/perinatal_notification'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.perinatal_review = lookupCoded_(
    rec['records/perinatal_review'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.visual_privacy = lookupCoded_(
    rec['privacy/visual_privacy'],
    ROOM_PRIVACY_MAP
  );

  out.auditory_privacy = lookupCoded_(
    rec['privacy/auditory_privacy'],
    ROOM_PRIVACY_MAP
  );

  out.newborn_training = formatYearMonth_(
    rec['train/newborn']
  );

  out.nnr_training = formatYearMonth_(
    rec['train/nnr']
  );

  out.breastfeeding_training = formatYearMonth_(
    rec['train/breastfeeding']
  );

  out.infections_training = formatYearMonth_(
    rec['train/infections']
  );

  out.comprehensive_training = formatYearMonth_(
    rec['train/comprehensive']
  );

  out.hiv_neonate_training = formatYearMonth_(
    rec['train/neonate_hiv']
  );

  out.kangaroo_training = formatYearMonth_(
    rec['train/kangaroo']
  );

  out.standard_infection_control = formatYearMonth_(
    rec['train/sic']
  );

  out.training_hypogycemia = formatYearMonth_(
    rec['train/hypoglycemia']
  );

  out.training_preterm = formatYearMonth_(
    rec['train/preterm_care']
  );

  out.training_newborn_jaundice = formatYearMonth_(
    rec['train/newborn_jaundice']
  );

  out.sepsis_sop = lookupCoded_(
    rec['sop/sepsis'],
    SOP_PROTOCOL_MAP
  );

  out.jaundice_sop = lookupCoded_(
    rec['sop/jaundice'],
    SOP_PROTOCOL_MAP
  );

  out.hypoglycemia_sop = lookupCoded_(
    firstValue_(rec, [
      'sop/hypoglycemia_sop',
      'sop/hypoglycemia_001',
      'sop/hypoglycemia',
    ]),
    SOP_PROTOCOL_MAP
  );

  out.neonatal_resuscitation_sop = lookupCoded_(
    rec['sop/neo_resus'],
    SOP_PROTOCOL_MAP
  );

  out.kmc_sop = lookupCoded_(
    rec['sop/kmc'],
    SOP_PROTOCOL_MAP
  );

  out.handwash_sop = lookupCoded_(
    rec['sop/handwash'],
    SOP_PROTOCOL_MAP
  );

  out.referral_sop = lookupCoded_(
    rec['sop/referral'],
    SOP_PROTOCOL_MAP
  );

  expandSelectMultiple_(
    out,
    rec['sop/policy'],
    'sop_policy',
    SOP_POLICY_CHOICES
  );

  out.water_source = lookupCoded_(
    rec['sanitation/wat_sour'],
    WATER_SOURCE_MAP
  );

  out.water_available_consistently = lookupCoded_(
    rec['sanitation/wav_avail'],
    YES_NO_MAP
  );

  out.drainage_system = lookupCoded_(
    rec['sanitation/drainage'],
    YES_NO_MAP
  );

  out.separate_sink = lookupCoded_(
    rec['sanitation/sinks'],
    YES_NO_MAP
  );

  out.hand_hygiene = lookupCoded_(
    rec['sanitation/hand'],
    HAND_HYGIENE_MAP
  );

  out.waste_management = lookupCoded_(
    rec['sanitation/waste'],
    WASTE_MANAGEMENT_MAP
  );

  out.waste_segregation = lookupCoded_(
    rec['sanitation/bins'],
    YES_NO_MAP
  );

  out.cleaning_register = lookupCoded_(
    rec['sanitation/clean_reg'],
    YES_NO_MAP
  );

  out.decontamination_area = lookupCoded_(
    rec['sanitation/decontamination'],
    YES_NO_MAP
  );

  out.decontamination_checklist = lookupCoded_(
    rec['sanitation/checklist'],
    YES_NO_MAP
  );

  out.utensil_cleaning_area = lookupCoded_(
    rec['sanitation/utensil'],
    YES_NO_MAP
  );

  out.laundry = lookupCoded_(
    rec['sanitation/laundry'],
    YES_NO_MAP
  );

  out.linen = lookupCoded_(
    rec['sanitation/linen'],
    YES_NO_MAP
  );

  out.sharp_container = lookupCoded_(
    rec['sanitation/sharp'],
    YES_NO_MAP
  );

  out.sharp3_4full = lookupCoded_(
    rec['sanitation/sharp3_4'],
    YES_NO_MAP
  );

  out.sharp_full = lookupCoded_(
    rec['sanitation/sharp_full'],
    YES_NO_MAP
  );

  out.latrine = lookupCoded_(
    rec['sanitation/latrine'],
    YES_NO_MAP
  );

  out.latrine_clients = lookupCoded_(
    rec['sanitation/lat_client'],
    YES_NO_MAP
  );

  out.handwashing_station = lookupCoded_(
    rec['sanitation/station'],
    YES_NO_MAP
  );

  out.disinfect_washrooms = lookupCoded_(
    rec['sanitation/disinfect'],
    YES_NO_MAP
  );

  out.clean_washroom = lookupCoded_(
    rec['sanitation/clean'],
    YES_NO_MAP
  );

  out.access_disability = lookupCoded_(
    rec['sanitation/access'],
    YES_NO_MAP
  );

  out.menstrual_hygiene = lookupCoded_(
    rec['sanitation/menstrual'],
    YES_NO_MAP
  );

  out.maintenance_infrastructure = lookupCoded_(
    rec['structure/maintenance'],
    YES_NO_MAP
  );

  out.well_lit = lookupCoded_(
    rec['structure/lighting'],
    YES_NO_MAP
  );

  out.ventilation = lookupCoded_(
    rec['structure/ventilation'],
    YES_NO_MAP
  );

  out.procedure_rooms = toIntegerOrBlank_(
    rec['structure/proc_rooms']
  );

  out.changing_area = lookupCoded_(
    rec['structure/chang_area'],
    YES_NO_MAP
  );

  out.kitchionette = lookupCoded_(
    rec['structure/kitchionette'],
    YES_NO_MAP
  );

  out.fire_extinguishers = lookupCoded_(
    rec['structure/fire'],
    YES_NO_MAP
  );

  out.clear_signage = lookupCoded_(
    rec['structure/signs'],
    YES_NO_MAP
  );

  out.clear_charter = lookupCoded_(
    rec['structure/charter'],
    YES_NO_MAP
  );

  out.cots_incubator = lookupCoded_(
    rec['structure/cots'],
    YES_NO_MAP
  );

  out.kmc_area = lookupCoded_(
    rec['structure/kmc_area'],
    YES_NO_MAP
  );

  out.room_temp = lookupCoded_(
    rec['structure/room_temp'],
    YES_NO_MAP
  );

  out.draught = lookupCoded_(
    rec['structure/draught'],
    YES_NO_MAP
  );

  out.private_room = lookupCoded_(
    rec['structure/priv_room'],
    YES_NO_MAP
  );

  out.counselling_room = lookupCoded_(
    rec['structure/couns_room'],
    YES_NO_MAP
  );

  out.worktop = lookupCoded_(
    rec['structure/worktop'],
    YES_NO_MAP
  );

  out.nurse_desk = lookupCoded_(
    rec['structure/desk'],
    YES_NO_MAP
  );

  out.space_sick_neonates = lookupCoded_(
    rec['structure/neo_space'],
    YES_NO_MAP
  );

  out.isolation_room = lookupCoded_(
    rec['structure/iso_room'],
    YES_NO_MAP
  );

  out.resuscitation_area = lookupCoded_(
    rec['structure/resus_area'],
    YES_NO_MAP
  );

  out.sluice_room = lookupCoded_(
    rec['structure/sluice'],
    YES_NO_MAP
  );

  out.temporary_storage = lookupCoded_(
    rec['structure/temp_store'],
    YES_NO_MAP
  );

  out.cctv = lookupCoded_(
    rec['structure/cctv'],
    YES_NO_MAP
  );

  out.dust_evidence = lookupCoded_(
    rec['structure/dust'],
    YES_NO_MAP
  );

  out.baby_beds = toIntegerOrBlank_(
    rec['equip/beds']
  );

  out.resuscitaires_nbu = toIntegerOrBlank_(
    rec['equip/resuscitaires']
  );

  out.bed_space = lookupCoded_(
    rec['equip/bed_space'],
    YES_NO_MAP
  );

  out.phototherapy_lamp = lookupCoded_(
    rec['equip/lamp'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.radiant_warmer = lookupCoded_(
    rec['equip/warmer'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.heat_source = lookupCoded_(
    rec['equip/heat'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.wall_clock = lookupCoded_(
    rec['equip/clock'],
    YES_NO_MAP
  );

  out.wall_thermometer = lookupCoded_(
    rec['equip/thermometer'],
    YES_NO_MAP
  );

  out.exam_light_available = lookupCoded_(
    rec['equip/exam_light'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.equipment_cpap = lookupCoded_(
    rec['equip/cpap'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.monitors = lookupCoded_(
    rec['equip/monitors'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.neonatal_bp = lookupCoded_(
    rec['equip/neobp'],
    YES_NO_MAP
  );

  out.oximeters_neonates = lookupCoded_(
    rec['equip/oximeters'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.transfusion_kit = lookupCoded_(
    rec['equip/trans_kit'],
    YES_NO_MAP
  );

  out.drip_stands = lookupCoded_(
    rec['equip/drip_stands'],
    YES_NO_MAP
  );

  out.stethoscopes_nbu = lookupCoded_(
    rec['equip/stethoscopes'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.glucometer_nbu = lookupCoded_(
    rec['equip/glucometer'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.sunction_pump = lookupCoded_(
    rec['equip/pump'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.sunction_bulbs = lookupCoded_(
    rec['equip/bulbs'],
    YES_NO_MAP
  );

  out.thermometer_nbu = lookupCoded_(
    rec['equip/therm'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.thermometer_readings = lookupCoded_(
    rec['equip/low_therm'],
    YES_NO_MAP
  );

  out.weighing_scale = lookupCoded_(
    rec['equip/scale'],
    EQUIP_FUNCTIONAL_MAP
  );

  expandSelectMultiple_(
    out,
    rec['equip/resus_equip'],
    'equip_resus_equip',
    RESUS_EQUIP_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['equip/oxy_source'],
    'equip_oxy_source',
    OXY_SOURCE_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['equip/cannulae'],
    'equip_cannulae',
    CANNULAE_CHOICES
  );

  out.tetraycline = lookupCoded_(
    rec['commodities/tetraycline'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.chlorhexidine = lookupCoded_(
    rec['commodities/chlorhexidine'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.iv_fluid = lookupCoded_(
    rec['commodities/iv_fluid'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.vitk = lookupCoded_(
    rec['commodities/vitk'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.latex = lookupCoded_(
    rec['commodities/latex'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.sterile = lookupCoded_(
    rec['commodities/sterile'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.soluset = lookupCoded_(
    rec['commodities/soluset'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.infant_formula = lookupCoded_(
    rec['commodities/inf_form'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.feeding_cups = lookupCoded_(
    rec['commodities/cups'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.syringe_sizes = lookupCoded_(
    rec['commodities/syringes'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.needles_sizes = lookupCoded_(
    rec['commodities/needles'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.microdrippers = lookupCoded_(
    rec['commodities/microdrippers'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.iv_sets = lookupCoded_(
    rec['commodities/iv_sets'],
    NEWBORN_ADMISSION_AVAIL_MAP
  );

  expandSelectMultiple_(
    out,
    rec['commodities/catheters'],
    'commodities_catheters',
    SIZE_4_6_8_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['commodities/materials'],
    'commodities_materials',
    MATERIALS_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['commodities/suction'],
    'commodities_suction',
    SIZE_4_6_8_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['commodities/tubes'],
    'commodities_tubes',
    SIZE_4_6_8_CHOICES
  );

  out.kmc_initiated = lookupCoded_(
    rec['adherence/kmc2'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.preterm_lowbirth = lookupCoded_(
    rec['adherence/preterm'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.feeding_freq = lookupCoded_(
    rec['adherence/feeding'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.breastmilk = lookupCoded_(
    rec['adherence/breastmilk'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.express_milk = lookupCoded_(
    rec['adherence/express'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.monitoring_plan = lookupCoded_(
    rec['adherence/plan'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.neonate_review = lookupCoded_(
    rec['adherence/neonates'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.discharge = lookupCoded_(
    rec['adherence/discharge'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.discharge_note = lookupCoded_(
    rec['adherence/disch_note'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.infact_referral = lookupCoded_(
    rec['adherence/inf_refer'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.system_near_nbu = lookupCoded_(
    rec['adherence/system'],
    YES_NO_MAP
  );

  out.caregiver = lookupCoded_(
    rec['adherence/caregiver'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.weight_gain = lookupCoded_(
    rec['adherence/weight'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.birth_weight = lookupCoded_(
    rec['adherence/birth_weight'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.condition_stable = lookupCoded_(
    rec['adherence/condition'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.gestation_34wks = lookupCoded_(
    rec['adherence/gestation'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.paediatric_rco = lookupCoded_(
    rec['adherence/paediatric'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.specialized_care = lookupCoded_(
    rec['adherence/care'],
    ALWAYS_SOMETIMES_NEVER_MAP
  );

  out.nbu_open = lookupCoded_(
    rec['Section_13_Hours_of_Operation/lab_open'],
    NBU_OPEN_MAP
  );

  return out;
}

function newbornUnitPreferredHeaders_() {
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
    'functional_nbu',
    'newborn_admissions',
    'premature_care',
    'referral_weight',
    'nutritional_services',
    'nursing_care',
    'congenital_care',
    'asphyxia_care',
    'blood_count',
    'malaria_test',
    'urine',
    'blood_cultures',
    'lumbar_puncture',
    'hiv_test',
    'coombs_testing',
    'bone_chemistry',
    'blood_group',
    'urinalysis',
    'crp_test',
    'thyroid_test',
    'electrolyte',
    'liver_function',
    'creatinine',
    'glucose_tests',
    'bilirubin_testing',
    'cranial_ultrasound',
    'x_ray',
    'imaging_time',
    'employed_neonatologists',
    'contract_neonatologists',
    'employed_paediatrician',
    'contracted_paediatrician',
    'neo_ped_24hrs',
    'employed_mo',
    'contract_mo',
    'adequate_mo',
    'employed_nurses',
    'contract_nurses',
    'adequate_reg_nurses',
    'employed_co',
    'contract_co',
    'adequate_co',
    'death_register',
    'deathreg_consistent_use',
    'summary_register',
    'neonatal_register',
    'newborn_admission',
    'patient_files_observation_charts',
    'patient_files_treatment_sheet',
    'patient_files_weight_chart',
    'patient_files_medication_chart',
    'patient_files_ballard_scoring_sheet',
    'patient_files_input_output_monitoring_chart',
    'patient_files_vital_signs_chart',
    'patient_files_care_plans',
    'patient_files_discharge_summary',
    'patient_files_consent_form',
    'patient_files_pre_medication_notes',
    'patient_files_continuation_sheet',
    'patient_files_none',
    'perinatal_notification',
    'perinatal_review',
    'visual_privacy',
    'auditory_privacy',
    'newborn_training',
    'nnr_training',
    'breastfeeding_training',
    'infections_training',
    'comprehensive_training',
    'hiv_neonate_training',
    'kangaroo_training',
    'standard_infection_control',
    'training_hypogycemia',
    'training_preterm',
    'training_newborn_jaundice',
    'sepsis_sop',
    'jaundice_sop',
    'hypoglycemia_sop',
    'neonatal_resuscitation_sop',
    'kmc_sop',
    'handwash_sop',
    'referral_sop',
    'sop_policy_incubator_temperature_setting',
    'sop_policy_gestational_age_assessment',
    'sop_policy_essential_newborn_care',
    'sop_policy_pre_maturity',
    'sop_policy_low_birth_weight',
    'sop_policy_neonatal_convulsions',
    'sop_policy_neonatal_asphyxia',
    'sop_policy_neonatal_infection_sepsis',
    'sop_policy_congenital_malformations',
    'sop_policy_macrosomic_babies',
    'sop_policy_breastfeeding',
    'sop_policy_handling_of_ebm',
    'sop_policy_assisted_feeding',
    'sop_policy_standard_infection_prevention_control_and_precautions_for_transmission',
    'sop_policy_pre_referral_stabilization_of_infants',
    'sop_policy_verbal_and_written_hand_over_of_newborns_at_shift_changes',
    'sop_policy_triage_and_waiting_times_for_emergency_and_non_emergency_consultations_and_treatment',
    'sop_policy_kmc',
    'sop_policy_none',
    'water_source',
    'water_available_consistently',
    'drainage_system',
    'separate_sink',
    'hand_hygiene',
    'waste_management',
    'waste_segregation',
    'cleaning_register',
    'decontamination_area',
    'decontamination_checklist',
    'utensil_cleaning_area',
    'laundry',
    'linen',
    'sharp_container',
    'sharp3_4full',
    'sharp_full',
    'latrine',
    'latrine_clients',
    'handwashing_station',
    'disinfect_washrooms',
    'clean_washroom',
    'access_disability',
    'menstrual_hygiene',
    'maintenance_infrastructure',
    'well_lit',
    'ventilation',
    'procedure_rooms',
    'changing_area',
    'kitchionette',
    'fire_extinguishers',
    'clear_signage',
    'clear_charter',
    'cots_incubator',
    'kmc_area',
    'room_temp',
    'draught',
    'private_room',
    'counselling_room',
    'worktop',
    'nurse_desk',
    'space_sick_neonates',
    'isolation_room',
    'resuscitation_area',
    'sluice_room',
    'temporary_storage',
    'cctv',
    'dust_evidence',
    'baby_beds',
    'resuscitaires_nbu',
    'bed_space',
    'phototherapy_lamp',
    'radiant_warmer',
    'heat_source',
    'wall_clock',
    'wall_thermometer',
    'exam_light_available',
    'equipment_cpap',
    'monitors',
    'neonatal_bp',
    'oximeters_neonates',
    'transfusion_kit',
    'drip_stands',
    'stethoscopes_nbu',
    'glucometer_nbu',
    'sunction_pump',
    'sunction_bulbs',
    'thermometer_nbu',
    'thermometer_readings',
    'weighing_scale',
    'equip_resus_equip_200ml_ambubag',
    'equip_resus_equip_300ml_ambubag',
    'equip_resus_equip_size_0_ambubag_masks',
    'equip_resus_equip_size_1_ambubag_masks',
    'equip_resus_equip_size_2_ambubag_masks',
    'equip_resus_equip_none',
    'equip_oxy_source_full_oxygen_cylinders_or_central_supply',
    'equip_oxy_source_oxygen_concentrator',
    'equip_oxy_source_oxygen_masks_different_sizes',
    'equip_oxy_source_nasal_prongs_different_sizes',
    'equip_oxy_source_nasal_prongs_for_continuous_positive_airway_pressure_cpap',
    'equip_oxy_source_none',
    'equip_cannulae_size_24',
    'equip_cannulae_size_26',
    'equip_cannulae_none',
    'tetraycline',
    'chlorhexidine',
    'iv_fluid',
    'vitk',
    'latex',
    'sterile',
    'soluset',
    'infant_formula',
    'feeding_cups',
    'syringe_sizes',
    'needles_sizes',
    'microdrippers',
    'iv_sets',
    'commodities_catheters_size_4',
    'commodities_catheters_size_6',
    'commodities_catheters_size_8',
    'commodities_catheters_none',
    'commodities_materials_kmc',
    'commodities_materials_breastfeeding',
    'commodities_materials_latching',
    'commodities_materials_neonatal_danger_signs',
    'commodities_materials_cord_care',
    'commodities_materials_none',
    'commodities_suction_size_4',
    'commodities_suction_size_6',
    'commodities_suction_size_8',
    'commodities_suction_none',
    'commodities_tubes_size_4',
    'commodities_tubes_size_6',
    'commodities_tubes_size_8',
    'commodities_tubes_none',
    'kmc_initiated',
    'preterm_lowbirth',
    'feeding_freq',
    'breastmilk',
    'express_milk',
    'monitoring_plan',
    'neonate_review',
    'discharge',
    'discharge_note',
    'infact_referral',
    'system_near_nbu',
    'caregiver',
    'weight_gain',
    'birth_weight',
    'condition_stable',
    'gestation_34wks',
    'paediatric_rco',
    'specialized_care',
    'nbu_open',
  ];
}
