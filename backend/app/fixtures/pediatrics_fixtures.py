"""
Pediatrics clinic fixture data for auto-populating new clinics.
"""

PEDIATRICS_SYMPTOMS = [
    {"name": "Fever", "description": "Elevated body temperature", "display_order": 1},
    {"name": "Cough", "description": "Persistent or acute cough", "display_order": 2},
    {"name": "Runny Nose", "description": "Nasal discharge or congestion", "display_order": 3},
    {"name": "Vomiting", "description": "Forceful expulsion of stomach contents", "display_order": 4},
    {"name": "Diarrhea", "description": "Loose or watery stools", "display_order": 5},
    {"name": "Rash", "description": "Skin eruption or redness", "display_order": 6},
    {"name": "Poor Feeding", "description": "Reduced appetite or feeding difficulty", "display_order": 7},
    {"name": "Irritability", "description": "Excessive crying or fussiness", "display_order": 8},
    {"name": "Ear Pulling", "description": "Child pulling or tugging at ears", "display_order": 9},
    {"name": "Wheezing", "description": "High-pitched breathing sound", "display_order": 10},
    {"name": "Loose Motions", "description": "Frequent watery stools", "display_order": 11},
    {"name": "Not Gaining Weight", "description": "Poor weight gain or weight loss", "display_order": 12},
]

PEDIATRICS_CHIEF_COMPLAINTS = [
    {"name": "Vaccination Visit", "description": "Routine immunization as per EPI schedule", "display_order": 1},
    {"name": "Growth / Weight Check", "description": "Routine growth monitoring and developmental assessment", "display_order": 2},
    {"name": "Fever / Cold", "description": "Fever with or without cold symptoms", "display_order": 3},
    {"name": "Cough / Breathing Difficulty", "description": "Persistent cough or respiratory distress", "display_order": 4},
    {"name": "Ear Infection / Pain", "description": "Ear pain, discharge, or suspected otitis media", "display_order": 5},
    {"name": "Diarrhea / Vomiting", "description": "Gastrointestinal symptoms with dehydration risk", "display_order": 6},
    {"name": "Skin Rash / Allergy", "description": "Skin eruptions, eczema, or allergic reaction", "display_order": 7},
    {"name": "Diaper Rash", "description": "Rash in diaper area", "display_order": 8},
    {"name": "Colic / Excessive Crying", "description": "Inconsolable crying episodes in infants", "display_order": 9},
    {"name": "Feeding Difficulty", "description": "Poor feeding, breast-feeding issues, or food refusal", "display_order": 10},
    {"name": "Newborn Check-up", "description": "Post-natal examination of newborn", "display_order": 11},
    {"name": "Developmental Assessment", "description": "Milestone evaluation and developmental screening", "display_order": 12},
    {"name": "Worm Infestation", "description": "Suspected intestinal worms", "display_order": 13},
    {"name": "Sore Throat / Tonsillitis", "description": "Throat pain, tonsillar enlargement", "display_order": 14},
    {"name": "Asthma / Wheeze Episode", "description": "Wheezing, breathlessness, or known asthma exacerbation", "display_order": 15},
    {"name": "Routine Follow-up", "description": "Follow-up after previous treatment or illness", "display_order": 16},
]

PEDIATRICS_DIAGNOSES = [
    {"name": "Upper Respiratory Tract Infection", "description": "Common cold / viral URTI", "display_order": 1},
    {"name": "Acute Gastroenteritis", "description": "Diarrhea and vomiting, often viral", "display_order": 2},
    {"name": "Acute Otitis Media", "description": "Middle ear infection", "display_order": 3},
    {"name": "Viral Fever", "description": "Self-limiting viral illness with fever", "display_order": 4},
    {"name": "Bronchiolitis", "description": "Lower respiratory infection in infants", "display_order": 5},
    {"name": "Pneumonia", "description": "Lung infection requiring treatment", "display_order": 6},
    {"name": "Hand Foot Mouth Disease", "description": "Viral illness with oral and skin lesions", "display_order": 7},
    {"name": "Infantile Colic", "description": "Recurrent excessive crying in healthy infant", "display_order": 8},
    {"name": "Iron Deficiency Anemia", "description": "Low hemoglobin due to iron deficiency", "display_order": 9},
    {"name": "Febrile Seizure", "description": "Seizure associated with fever in young children", "display_order": 10},
    {"name": "Atopic Dermatitis / Eczema", "description": "Chronic itchy skin condition", "display_order": 11},
    {"name": "Failure to Thrive", "description": "Poor weight gain relative to age", "display_order": 12},
    {"name": "Worm Infestation", "description": "Intestinal parasitic infection", "display_order": 13},
    {"name": "Acute Tonsillitis", "description": "Infection of the tonsils", "display_order": 14},
    {"name": "Childhood Asthma", "description": "Reactive airway disease in children", "display_order": 15},
]

PEDIATRICS_OBSERVATIONS = [
    {"name": "Growth on track for age", "description": "Weight and height within normal percentile", "display_order": 1},
    {"name": "Growth below expected percentile", "description": "Weight/height falling below normal range", "display_order": 2},
    {"name": "Anterior fontanelle open and flat", "description": "Normal fontanelle in infant", "display_order": 3},
    {"name": "Anterior fontanelle sunken", "description": "Possible dehydration sign", "display_order": 4},
    {"name": "Mild rhinorrhea", "description": "Runny nose with clear discharge", "display_order": 5},
    {"name": "Bilateral TM erythema", "description": "Both ear drums appear red/inflamed", "display_order": 6},
    {"name": "Throat congested", "description": "Red/inflamed throat on examination", "display_order": 7},
    {"name": "Chest clear bilaterally", "description": "No abnormal lung sounds", "display_order": 8},
    {"name": "Wheeze on auscultation", "description": "Wheezing heard in lungs", "display_order": 9},
    {"name": "Mild dehydration", "description": "Dry lips, reduced skin turgor", "display_order": 10},
    {"name": "No signs of dehydration", "description": "Well hydrated, good skin turgor", "display_order": 11},
    {"name": "Milestones age-appropriate", "description": "Developmental milestones on track", "display_order": 12},
    {"name": "Abdomen soft, non-tender", "description": "Normal abdominal examination", "display_order": 13},
    {"name": "Active, playful child", "description": "Child alert and interactive", "display_order": 14},
    {"name": "Pallor present", "description": "Pale appearance suggesting anemia", "display_order": 15},
]

PEDIATRICS_TEST_OPTIONS = [
    {"name": "Complete Blood Count (CBC)", "description": "Full blood count with differential", "display_order": 1},
    {"name": "C-Reactive Protein (CRP)", "description": "Marker for infection/inflammation", "display_order": 2},
    {"name": "Blood Culture", "description": "Culture to identify bacterial infection", "display_order": 3},
    {"name": "Urine Routine & Microscopy", "description": "Urinalysis for UTI screening", "display_order": 4},
    {"name": "Stool Routine & Microscopy", "description": "Stool examination for ova/parasites", "display_order": 5},
    {"name": "Peripheral Blood Smear", "description": "Smear for anemia or infection workup", "display_order": 6},
    {"name": "Serum Iron & Ferritin", "description": "Iron studies for anemia evaluation", "display_order": 7},
    {"name": "Chest X-ray", "description": "Radiograph for respiratory evaluation", "display_order": 8},
    {"name": "Rapid Strep Test", "description": "Quick test for streptococcal pharyngitis", "display_order": 9},
    {"name": "Dengue NS1 / Serology", "description": "Test for dengue fever", "display_order": 10},
    {"name": "Widal Test", "description": "Serological test for typhoid fever", "display_order": 11},
    {"name": "Mantoux Test", "description": "Tuberculin skin test for TB screening", "display_order": 12},
]

PEDIATRICS_MEDICINES = [
    {"name": "Paracetamol Drops (100mg/ml)", "description": "Fever and pain relief for infants", "display_order": 1},
    {"name": "Paracetamol Syrup (120mg/5ml)", "description": "Fever and pain relief for children", "display_order": 2},
    {"name": "Ibuprofen Syrup (100mg/5ml)", "description": "Anti-inflammatory and antipyretic", "display_order": 3},
    {"name": "Amoxicillin Suspension (125mg/5ml)", "description": "Antibiotic for common infections", "display_order": 4},
    {"name": "Amoxicillin Suspension (250mg/5ml)", "description": "Antibiotic for moderate infections", "display_order": 5},
    {"name": "ORS Sachets", "description": "Oral rehydration salts for diarrhea", "display_order": 6},
    {"name": "Zinc Syrup (20mg/5ml)", "description": "Zinc supplement for diarrhea management", "display_order": 7},
    {"name": "Cetirizine Syrup (5mg/5ml)", "description": "Antihistamine for allergy and cold", "display_order": 8},
    {"name": "Salbutamol Syrup (2mg/5ml)", "description": "Bronchodilator for wheeze/asthma", "display_order": 9},
    {"name": "Domperidone Drops (5mg/ml)", "description": "Anti-emetic for vomiting", "display_order": 10},
    {"name": "Iron Drops (Ferrous Sulphate)", "description": "Iron supplement for anemia", "display_order": 11},
    {"name": "Multivitamin Drops", "description": "Vitamin supplement for infants", "display_order": 12},
    {"name": "Albendazole Syrup (200mg/5ml)", "description": "Deworming medication", "display_order": 13},
    {"name": "Azithromycin Suspension (200mg/5ml)", "description": "Antibiotic for respiratory infections", "display_order": 14},
    {"name": "Cefixime Suspension (50mg/5ml)", "description": "Antibiotic for UTI and ENT infections", "display_order": 15},
]
