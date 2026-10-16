from rest_framework import serializers

from .models import SalaryConfig, EmployeeSalary, EmployeeSalaryRevision
from .services import ALLOWED_COMPONENT_TYPES, slugify_component_key


def _coerce_number(value, field_name, name, default=None):
    if value in (None, ''):
        if default is None:
            raise serializers.ValidationError(
                {field_name: f'"{name}" requires a numeric value.'}
            )
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        raise serializers.ValidationError(
            {field_name: f'"{name}" requires a numeric value.'}
        )


def normalize_component_list(raw, field_name):
    """Validate and normalise a company config component list."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise serializers.ValidationError({field_name: 'Must be a list of components.'})

    normalized = []
    seen = set()
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            raise serializers.ValidationError(
                {field_name: f'Component #{index + 1} must be an object.'}
            )
        name = str(item.get('name') or '').strip()
        if not name:
            raise serializers.ValidationError(
                {field_name: f'Component #{index + 1} is missing a name.'}
            )
        ctype = item.get('type') or 'fixed'
        if ctype not in ALLOWED_COMPONENT_TYPES:
            raise serializers.ValidationError(
                {field_name: f'"{name}" has an invalid type "{ctype}".'}
            )

        key = str(item.get('key') or '').strip() or slugify_component_key(name)
        base_key = key
        suffix = 2
        while key in seen:
            key = f'{base_key}_{suffix}'
            suffix += 1
        seen.add(key)

        entry = {'key': key, 'name': name, 'type': ctype}
        raw_value = item.get('value')
        if ctype == 'fixed':
            entry['value'] = _coerce_number(raw_value, field_name, name, default=0)
        else:
            entry['value'] = _coerce_number(raw_value, field_name, name)
        normalized.append(entry)
    return normalized


class SalaryConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryConfig
        fields = ['earnings', 'deductions', 'settings']

    def validate_earnings(self, value):
        return normalize_component_list(value, 'earnings')

    def validate_deductions(self, value):
        return normalize_component_list(value, 'deductions')

    def validate_settings(self, value):
        if value in (None, ''):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError('settings must be an object.')
        return value

    def validate(self, attrs):
        earnings = attrs.get('earnings', getattr(self.instance, 'earnings', None) or [])
        deductions = attrs.get('deductions', getattr(self.instance, 'deductions', None) or [])
        keys = [item['key'] for item in earnings] + [item['key'] for item in deductions]
        if len(keys) != len(set(keys)):
            raise serializers.ValidationError(
                'Component keys must be unique across earnings and deductions.'
            )
        return attrs


class EmployeeSalarySerializer(serializers.ModelSerializer):
    effective_from = serializers.DateField(required=False, allow_null=True)
    reason = serializers.ChoiceField(
        choices=[choice[0] for choice in EmployeeSalaryRevision.REASON_CHOICES],
        required=False,
        default='increment',
    )

    class Meta:
        model = EmployeeSalary
        fields = [
            'salary_type', 'employment_type', 'status', 'components', 'notes',
            'effective_from', 'reason',
        ]

    def validate_components(self, value):
        if value in (None, ''):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'components must be an object keyed by component key.'
            )
        cleaned = {}
        for key, entry in value.items():
            component_key = str(key).strip()
            if not component_key:
                continue
            if isinstance(entry, dict):
                cleaned[component_key] = {
                    'value': _coerce_number(
                        entry.get('value'), 'components', component_key, default=0
                    ),
                    'active': bool(entry.get('active', True)),
                }
            else:
                cleaned[component_key] = {
                    'value': _coerce_number(entry, 'components', component_key, default=0),
                    'active': True,
                }
        return cleaned
