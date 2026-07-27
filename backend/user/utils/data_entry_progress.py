from django.db.models import Q
from company.models import CompanyFieldSetting  # Adjust 'company' to your actual app name if different
from user.models import CustomUser          # Adjust 'accounts' to your actual app name containing CustomUser


FIELD_LABELS = {
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email Address",
    "mobile": "Mobile Number",
    "gender": "Gender",
    "prof_img": "Profile Image",
    "dob": "Date of Birth",
    "marital_status": "Marital Status",
    "blood_group": "Blood Group",
    "alternate_email": "Alternate Email",
    "alternate_mobile": "Alternate Mobile Number",
    "religion": "Religion",
    "caste": "Caste",
    "staff_id": "Staff ID",
    "staff_type": "Staff Type",
    "staff_category": "Staff Category",
    "date_of_joining": "Date of Joining",
    "date_of_relieving": "Date of Relieving",
    "contract_completion_date": "Contract Completion Date",
    "date_of_contract_completion": "Contract Completion Date",
    "ktu_id": "KTU ID",
    "aicte_id": "AICTE ID",
    "present_address_line": "Present Address",
    "present_address": "Present Address",
    "permanent_address_line": "Permanent Address",
    "permanent_address": "Permanent Address",
    "qualification": "Educational Qualification",
    "qualifications": "Educational Qualification",
    "experience": "Work Experience",
    "experiences": "Work Experience",
    "identity_details": "Identity Details (PAN/Aadhar)",
    "pan_no": "PAN Number",
    "aadhar_no": "Aadhar Number",
    "bank_details": "Bank Details",
    "account_number": "Bank Account Number",
    "ifsc_code": "Bank IFSC Code",
    "bank_name": "Bank Name",
    "guardians": "Family / Guardian Details",
    "biometric_id": "Biometric ID",
}


def is_field_value_filled(user, profile, section_name, field_name):
    """
    Evaluates whether a given field in a section is filled for the user.
    Handles fields on CustomUser, EmployeeProfile, and related models
    (EmployeeAddress, EmployeeQualification, EmployeeExperience, BankDetail, EmployeeGuardian).
    """
    # 1. Special relationship / multi-table checks
    if field_name == "marital_status":
        # Evaluated via EmployeeGuardian records linked to CustomUser where relationship_type is 'spouse'
        if hasattr(user, 'guardians'):
            return any(g.relationship_type == 'spouse' for g in user.guardians.all())
        return False

    if field_name in ["present_address_line", "present_address"]:
        addr = getattr(profile, 'present_address', None) if profile else None
        return bool(addr and (addr.address_line_1 or addr.city))

    if field_name in ["permanent_address_line", "permanent_address"]:
        addr = getattr(profile, 'permanent_address', None) if profile else None
        return bool(addr and (addr.address_line_1 or addr.city))

    if field_name in ["qualification", "qualifications"]:
        return user.qualifications.exists() if hasattr(user, 'qualifications') else False

    if field_name in ["experience", "experiences"]:
        return user.experiences.exists() if hasattr(user, 'experiences') else False

    if field_name in ["guardians", "guardian", "family"]:
        return user.guardians.exists() if hasattr(user, 'guardians') else False

    if field_name in ["bank_details", "bank_account", "bank"]:
        return user.bank_details.exists() if hasattr(user, 'bank_details') else False

    if field_name in ["account_number", "ifsc_code", "bank_name", "acc_holder_name"]:
        bank = user.bank_details.first() if hasattr(user, 'bank_details') else None
        return bool(bank and getattr(bank, field_name, None))

    if field_name == "identity_details":
        return bool(profile and (profile.pan_no or profile.aadhar_no))

    if field_name in ["pan_no", "pan"]:
        return bool(profile and profile.pan_no)

    if field_name in ["aadhar_no", "aadhar"]:
        return bool(profile and profile.aadhar_no)

    if field_name in ["contract_completion_date", "date_of_contract_completion"]:
        return bool(profile and profile.date_of_contract_completion)

    # 2. Check CustomUser model
    if hasattr(user, field_name):
        val = getattr(user, field_name)
        if field_name == 'gender':
            return val is not None and val not in ['', 'N']
        if isinstance(val, bool):
            return True
        return val is not None and str(val).strip() != ""

    # 3. Check EmployeeProfile model
    if profile and hasattr(profile, field_name):
        val = getattr(profile, field_name)
        if isinstance(val, bool):
            return True
        return val is not None and str(val).strip() != ""

    return False


def parse_field_config(config_dict):
    """
    Parses both simple field configs and nested configs with custom labels.
    If no config is set for a company, falls back to checking ALL standard fields.
    """
    parsed_sections = {}

    if not config_dict:
        config_dict = {
            "personal_information": {
                "first_name": {"visible": True, "mandatory": True},
                "last_name": {"visible": True, "mandatory": True},
                "email": {"visible": True, "mandatory": True},
                "mobile": {"visible": True, "mandatory": True},
                "gender": {"visible": True, "mandatory": True},
                "prof_img": {"visible": True, "mandatory": True},
                "dob": {"visible": True, "mandatory": True},
                "marital_status": {"visible": True, "mandatory": True},
                "blood_group": {"visible": True, "mandatory": True},
                "alternate_email": {"visible": True, "mandatory": True},
                "alternate_mobile": {"visible": True, "mandatory": True},
                "religion": {"visible": True, "mandatory": True},
                "caste": {"visible": True, "mandatory": True},
            },
            "employment": {
                "staff_id": {"visible": True, "mandatory": True},
                "staff_type": {"visible": True, "mandatory": True},
                "staff_category": {"visible": True, "mandatory": True},
                "date_of_joining": {"visible": True, "mandatory": True},
                "contract_completion_date": {"visible": True, "mandatory": True},
                "ktu_id": {"visible": True, "mandatory": True},
                "aicte_id": {"visible": True, "mandatory": True},
            },
            "address_settings": {
                "present_address_line": {"visible": True, "mandatory": True},
                "permanent_address_line": {"visible": True, "mandatory": True},
            },
            "qualifications": {
                "qualification": {"visible": True, "mandatory": True},
            },
            "experience": {
                "experience": {"visible": True, "mandatory": True},
            },
            "identity_bank": {
                "identity_details": {"visible": True, "mandatory": True},
                "bank_details": {"visible": True, "mandatory": True},
            },
            "family": {
                "guardians": {"visible": True, "mandatory": True},
            }
        }

    for section_key, section_val in config_dict.items():
        if not isinstance(section_val, dict):
            continue

        section_label = section_val.get("label", section_key.replace("_", " ").title())
        fields_source = section_val.get("fields") if "fields" in section_val and isinstance(section_val.get("fields"), dict) else section_val

        fields = {}
        for field_key, rule in fields_source.items():
            if field_key == "label" or not isinstance(rule, dict):
                continue

            visible = rule.get("visible", True)
            mandatory = rule.get("mandatory", False)
            field_label = rule.get("label") or FIELD_LABELS.get(field_key, field_key.replace("_", " ").title())

            if visible:
                fields[field_key] = {
                    "visible": visible,
                    "mandatory": mandatory,
                    "label": field_label
                }

        if fields:
            parsed_sections[section_key] = {
                "label": section_label,
                "fields": fields
            }

    return parsed_sections


def evaluate_user_completion(user, config_dict):
    """
    Evaluates a single user's completion status by checking fields 
    scattered across CustomUser, EmployeeProfile, and related records.
    """
    profile = getattr(user, 'profile', None)
    sections = parse_field_config(config_dict)

    total_mandatory = 0
    filled_mandatory = 0
    total_visible = 0
    filled_visible = 0

    non_filled_fields = []
    filled_fields = []

    for section_key, section_info in sections.items():
        section_label = section_info["label"]
        for field_key, field_rule in section_info["fields"].items():
            is_mandatory = field_rule["mandatory"]
            field_label = field_rule["label"]

            total_visible += 1
            if is_mandatory:
                total_mandatory += 1

            filled = is_field_value_filled(user, profile, section_key, field_key)

            field_data = {
                "section": section_key,
                "section_label": section_label,
                "field": field_key,
                "field_label": field_label,
                "is_mandatory": is_mandatory
            }

            if filled:
                filled_visible += 1
                if is_mandatory:
                    filled_mandatory += 1
                filled_fields.append(field_data)
            else:
                non_filled_fields.append(field_data)

    mandatory_percentage = round((filled_mandatory / total_mandatory) * 100, 2) if total_mandatory > 0 else 100.0
    overall_percentage = round((filled_visible / total_visible) * 100, 2) if total_visible > 0 else 100.0

    return {
        "user_id": user.id,
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}".strip(),
        "completion_percentage": mandatory_percentage,
        "overall_completion_percentage": overall_percentage,
        "total_mandatory_fields": total_mandatory,
        "filled_mandatory_fields": filled_mandatory,
        "total_visible_fields": total_visible,
        "filled_visible_fields": filled_visible,
        "non_filled_fields": non_filled_fields,
        "filled_fields": filled_fields
    }
