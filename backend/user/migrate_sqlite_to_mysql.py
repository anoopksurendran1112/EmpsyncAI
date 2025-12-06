from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = 'Migrate all data from sqlite to default (mysql) database'

    def handle(self, *args, **kwargs):
        for model in apps.get_models():
            model_name = model.__name__
            try:
                sqlite_objects = list(model.objects.using('sqlite').all())
                if not sqlite_objects:
                    self.stdout.write(self.style.WARNING(f"{model_name}: No data found."))
                    continue

                for obj in sqlite_objects:
                    try:
                        obj.save(using='default')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"{model_name}: Error saving object {obj.pk} - {e}"))

                model.objects.using('default').bulk_create(sqlite_objects, batch_size=1000)
                self.stdout.write(self.style.SUCCESS(f"{model_name}: Migrated {len(sqlite_objects)} records."))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"{model_name}: Failed - {e}"))
