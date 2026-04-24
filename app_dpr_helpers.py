import json


def get_dpr_field_configs():
    def _rev_label(index):
        suffix = {1: "1st", 2: "2nd", 3: "3rd"}.get(index, f"{index}th")
        return f"{suffix} revision"

    up_districts = [
        "Agra",
        "Aligarh",
        "Ambedkar Nagar",
        "Amethi",
        "Amroha",
        "Auraiya",
        "Ayodhya",
        "Azamgarh",
        "Baghpat",
        "Bahraich",
        "Ballia",
        "Balrampur",
        "Banda",
        "Barabanki",
        "Bareilly",
        "Basti",
        "Bhadohi",
        "Bijnor",
        "Budaun",
        "Bulandshahr",
        "Chandauli",
        "Chitrakoot",
        "Deoria",
        "Etah",
        "Etawah",
        "Farrukhabad",
        "Fatehpur",
        "Firozabad",
        "Gautam Buddha Nagar",
        "Ghaziabad",
        "Ghazipur",
        "Gonda",
        "Gorakhpur",
        "Hamirpur",
        "Hapur",
        "Hardoi",
        "Hathras",
        "Jalaun",
        "Jaunpur",
        "Jhansi",
        "Kannauj",
        "Kanpur Dehat",
        "Kanpur Nagar",
        "Kasganj",
        "Kaushambi",
        "Kushinagar",
        "Lakhimpur Kheri",
        "Lalitpur",
        "Lucknow",
        "Maharajganj",
        "Mahoba",
        "Mainpuri",
        "Mathura",
        "Mau",
        "Meerut",
        "Mirzapur",
        "Moradabad",
        "Muzaffarnagar",
        "Pilibhit",
        "Pratapgarh",
        "Prayagraj",
        "Rae Bareli",
        "Rampur",
        "Saharanpur",
        "Sambhal",
        "Sant Kabir Nagar",
        "Shahjahanpur",
        "Shamli",
        "Shravasti",
        "Siddharthnagar",
        "Sitapur",
        "Sonbhadra",
        "Sultanpur",
        "Unnao",
        "Varanasi",
    ]
    configs = [
        {"label": "Category of Project", "type": "select", "options": ["-- Select --", "Irrigation", "Multipurpose"]},
        {"label": "Type of Project", "type": "select", "options": ["-- Select --", "Storage", "Diversion"]},
        {"label": "Location of Head Works", "type": "text"},
        {"label": "Date of Investement clearance by GOI", "type": "date"},
        {"label": "Date of CWC clearence", "type": "date"},
        {"label": "Date of approval of EFC", "type": "date"},
        {"label": "Districts covered", "type": "multiselect", "options": up_districts},
        {"label": "Gross Command area", "type": "text"},
        {"label": "CCA", "type": "text"},
        {"label": "Irrigation Potential in RABI", "type": "text"},
        {"label": "Irrigation Potential in KHARIF", "type": "text"},
        {"label": "Requirement of Water for project", "type": "text"},
        {"label": "Availability of Water against the requirement", "type": "text"},
        {"label": "Pre-Project Crop Pattern in RABI", "type": "text"},
        {"label": "Pre-Project Crop Pattern in KHARIF", "type": "text"},
        {"label": "Post-Project Crop Pattern in RABI", "type": "text"},
        {"label": "Post-Project Crop Pattern in KHARIF", "type": "text"},
    ]

    for i in range(1, 7):
        rev = _rev_label(i)
        configs.extend(
            [
                {"label": f"Date of approval revised DPR ({rev})", "type": "date"},
                {"label": f"Amount of revised DPR ({rev})", "type": "text"},
                {"label": f"Target date to complete the project ({rev})", "type": "date"},
            ]
        )
    return configs


def get_existing_dpr_fields(existing_dpr):
    existing_dpr = existing_dpr or {}
    payload_raw = existing_dpr.get("dpr_form_data")
    payload = {}
    if isinstance(payload_raw, dict):
        payload = payload_raw
    elif isinstance(payload_raw, str) and payload_raw.strip():
        try:
            parsed_payload = json.loads(payload_raw)
            if isinstance(parsed_payload, dict):
                payload = parsed_payload
        except (TypeError, ValueError):
            payload = {}

    aliases = {
        "Category of Project": ["Category of Project", "category_of_project"],
        "Type of Project": ["Type of Project", "type_of_project"],
        "Location of Head Works": ["Location of Head Works", "location_of_head_works"],
        "Date of Investement clearance by GOI": [
            "Date of Investement clearance by GOI",
            "date_of_investement_clearance_by_goi",
        ],
        "Date of CWC clearence": ["Date of CWC clearence", "date_of_cwc_clearence"],
        "Date of approval of EFC": ["Date of approval of EFC", "date_of_approval_of_efc"],
        "Districts covered": ["Districts covered", "districts_covered"],
        "Gross Command area": ["Gross Command area", "gross_command_area"],
        "CCA": ["CCA", "cca"],
        "Irrigation Potential in RABI": ["Irrigation Potential in RABI", "irrigation_potential_in_rabi"],
        "Irrigation Potential in KHARIF": ["Irrigation Potential in KHARIF", "irrigation_potential_in_kharif"],
        "Requirement of Water for project": ["Requirement of Water for project", "requirement_of_water_for_project"],
        "Availability of Water against the requirement": [
            "Availability of Water against the requirement",
            "availability_of_water_against_the_requirement",
        ],
        "Pre-Project Crop Pattern in RABI": ["Pre-Project Crop Pattern in RABI", "pre_project_crop_pattern_in_rabi"],
        "Pre-Project Crop Pattern in KHARIF": ["Pre-Project Crop Pattern in KHARIF", "pre_project_crop_pattern_in_kharif"],
        "Post-Project Crop Pattern in RABI": ["Post-Project Crop Pattern in RABI", "post_project_crop_pattern_in_rabi"],
        "Post-Project Crop Pattern in KHARIF": ["Post-Project Crop Pattern in KHARIF", "post_project_crop_pattern_in_kharif"],
    }
    for i in range(1, 7):
        rev = "1st" if i == 1 else "2nd" if i == 2 else "3rd" if i == 3 else str(i) + "th"
        aliases[f"Date of approval revised DPR ({rev} revision)"] = [
            f"Date of approval revised DPR ({rev} revision)",
            f"date_of_approval_revised_dpr_revision_{i}",
        ]
        aliases[f"Amount of revised DPR ({rev} revision)"] = [
            f"Amount of revised DPR ({rev} revision)",
            f"amount_of_revised_dpr_revision_{i}",
        ]
        aliases[f"Target date to complete the project ({rev} revision)"] = [
            f"Target date to complete the project ({rev} revision)",
            f"target_date_to_complete_project_revision_{i}",
        ]

    resolved = {}
    for cfg in get_dpr_field_configs():
        label = cfg.get("label")
        if not label:
            continue

        value = payload.get(label)
        if value in (None, ""):
            for key_name in aliases.get(label, []):
                candidate = payload.get(key_name)
                if candidate not in (None, ""):
                    value = candidate
                    break

        if value in (None, ""):
            candidate = existing_dpr.get(label)
            if candidate not in (None, ""):
                value = candidate

        if value in (None, ""):
            for key_name in aliases.get(label, []):
                candidate = existing_dpr.get(key_name)
                if candidate not in (None, ""):
                    value = candidate
                    break

        if value not in (None, ""):
            resolved[label] = value

    return resolved
