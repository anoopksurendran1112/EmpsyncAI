import os
from django.core.management.base import BaseCommand, CommandError
from leave.utils_import import import_balances_from_excel
from company.models import Company


class Command(BaseCommand):
    help = ('Import opening leave balances from an Excel/CSV file into '
            'ImportedLeaveBalance. Always run with --dry-run first.')

    def add_arguments(self, parser):
        parser.add_argument('--file', required=True,
                            help='Path to the .xlsx/.csv file')
        parser.add_argument('--company', required=True, type=int,
                            help='Company id')
        parser.add_argument('--year', required=True, type=int,
                            help='Calendar year the balances apply to')
        parser.add_argument('--snapshot', required=True,
                            help='As-of cut-off date, YYYY-MM-DD')
        parser.add_argument('--expiry', default=None,
                            help='Optional last date the imported balance stays in use '
                                 '(YYYY-MM-DD). The snapshot is applied while today <= expiry '
                                 'and ignored from the next day (rows are kept). Omit to keep '
                                 'any existing expiry on re-import.')
        parser.add_argument('--dry-run', action='store_true',
                            help='Report what would happen without writing anything')

    def handle(self, *args, **options):
        company = Company.objects.filter(id=options['company']).first()
        if not company:
            raise CommandError(f"Company {options['company']} not found.")

        path = options['file']
        if not os.path.exists(path):
            raise CommandError(f"File not found: {path}")

        with open(path, 'rb') as f:
            res = import_balances_from_excel(
                f, company, options['year'], options['snapshot'],
                expiry_date=options['expiry'],
                dry_run=options['dry_run'],
            )

        if not res.get('success'):
            raise CommandError(res.get('message', 'Import failed.'))

        r = res.get('results', {})
        dry = options['dry_run']
        label = "DRY RUN - balance rows that WOULD be created" if dry else "Balance rows created"

        self.stdout.write(self.style.SUCCESS(
            f"Company: {company.company_name} (id={company.id})"))
        self.stdout.write(f"Year: {options['year']} | Snapshot: {options['snapshot']}"
                          f"{' | Expiry: ' + options['expiry'] if options['expiry'] else ''}"
                          f"{' | DRY RUN (no writes)' if dry else ''}")
        self.stdout.write(f"Columns imported: {', '.join(r.get('columns_found', [])) or '(none)'}")
        self.stdout.write(f"Employee rows matched: {r.get('rows_processed', 0)}")
        self.stdout.write(self.style.SUCCESS(
            f"{label}: {r.get('created', 0)} | Updated: {r.get('updated', 0)}"))

        if r.get('created_leave_types'):
            verb = 'WOULD create' if dry else 'created'
            self.stdout.write(self.style.WARNING(
                f"Leave types {verb}: {', '.join(r['created_leave_types'])}"))

        if r.get('unmatched'):
            self.stdout.write(self.style.WARNING(
                f"Unmatched staff IDs ({len(r['unmatched'])}): "
                f"{', '.join(r['unmatched'])}"))

        for e in r.get('errors', []):
            self.stdout.write(self.style.WARNING(f"note: {e}"))

        if dry:
            self.stdout.write(self.style.NOTICE(
                "\nNo changes were made. Re-run without --dry-run to apply."))