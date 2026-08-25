from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from .forms import SupplyChainEventForm, SupplyChainRecordForm, TraceVerificationForm
from .models import SupplyChainEvent, SupplyChainRecord
from .services import generate_trace_id, verify_location

def trace_detail(request, trace_id):
    record = get_object_or_404(SupplyChainRecord.objects.prefetch_related("events"), trace_id=trace_id.upper())
    return render(request, "tuli_compat/supply_chain/detail.html", {"record": record})

def verify_trace(request):
    form = TraceVerificationForm(request.GET or None)
    record = location_result = None
    searched = ambiguous = False
    if form.is_valid():
        searched = True
        matches = list(SupplyChainRecord.objects.filter(
            barcode__iexact=form.cleaned_data["barcode"].strip(),
            batch_number__iexact=form.cleaned_data["batch_number"].strip(),
        ).prefetch_related("events")[:2])
        if len(matches) == 1:
            record = matches[0]
        elif len(matches) > 1:
            ambiguous = True
        if record and form.cleaned_data.get("latitude") is not None:
            location_result = verify_location(record, form.cleaned_data["latitude"], form.cleaned_data["longitude"])
    return render(request, "tuli_compat/supply_chain/verify.html", {
        "form": form,
        "record": record,
        "location_result": location_result,
        "searched": searched,
        "ambiguous": ambiguous,
    })

@login_required
def my_records(request):
    return render(request, "tuli_compat/supply_chain/mine.html", {"records": SupplyChainRecord.objects.filter(created_by=request.user)})

@login_required
def create_record(request):
    form = SupplyChainRecordForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        with transaction.atomic():
            record = form.save(commit=False)
            record.trace_id = generate_trace_id(record.barcode, record.batch_number)
            record.created_by = request.user
            actor_name = form.cleaned_data["actor_name"] or record.manufacturer_name
            location_name = form.cleaned_data["location_name"] or record.current_location or "Manufacturer Facility"
            record.current_stage = form.cleaned_data["initial_stage"]
            record.current_owner = record.current_owner or actor_name
            record.current_location = record.current_location or location_name
            record.full_clean()
            record.save()
            SupplyChainEvent.objects.create(
                record=record,
                stage=form.cleaned_data["initial_stage"],
                actor_type=form.cleaned_data["actor_type"],
                actor_name=actor_name,
                location_name=location_name,
                latitude=form.cleaned_data.get("latitude"),
                longitude=form.cleaned_data.get("longitude"),
                geo_accuracy=form.cleaned_data.get("geo_accuracy"),
                event_time=timezone.now(),
                document_ref=form.cleaned_data["document_ref"],
                note=form.cleaned_data["note"] or "Initial supply chain record created.",
            )
        messages.success(request, "The trace record and its initial event were created.")
        return redirect("supply_chain:detail", trace_id=record.trace_id)
    return render(request, "tuli_compat/supply_chain/form.html", {"form": form, "title": "Create trace record"})

@login_required
def add_event(request, trace_id):
    record = get_object_or_404(SupplyChainRecord, trace_id=trace_id.upper())
    if request.user != record.created_by and not request.user.is_staff:
        raise Http404
    form = SupplyChainEventForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        with transaction.atomic():
            event = form.save(commit=False)
            event.record = record
            event.full_clean()
            if event.verification_status == event.Verification.VERIFIED:
                event.verified_by = request.user
            event.save()
            record.current_stage, record.current_owner, record.current_location = event.stage, event.actor_name, event.location_name
            update_fields = ["current_stage", "current_owner", "current_location", "updated_at"]
            if event.stage == "flagged" and record.authenticity_status not in {record.Authenticity.FAKE, record.Authenticity.EXPIRED}:
                record.authenticity_status = record.Authenticity.SUSPICIOUS
                update_fields.append("authenticity_status")
            record.save(update_fields=update_fields)
        messages.success(request, "The trace event was added.")
        return redirect("supply_chain:detail", trace_id=record.trace_id)
    return render(request, "tuli_compat/supply_chain/form.html", {"form": form, "title": "Add trace event", "record": record})
