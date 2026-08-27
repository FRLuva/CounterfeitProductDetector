from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import Http404, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST
from .forms import AlertCommentForm, AlertModerationForm, CommunityAlertForm
from .models import AlertConfirmation, AlertEvidence, CommunityAlert


def alert_list(request):
    alerts = CommunityAlert.objects.filter(status=CommunityAlert.Status.APPROVED).select_related("reported_by").prefetch_related("evidence")
    return render(request, "tuli_compat/community_alerts/list.html", {"alerts": alerts})


def alert_detail(request, pk):
    alert = get_object_or_404(
        CommunityAlert.objects.select_related("reported_by", "reviewed_by").prefetch_related(
            "evidence", "confirmations", "comments__user"
        ),
        pk=pk,
    )
    allowed = alert.status == CommunityAlert.Status.APPROVED or (request.user.is_authenticated and (request.user == alert.reported_by or request.user.is_staff))
    if not allowed:
        raise Http404
    user_has_confirmed = request.user.is_authenticated and alert.confirmations.filter(user=request.user).exists()
    return render(request, "tuli_compat/community_alerts/detail.html", {
        "alert": alert,
        "comment_form": AlertCommentForm(),
        "user_has_confirmed": user_has_confirmed,
    })


@login_required
def create_alert(request):
    form = CommunityAlertForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        alert = form.save(commit=False)
        alert.reported_by = request.user
        if alert.latitude is not None:
            alert.geo_captured_at = timezone.now()
            alert.geo_verification_status = CommunityAlert.GeoStatus.PENDING
        with transaction.atomic():
            alert.save()
            for upload in form.cleaned_data.get("evidence_images", []):
                AlertEvidence.objects.create(alert=alert, image=upload)
        messages.success(request, "Your alert was submitted for review.")
        return redirect("community_alerts:detail", pk=alert.pk)
    return render(request, "tuli_compat/community_alerts/form.html", {"form": form})


@login_required
def my_alerts(request):
    return render(request, "tuli_compat/community_alerts/list.html", {"alerts": CommunityAlert.objects.filter(reported_by=request.user), "personal": True})


@login_required
@require_POST
def confirm_alert(request, pk):
    alert = get_object_or_404(CommunityAlert, pk=pk, status=CommunityAlert.Status.APPROVED)
    _, created = AlertConfirmation.objects.get_or_create(alert=alert, user=request.user)
    if not created:
        return HttpResponseBadRequest("You already confirmed this alert.")
    messages.success(request, "Your confirmation was recorded.")
    return redirect("community_alerts:detail", pk=pk)


@login_required
@require_POST
def add_comment(request, pk):
    alert = get_object_or_404(CommunityAlert, pk=pk, status=CommunityAlert.Status.APPROVED)
    form = AlertCommentForm(request.POST)
    if not form.is_valid():
        return HttpResponseBadRequest("A valid comment is required.")
    comment = form.save(commit=False)
    comment.alert, comment.user = alert, request.user
    comment.save()
    messages.success(request, "Your comment was added.")
    return redirect("community_alerts:detail", pk=pk)


@staff_member_required
def moderate_alert(request, pk):
    alert = get_object_or_404(CommunityAlert, pk=pk)
    form = AlertModerationForm(request.POST or None, instance=alert)
    if request.method == "POST" and form.is_valid():
        alert = form.save(commit=False)
        alert.reviewed_by, alert.reviewed_at = request.user, timezone.now()
        alert.save()
        messages.success(request, "The moderation decision was saved.")
        return redirect("community_alerts:detail", pk=pk)
    return render(request, "tuli_compat/community_alerts/moderate.html", {"form": form, "alert": alert})


@staff_member_required
def moderation_queue(request):
    status = request.GET.get("status", CommunityAlert.Status.PENDING)
    valid_statuses = {choice for choice, _ in CommunityAlert.Status.choices}
    if status not in valid_statuses:
        status = CommunityAlert.Status.PENDING
    alerts = CommunityAlert.objects.filter(status=status).select_related("reported_by")
    return render(request, "tuli_compat/community_alerts/moderation_queue.html", {
        "alerts": alerts,
        "selected_status": status,
        "statuses": CommunityAlert.Status.choices,
    })
