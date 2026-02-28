"""
Dental clinic fixture data for auto-populating new clinics.
"""

DENTAL_SYMPTOMS = [
    {"name": "Tooth Pain", "description": "Pain in one or more teeth", "display_order": 1},
    {"name": "Gum Bleeding", "description": "Bleeding from gums", "display_order": 2},
    {"name": "Swelling in Mouth", "description": "Swelling in oral cavity", "display_order": 3},
    {"name": "Sensitivity to Hot/Cold", "description": "Pain when consuming hot or cold food/drinks", "display_order": 4},
    {"name": "Bad Breath", "description": "Persistent halitosis", "display_order": 5},
    {"name": "Difficulty Chewing", "description": "Pain or trouble while chewing", "display_order": 6},
    {"name": "Jaw Pain", "description": "Pain in jaw or TMJ area", "display_order": 7},
    {"name": "Loose Tooth", "description": "One or more teeth feel mobile", "display_order": 8},
    {"name": "Dry Mouth", "description": "Reduced saliva production", "display_order": 9},
    {"name": "Mouth Sores", "description": "Ulcers or sores in the mouth", "display_order": 10},
]

DENTAL_CHIEF_COMPLAINTS = [
    {"name": "Toothache", "description": "Pain in or around a tooth", "display_order": 1},
    {"name": "Tooth Decay / Cavity", "description": "Cavities or holes in teeth", "display_order": 2},
    {"name": "Tooth Sensitivity", "description": "Sensitivity to hot, cold, or sweet", "display_order": 3},
    {"name": "Gum Pain / Swelling", "description": "Pain or swelling in the gums", "display_order": 4},
    {"name": "Bleeding Gums", "description": "Gums that bleed during brushing", "display_order": 5},
    {"name": "Bad Breath (Halitosis)", "description": "Persistent bad breath", "display_order": 6},
    {"name": "Broken / Chipped Tooth", "description": "Damaged or fractured tooth", "display_order": 7},
    {"name": "Loose Tooth", "description": "Tooth that feels loose or wobbly", "display_order": 8},
    {"name": "Jaw Pain / TMJ", "description": "Pain in the jaw or temporomandibular joint", "display_order": 9},
    {"name": "Tooth Extraction", "description": "Need for tooth removal", "display_order": 10},
    {"name": "Root Canal Treatment", "description": "Root canal procedure needed", "display_order": 11},
    {"name": "Dental Filling", "description": "Filling replacement or new filling", "display_order": 12},
    {"name": "Teeth Cleaning / Scaling", "description": "Professional cleaning and scaling", "display_order": 13},
    {"name": "Dental Crown / Cap", "description": "Crown or cap placement", "display_order": 14},
    {"name": "Dentures / Partial Dentures", "description": "Denture fitting or adjustment", "display_order": 15},
    {"name": "Dental Implant", "description": "Implant consultation or follow-up", "display_order": 16},
    {"name": "Teeth Whitening", "description": "Cosmetic teeth whitening", "display_order": 17},
    {"name": "Braces / Orthodontic Consultation", "description": "Orthodontic treatment consultation", "display_order": 18},
    {"name": "Wisdom Tooth Issue", "description": "Pain or problems with wisdom teeth", "display_order": 19},
    {"name": "Mouth Ulcer / Sore", "description": "Ulcers or sores in the mouth", "display_order": 20},
    {"name": "Routine Checkup", "description": "Regular dental examination", "display_order": 21},
    {"name": "Follow-up Visit", "description": "Follow-up after previous treatment", "display_order": 22},
]

DENTAL_DIAGNOSES = [
    {"name": "Dental Caries", "description": "Tooth decay/cavities", "display_order": 1},
    {"name": "Gingivitis", "description": "Inflammation of gums", "display_order": 2},
    {"name": "Periodontitis", "description": "Gum disease with bone loss", "display_order": 3},
    {"name": "Pulpitis", "description": "Inflammation of tooth pulp", "display_order": 4},
    {"name": "Periapical Abscess", "description": "Infection at root tip", "display_order": 5},
    {"name": "Tooth Fracture", "description": "Broken or chipped tooth", "display_order": 6},
    {"name": "Impacted Tooth", "description": "Tooth unable to erupt properly", "display_order": 7},
    {"name": "TMJ Disorder", "description": "Temporomandibular joint dysfunction", "display_order": 8},
    {"name": "Oral Candidiasis", "description": "Fungal infection in mouth", "display_order": 9},
    {"name": "Aphthous Ulcer", "description": "Canker sores", "display_order": 10},
    {"name": "Dental Hypersensitivity", "description": "Sensitive teeth", "display_order": 11},
    {"name": "Bruxism", "description": "Teeth grinding", "display_order": 12},
    {"name": "Malocclusion", "description": "Misaligned bite", "display_order": 13},
    {"name": "Root Canal Infection", "description": "Infected root canal", "display_order": 14},
    {"name": "Alveolar Osteitis", "description": "Dry socket after extraction", "display_order": 15},
]

DENTAL_OBSERVATIONS = [
    {"name": "Oral hygiene is satisfactory", "description": "Good brushing and flossing habits evident", "display_order": 1},
    {"name": "Oral hygiene needs improvement", "description": "Plaque/tartar buildup present", "display_order": 2},
    {"name": "Gums appear healthy", "description": "Pink, firm, no bleeding", "display_order": 3},
    {"name": "Gums are inflamed", "description": "Red, swollen gums", "display_order": 4},
    {"name": "Bleeding on probing", "description": "Gums bleed when examined", "display_order": 5},
    {"name": "Visible decay present", "description": "Cavities visible on examination", "display_order": 6},
    {"name": "Tooth is mobile", "description": "Loose tooth detected", "display_order": 7},
    {"name": "Abscess/swelling noted", "description": "Visible swelling or abscess", "display_order": 8},
    {"name": "Calculus buildup present", "description": "Tartar deposits on teeth", "display_order": 9},
    {"name": "Tooth wear evident", "description": "Signs of grinding/erosion", "display_order": 10},
    {"name": "Restoration intact", "description": "Existing filling in good condition", "display_order": 11},
    {"name": "Restoration needs replacement", "description": "Filling is worn or damaged", "display_order": 12},
    {"name": "Crown/bridge intact", "description": "Prosthetic work in good condition", "display_order": 13},
    {"name": "Root exposure noted", "description": "Gum recession exposing root", "display_order": 14},
    {"name": "Soft tissue normal", "description": "No abnormalities in cheeks, tongue, palate", "display_order": 15},
]

DENTAL_TEST_OPTIONS = [
    {"name": "Intraoral Periapical X-ray (IOPA)", "description": "X-ray of specific tooth and surrounding bone", "display_order": 1},
    {"name": "Orthopantomogram (OPG)", "description": "Panoramic X-ray of entire mouth", "display_order": 2},
    {"name": "Bitewing X-ray", "description": "X-ray showing upper and lower back teeth", "display_order": 3},
    {"name": "CBCT Scan", "description": "3D cone beam computed tomography", "display_order": 4},
    {"name": "Pulp Vitality Test", "description": "Test to check if tooth pulp is alive", "display_order": 5},
    {"name": "Periodontal Probing", "description": "Measure pocket depths around teeth", "display_order": 6},
    {"name": "Salivary Flow Test", "description": "Measure saliva production rate", "display_order": 7},
    {"name": "Oral Cancer Screening", "description": "Visual and tactile examination for oral cancer", "display_order": 8},
    {"name": "Bacterial Culture", "description": "Culture for periodontal or infection diagnosis", "display_order": 9},
    {"name": "Occlusal Analysis", "description": "Analysis of bite and jaw alignment", "display_order": 10},
    {"name": "TMJ Imaging", "description": "X-ray or MRI of temporomandibular joint", "display_order": 11},
    {"name": "Biopsy", "description": "Tissue sample for pathological examination", "display_order": 12},
    {"name": "Blood Sugar Test (Random)", "description": "Blood glucose level for diabetic patients", "display_order": 13},
    {"name": "Complete Blood Count (CBC)", "description": "Blood test before surgical procedures", "display_order": 14},
    {"name": "Bleeding Time / Clotting Time", "description": "Coagulation test before extractions", "display_order": 15},
]

DENTAL_MEDICINES = [
    {"name": "Tab Amoxicillin 500mg", "description": "Antibiotic for dental infections", "display_order": 1},
    {"name": "Tab Metronidazole 400mg", "description": "Antibiotic for anaerobic infections", "display_order": 2},
    {"name": "Tab Ibuprofen 400mg", "description": "Anti-inflammatory pain reliever", "display_order": 3},
    {"name": "Tab Paracetamol 500mg", "description": "Pain and fever reliever", "display_order": 4},
    {"name": "Tab Diclofenac 50mg", "description": "Anti-inflammatory pain reliever", "display_order": 5},
    {"name": "Cap Ampicillin 500mg", "description": "Broad spectrum antibiotic", "display_order": 6},
    {"name": "Tab Aceclofenac 100mg", "description": "Pain reliever for dental pain", "display_order": 7},
    {"name": "Tab Ornidazole 500mg", "description": "Antibiotic for dental infections", "display_order": 8},
    {"name": "Tab Clindamycin 300mg", "description": "Antibiotic for severe infections", "display_order": 9},
    {"name": "Tab Ketorolac 10mg", "description": "Strong pain reliever", "display_order": 10},
    {"name": "Gel Metrogyl DG", "description": "Gum application gel", "display_order": 11},
    {"name": "Mouthwash Chlorhexidine", "description": "Antiseptic mouthwash", "display_order": 12},
    {"name": "Tab Vitamin C 500mg", "description": "For gum health", "display_order": 13},
    {"name": "Tab Calcium + Vitamin D3", "description": "For bone health", "display_order": 14},
    {"name": "Gel Lignocaine 2%", "description": "Topical anesthetic gel", "display_order": 15},
]

# Backward compatibility - dosages and durations are now in common_fixtures
from app.fixtures.common_fixtures import COMMON_DOSAGES as DENTAL_DOSAGES  # noqa: F401
from app.fixtures.common_fixtures import COMMON_DURATIONS as DENTAL_DURATIONS  # noqa: F401
