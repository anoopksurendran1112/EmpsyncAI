from django.urls import path
from .views import (
    signUp, profile, login, getAllUsers, todaysActiveUsers, changePassword, request_otp,
    verify_otp, reset_password, request_login_otp, verify_login_otp, privacy_policy,
    logout_view, delete_user, get_user_companies, get_team_members, getAllEmployees, 
    manageReligion, manageCaste, manageEmployeeProfile, manageBankDetail, manageQualification,
    manageExperience, employee_with_profile,available_id, candidateApplication, manage_employee_draft
)


urlpatterns = [
    path('api/signup',signUp ),
    path('api/privacy-policy',privacy_policy ),
    path('api/profile/<int:id>',profile),
    path('api/admin/users/<int:page>',getAllUsers), #shows current working users
    path('api/admin/all-users/<int:page>',getAllEmployees), #shows all users including inactive
    path('api/change-password',changePassword),
    path('api/admin/active-users/<int:page>',todaysActiveUsers,name='active_user'),
    path('api/request-otp',request_otp),
    path('api/verify-otp',verify_otp),
    path('api/reset-password',reset_password),
    path('api/login',login),
    path('api/logout',logout_view),
    path('api/delete-account',delete_user),
    path('api/request-login-otp',request_login_otp),
    path('api/verify-login-otp',verify_login_otp),
    path('api/user-companies',get_user_companies),
    path('api/group-members/<int:page>',get_team_members),
    
    path('api/available_id/', available_id, name='available_id'),
    path('api/candidate_request/',candidateApplication,name='candidate_request'),
    
    path('api/employee-with-profile/', employee_with_profile, name='employee-with-profile'),
    path('api/employee-draft/', manage_employee_draft, name='employee-draft'),
    path('api/manage-religion/', manageReligion, name='manage-religion'),
    path('api/manage-caste/', manageCaste, name='manage-caste'),
    path('api/employee-profile/', manageEmployeeProfile, name='employee-profile'),
    path('api/manage-banks/', manageBankDetail, name='manage-bank-detail'),
    path('api/manage-qualification/', manageQualification, name='manage-qualification'),
    path('api/manage-experience/', manageExperience, name='manage-experience'),
]