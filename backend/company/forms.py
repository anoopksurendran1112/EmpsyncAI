from django import forms
from .models import CompanyRole, Company  # adjust import as needed

class CustomCompanyRoleForm(forms.ModelForm):
    class Meta:
        model = CompanyRole
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            # Only preselect all companies when creating a new instance
            self.fields['company'].initial = Company.objects.all()




from django import forms

class CombinedForm(forms.Form):
    # --- College fields ---
    college_name = forms.CharField(max_length=255, label="College Name")
    college_code = forms.CharField(max_length=50, label="College Code")

    # --- Machine fields ---
    machine_ids = forms.CharField(
        max_length=1000,
        label="Machine IDs (comma-separated)",
        help_text="Enter multiple machine IDs separated by commas"
    )

    # --- User fields ---
    user_name = forms.CharField(max_length=255, label="User Name")
    user_email = forms.EmailField(label="User Email")
    user_password = forms.CharField(widget=forms.PasswordInput(), label="Password")
