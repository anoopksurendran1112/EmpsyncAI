from django.contrib.auth.hashers import make_password
import pandas as pd
from django.core.management.base import BaseCommand
from django.db import transaction
from company.models import Company, CompanyRole, CompanyGroup, CompanyShift
from user.models import CustomUser  # Adjust to your app name


class Command(BaseCommand):
    help = "Import users from Excel for company_id = 10"

    def add_arguments(self, parser):
        parser.add_argument("excel_path", type=str, help="Path to the Excel file")

    @transaction.atomic
    def handle(self, *args, **options):
        excel_path = options["excel_path"]
        company_id = 10

        gender_map = {
            "male": "M", "m": "M",
            "female": "F", "f": "F",
            "other": "O", "o": "O",
            "prefer not to say": "N", "n": "N"
        }

        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Company with id {company_id} does not exist."))
            return

        # # Get the General Shift 1 object
        # try:
        #     general_shift = CompanyShift.objects.get(shift="General Shift 1", company=company)
        # except CompanyShift.DoesNotExist:
        #     self.stderr.write(self.style.ERROR('"General Shift 1" not found for this company.'))
        #     return

        df = pd.read_excel(excel_path)
        created_count = 0
        updated_count = 0

        for idx, row in df.iterrows():
            raw_gender = str(row.get("gender", "")).strip().lower()
            gender = gender_map.get(raw_gender, "N")
            biometric_id = str(row.get("biometric_id", "")).strip()
            mobile = str(row.get("mobile", "")).strip()
            role_name = str(row.get("role", "")).strip()
            # group_name = str(row.get("group", "")).strip()
            first_name = str(row.get("first_name", "")).strip()
            last_name = str(row.get("last_name", "")).strip()
            email = str(row.get("email", "")).strip()

            if not email or not mobile:
                self.stdout.write(self.style.WARNING(f"Skipping row with missing email or mobile: {row}"))
                continue

            

            if not role_name:
                print(f"⚠️ Row {idx}: Missing role, defaulting to 'Unnamed Role'")
                role_name = "Unnamed Role"

            # Fetch or create role specifically for this company
            role_obj = CompanyRole.objects.filter(role=role_name, company=company).first()

            if not role_obj:
                role_obj = CompanyRole.objects.create(role=role_name)
                role_obj.company.add(company)


            # role_obj, _ = CompanyRole.objects.get_or_create(role=role_name, company=company)
            # group_obj, _ = CompanyGroup.objects.get_or_create(group=group_name, company=company)

            user, created = CustomUser.objects.update_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "mobile": mobile,
                    "gender": gender,
                    "biometric_id": biometric_id,
                    "role": role_obj,
                    # "group": group_obj,
                    "parent_company": company,
                    # "shift": general_shift,
                    "password": make_password("empsyncai123@"),
                }
            )

            # ✅ Set default password if user is newly created
            if created:
                user.set_password("empsyncai123@")  # Change to secure default
                user.save()
               
                created_count += 1
            else:
                updated_count += 1

            # Ensure company relation is set
            company_to_remove = Company.objects.get(id=8)
            if company_to_remove in user.company.all():
                user.company.remove(company_to_remove)

            # ✅ Ensure company relation is set
            user.company.add(company)

        self.stdout.write(self.style.SUCCESS(f"✅ {created_count} users created, {updated_count} updated."))
