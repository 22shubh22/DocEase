"""Preset template configurations for print templates."""

PRESETS = {
    "classic": {
        "header": {
            "show_logo": True,
            "show_clinic_name": True,
            "show_address": True,
            "show_phone": True,
            "show_email": False,
            "show_doctor_name": True,
            "show_qualification": True,
            "show_registration": True,
            "show_specialization": True,
            "logo_position": "left",
            "custom_tagline": ""
        },
        "footer": {
            "show_signature_image": True,
            "show_signature_line": True,
            "show_doctor_name": True,
            "show_clinic_contact": True,
            "custom_footer_text": ""
        },
        "watermark": {
            "enabled": False,
            "opacity": 0.05,
            "use_logo": True
        }
    },
    "modern": {
        "header": {
            "show_logo": True,
            "show_clinic_name": True,
            "show_address": True,
            "show_phone": True,
            "show_email": True,
            "show_doctor_name": True,
            "show_qualification": True,
            "show_registration": True,
            "show_specialization": True,
            "logo_position": "left",
            "custom_tagline": ""
        },
        "footer": {
            "show_signature_image": True,
            "show_signature_line": True,
            "show_doctor_name": True,
            "show_clinic_contact": True,
            "custom_footer_text": ""
        },
        "watermark": {
            "enabled": False,
            "opacity": 0.05,
            "use_logo": True
        }
    },
    "minimal": {
        "header": {
            "show_logo": False,
            "show_clinic_name": True,
            "show_address": False,
            "show_phone": True,
            "show_email": False,
            "show_doctor_name": True,
            "show_qualification": False,
            "show_registration": True,
            "show_specialization": False,
            "logo_position": "left",
            "custom_tagline": ""
        },
        "footer": {
            "show_signature_image": False,
            "show_signature_line": True,
            "show_doctor_name": True,
            "show_clinic_contact": False,
            "custom_footer_text": ""
        },
        "watermark": {
            "enabled": True,
            "opacity": 0.03,
            "use_logo": True
        }
    },
    "bold": {
        "header": {
            "show_logo": True,
            "show_clinic_name": True,
            "show_address": True,
            "show_phone": True,
            "show_email": True,
            "show_doctor_name": True,
            "show_qualification": True,
            "show_registration": True,
            "show_specialization": True,
            "logo_position": "center",
            "custom_tagline": ""
        },
        "footer": {
            "show_signature_image": True,
            "show_signature_line": True,
            "show_doctor_name": True,
            "show_clinic_contact": True,
            "custom_footer_text": ""
        },
        "watermark": {
            "enabled": False,
            "opacity": 0.05,
            "use_logo": True
        }
    }
}

DEFAULT_TEMPLATE_CONFIG = PRESETS["classic"]


def get_preset(preset_id: str) -> dict:
    """Get a preset template config by ID. Returns classic if not found."""
    return PRESETS.get(preset_id, PRESETS["classic"]).copy()
