"""
Standard EPI (Expanded Programme on Immunization) vaccination schedule.
Based on Pakistan/India national immunization schedules.
"""

EPI_SCHEDULE = [
    # Birth
    {"vaccine_name": "BCG", "dose_number": 1, "dose_label": "BCG", "age_days": 0, "age_label": "Birth", "vaccine_group": "Primary", "route": "ID", "site": "Left upper arm", "is_mandatory": True, "display_order": 1},
    {"vaccine_name": "OPV", "dose_number": 0, "dose_label": "OPV-0", "age_days": 0, "age_label": "Birth", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 2},
    {"vaccine_name": "Hepatitis B", "dose_number": 0, "dose_label": "HepB-Birth", "age_days": 0, "age_label": "Birth", "vaccine_group": "Primary", "route": "IM", "site": "Right thigh", "is_mandatory": True, "display_order": 3},

    # 6 weeks (42 days)
    {"vaccine_name": "OPV", "dose_number": 1, "dose_label": "OPV-1", "age_days": 42, "age_label": "6 weeks", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 4},
    {"vaccine_name": "Pentavalent", "dose_number": 1, "dose_label": "Penta-1", "age_days": 42, "age_label": "6 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Right thigh", "is_mandatory": True, "display_order": 5},
    {"vaccine_name": "PCV", "dose_number": 1, "dose_label": "PCV-1", "age_days": 42, "age_label": "6 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Left thigh", "is_mandatory": True, "display_order": 6},
    {"vaccine_name": "Rotavirus", "dose_number": 1, "dose_label": "Rota-1", "age_days": 42, "age_label": "6 weeks", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 7},

    # 10 weeks (70 days)
    {"vaccine_name": "OPV", "dose_number": 2, "dose_label": "OPV-2", "age_days": 70, "age_label": "10 weeks", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 8},
    {"vaccine_name": "Pentavalent", "dose_number": 2, "dose_label": "Penta-2", "age_days": 70, "age_label": "10 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Right thigh", "is_mandatory": True, "display_order": 9},
    {"vaccine_name": "PCV", "dose_number": 2, "dose_label": "PCV-2", "age_days": 70, "age_label": "10 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Left thigh", "is_mandatory": True, "display_order": 10},
    {"vaccine_name": "Rotavirus", "dose_number": 2, "dose_label": "Rota-2", "age_days": 70, "age_label": "10 weeks", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 11},

    # 14 weeks (98 days)
    {"vaccine_name": "OPV", "dose_number": 3, "dose_label": "OPV-3", "age_days": 98, "age_label": "14 weeks", "vaccine_group": "Primary", "route": "Oral", "site": "Oral", "is_mandatory": True, "display_order": 12},
    {"vaccine_name": "Pentavalent", "dose_number": 3, "dose_label": "Penta-3", "age_days": 98, "age_label": "14 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Right thigh", "is_mandatory": True, "display_order": 13},
    {"vaccine_name": "PCV", "dose_number": 3, "dose_label": "PCV-3", "age_days": 98, "age_label": "14 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Left thigh", "is_mandatory": True, "display_order": 14},
    {"vaccine_name": "IPV", "dose_number": 1, "dose_label": "IPV-1", "age_days": 98, "age_label": "14 weeks", "vaccine_group": "Primary", "route": "IM", "site": "Left thigh", "is_mandatory": True, "display_order": 15},

    # 9 months (270 days)
    {"vaccine_name": "Measles-Rubella", "dose_number": 1, "dose_label": "MR-1", "age_days": 270, "age_label": "9 months", "vaccine_group": "Primary", "route": "SC", "site": "Right upper arm", "is_mandatory": True, "display_order": 16},
    {"vaccine_name": "IPV", "dose_number": 2, "dose_label": "IPV-2", "age_days": 270, "age_label": "9 months", "vaccine_group": "Primary", "route": "IM", "site": "Left thigh", "is_mandatory": True, "display_order": 17},

    # 15 months (450 days)
    {"vaccine_name": "Measles-Rubella", "dose_number": 2, "dose_label": "MR-2", "age_days": 450, "age_label": "15 months", "vaccine_group": "Booster", "route": "SC", "site": "Right upper arm", "is_mandatory": True, "display_order": 18},

    # Optional / IAP (India) additions
    {"vaccine_name": "Hepatitis A", "dose_number": 1, "dose_label": "HepA-1", "age_days": 365, "age_label": "12 months", "vaccine_group": "Optional", "route": "IM", "site": "Left thigh", "is_mandatory": False, "display_order": 19},
    {"vaccine_name": "Hepatitis A", "dose_number": 2, "dose_label": "HepA-2", "age_days": 545, "age_label": "18 months", "vaccine_group": "Optional", "route": "IM", "site": "Left thigh", "is_mandatory": False, "display_order": 20},
    {"vaccine_name": "Varicella", "dose_number": 1, "dose_label": "Varicella-1", "age_days": 450, "age_label": "15 months", "vaccine_group": "Optional", "route": "SC", "site": "Right upper arm", "is_mandatory": False, "display_order": 21},
    {"vaccine_name": "Typhoid Conjugate", "dose_number": 1, "dose_label": "TCV", "age_days": 270, "age_label": "9 months", "vaccine_group": "Optional", "route": "IM", "site": "Left thigh", "is_mandatory": False, "display_order": 22},
]
