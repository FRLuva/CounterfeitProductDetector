from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class AccountFlowTests(TestCase):
    def test_registration_creates_user_and_logs_in(self):
        response = self.client.post(reverse("accounts:register"), {
            "first_name": "Tuli Reviewer", "email": "TULI@example.com", "username": "tuli-review",
            "password1": "A-Strong-Review-Pass-2026", "password2": "A-Strong-Review-Pass-2026",
        })
        self.assertRedirects(response, reverse("home"))
        user = get_user_model().objects.get(username="tuli-review")
        self.assertEqual(user.email, "tuli@example.com")
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.pk)

    def test_duplicate_email_is_case_insensitively_rejected(self):
        get_user_model().objects.create_user("existing", email="tuli@example.com", password="StrongPass123")
        response = self.client.post(reverse("accounts:register"), {
            "first_name": "Other", "email": "TULI@example.com", "username": "other-review",
            "password1": "A-Strong-Review-Pass-2026", "password2": "A-Strong-Review-Pass-2026",
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "already exists")
        self.assertFalse(get_user_model().objects.filter(username="other-review").exists())

    def test_login_and_logout_pages_render(self):
        self.assertEqual(self.client.get(reverse("accounts:login")).status_code, 200)
        self.assertEqual(self.client.get(reverse("accounts:register")).status_code, 200)

    def test_authenticated_user_is_redirected_away_from_registration(self):
        user = get_user_model().objects.create_user("signed-in", password="StrongPass123")
        self.client.force_login(user)
        self.assertRedirects(self.client.get(reverse("accounts:register")), reverse("home"))

    def test_logout_uses_post_and_clears_the_session(self):
        user = get_user_model().objects.create_user("logout-user", password="StrongPass123")
        self.client.force_login(user)
        response = self.client.post(reverse("accounts:logout"))
        self.assertRedirects(response, reverse("home"))
        self.assertNotIn("_auth_user_id", self.client.session)
