"""
Common fixture data shared across all clinic specialties.
Dosages and durations are the same regardless of specialty.
"""

COMMON_DOSAGES = [
    {"name": "1 tablet", "description": "Single tablet dose", "display_order": 1},
    {"name": "2 tablets", "description": "Double tablet dose", "display_order": 2},
    {"name": "Half tablet", "description": "Half tablet dose", "display_order": 3},
    {"name": "1 capsule", "description": "Single capsule dose", "display_order": 4},
    {"name": "2 capsules", "description": "Double capsule dose", "display_order": 5},
    {"name": "5ml", "description": "5 milliliters", "display_order": 6},
    {"name": "10ml", "description": "10 milliliters", "display_order": 7},
    {"name": "15ml", "description": "15 milliliters", "display_order": 8},
    {"name": "Apply locally", "description": "For topical application", "display_order": 9},
    {"name": "Rinse with 10ml", "description": "For mouthwash/gargle", "display_order": 10},
    {"name": "1-0-1", "description": "Morning and night", "display_order": 11},
    {"name": "1-1-1", "description": "Three times daily", "display_order": 12},
    {"name": "0-0-1", "description": "Night only", "display_order": 13},
    {"name": "1-0-0", "description": "Morning only", "display_order": 14},
    {"name": "SOS", "description": "As needed/when required", "display_order": 15},
]

COMMON_DURATIONS = [
    {"name": "3 days", "description": "Short course", "display_order": 1},
    {"name": "5 days", "description": "Standard short course", "display_order": 2},
    {"name": "7 days", "description": "One week course", "display_order": 3},
    {"name": "10 days", "description": "Extended course", "display_order": 4},
    {"name": "14 days", "description": "Two week course", "display_order": 5},
    {"name": "1 month", "description": "Monthly course", "display_order": 6},
    {"name": "As directed", "description": "Follow doctor instructions", "display_order": 7},
    {"name": "Until finished", "description": "Complete the course", "display_order": 8},
    {"name": "Single dose", "description": "One-time use", "display_order": 9},
    {"name": "2 weeks", "description": "Two week duration", "display_order": 10},
]
