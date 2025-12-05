"use client";

import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Phone,
  MessageSquare,
  MapPin,
  Car,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateReviewMessage, JOB_STATUSES, type JobStatus } from "@/lib/config";
import type { Booking } from "./types";

interface JobCardProps {
  job: Booking;
  onStatusChange: (id: string, status: string) => void;
  onRebook?: (job: Booking) => void;
  formatDate: (date: string) => string;
  isPast?: boolean;
  pendingStatus?: { id: string; status: string } | null;
}

export function JobCard({
  job,
  onStatusChange,
  onRebook,
  formatDate,
  pendingStatus,
}: JobCardProps) {
  const isUpdating = pendingStatus?.id === job.id;
  const isCompleting = isUpdating && pendingStatus?.status === "completed";
  const isCancelling = isUpdating && pendingStatus?.status === "cancelled";
  const status = job.status as JobStatus;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{job.name}</h3>
            {job.returningCustomer && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Returning
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(job.date)} - {job.timeOfDay}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            JOB_STATUSES[status]?.color ?? ""
          }`}
        >
          {JOB_STATUSES[status]?.label ?? job.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Car className="w-4 h-4" />
          {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span className="capitalize">{job.serviceType}</span>
          {job.scent !== "none" && ` · ${job.scent}`}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          {job.mobile}
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            job.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate underline">{job.address}</span>
        </a>
      </div>

      {job.specialRequests && (
        <p className="text-sm bg-muted p-2 rounded">
          <span className="font-medium">Notes:</span> {job.specialRequests}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {job.status === "pending" && (
          <>
            <Button
              size="sm"
              onClick={() => onStatusChange(job.id, "completed")}
              disabled={isUpdating}
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              {isCompleting ? "Completing..." : "Complete"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange(job.id, "cancelled")}
              disabled={isUpdating}
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        )}
        {job.status === "completed" && (
          <Button size="sm" variant="outline" asChild>
            <a
              href={`sms:${job.mobile}?body=${encodeURIComponent(
                generateReviewMessage(job.name.split(" ")[0])
              )}`}
            >
              <Star className="w-4 h-4 mr-1" />
              Request Review
            </a>
          </Button>
        )}
        {job.status === "cancelled" && onRebook && (
          <Button size="sm" variant="outline" onClick={() => onRebook(job)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Rebook
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <a href={`tel:${job.mobile}`}>
            <Phone className="w-4 h-4 mr-1" />
            Call
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`sms:${job.mobile}`}>
            <MessageSquare className="w-4 h-4 mr-1" />
            Text
          </a>
        </Button>
      </div>
    </div>
  );
}
