"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { formatDateBrisbane, formatDateDisplay, isDateWithin24Hours, isWithin24Hours } from "@/lib/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  Loader2,
  CalendarOff,
  Phone,
  MessageSquare,
  MapPin,
  Car,
  Plus,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

interface Booking {
  id: string;
  name: string;
  mobile: string;
  address: string;
  returningCustomer: boolean;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  scent: string;
  specialRequests: string | null;
  date: string;
  timeOfDay: string;
  status: string;
  createdAt: number;
}

interface Scent {
  id: string;
  name: string;
  enabled: boolean;
}

interface UnavailableSlot {
  date: string;
  timeOfDay: string;
}

interface TakenBooking {
  date: string;
  timeframe: string;
}

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [unavailable, setUnavailable] = useState<UnavailableSlot[]>([]);
  const [upcomingLimit, setUpcomingLimit] = useState(3);
  const [pastLimit, setPastLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"morning" | "afternoon" | "all">("all");
  const [takenBookings, setTakenBookings] = useState<TakenBooking[]>([]);

  // Rebook dialog state
  const [rebookJob, setRebookJob] = useState<Booking | null>(null);
  const [rebookDate, setRebookDate] = useState<Date | undefined>();
  const [rebookTime, setRebookTime] = useState<"morning" | "afternoon" | "">("");

  // Scent management state
  const [scents, setScents] = useState<Scent[]>([]);
  const [newScentName, setNewScentName] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      const [bookingsRes, unavailableRes, takenRes, scentsRes] = await Promise.all([
        fetch("/api/admin/bookings"),
        fetch("/api/admin/unavailable"),
        fetch("/api/bookings"),
        fetch("/api/admin/scents"),
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setUpcoming(data.upcoming);
        setPast(data.past);
      }

      if (scentsRes.ok) {
        const data = await scentsRes.json();
        setScents(data.scents);
      }

      if (unavailableRes.ok) {
        const data = await unavailableRes.json();
        setUnavailable(data.slots);
      }

      if (takenRes.ok) {
        const data = await takenRes.json();
        setTakenBookings(data.bookings);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(id: string, status: string) {
    const statusMessages: Record<string, string> = {
      completed: "Job marked as completed",
      cancelled: "Job cancelled",
      pending: "Job rebooked",
    };

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        toast.success(statusMessages[status] || "Status updated");
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Failed to update status");
    }
  }

  async function addUnavailableSlots() {
    if (selectedDates.length === 0) return;

    const slots = selectedDates.map((date) => ({
      date: formatDateBrisbane(date),
      timeOfDay: selectedTimeframe,
    }));

    try {
      const res = await fetch("/api/admin/unavailable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });

      if (res.ok) {
        toast.success(`Blocked ${selectedDates.length} date${selectedDates.length !== 1 ? "s" : ""}`);
        setSelectedDates([]);
        fetchData();
      } else {
        toast.error("Failed to block dates");
      }
    } catch (error) {
      console.error("Failed to add unavailable slots:", error);
      toast.error("Failed to block dates");
    }
  }

  async function removeUnavailableSlot(date: string, timeOfDay: string) {
    try {
      const res = await fetch("/api/admin/unavailable", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: [{ date, timeOfDay }] }),
      });

      if (res.ok) {
        toast.success("Date unblocked");
        fetchData();
      } else {
        toast.error("Failed to unblock date");
      }
    } catch (error) {
      console.error("Failed to remove unavailable slot:", error);
      toast.error("Failed to unblock date");
    }
  }

  const formatDate = formatDateDisplay;

  // Rebook availability helpers
  const isDateFullyBooked = (checkDate: Date) => {
    if (isDateWithin24Hours(checkDate)) return true;
    const dateStr = formatDateBrisbane(checkDate);
    const morningTaken = takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === "morning"
    );
    const afternoonTaken = takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === "afternoon"
    );
    return morningTaken && afternoonTaken;
  };

  const isTimeSlotTaken = (checkDate: Date, timeframe: "morning" | "afternoon") => {
    if (isWithin24Hours(checkDate, timeframe)) return true;
    const dateStr = formatDateBrisbane(checkDate);
    return takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === timeframe
    );
  };

  // Check if date is already blocked for the selected timeframe
  const isDateAlreadyBlocked = (checkDate: Date) => {
    const dateStr = formatDateBrisbane(checkDate);

    // Check if date has "all" blocked
    const hasAllBlocked = unavailable.some(
      (slot) => slot.date === dateStr && slot.timeOfDay === "all"
    );
    if (hasAllBlocked) return true;

    // If blocking "all", check if date already has any blocking
    if (selectedTimeframe === "all") {
      return unavailable.some((slot) => slot.date === dateStr);
    }

    // Check if specific timeframe is already blocked
    return unavailable.some(
      (slot) => slot.date === dateStr && slot.timeOfDay === selectedTimeframe
    );
  };

  function openRebookDialog(job: Booking) {
    setRebookJob(job);
    setRebookDate(undefined);
    setRebookTime("");
  }

  function closeRebookDialog() {
    setRebookJob(null);
    setRebookDate(undefined);
    setRebookTime("");
  }

  async function handleRebook() {
    if (!rebookJob || !rebookDate || !rebookTime) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rebookJob.id,
          status: "pending",
          date: formatDateBrisbane(rebookDate),
          timeOfDay: rebookTime,
        }),
      });

      if (res.ok) {
        toast.success("Job rebooked successfully");
        closeRebookDialog();
        fetchData();
      } else {
        toast.error("Failed to rebook job");
      }
    } catch (error) {
      console.error("Failed to rebook:", error);
      toast.error("Failed to rebook job");
    }
  }

  // Scent management functions
  async function addScent() {
    if (!newScentName.trim()) return;

    try {
      const res = await fetch("/api/admin/scents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newScentName.trim() }),
      });

      if (res.ok) {
        toast.success("Scent added");
        setNewScentName("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add scent");
      }
    } catch (error) {
      console.error("Failed to add scent:", error);
      toast.error("Failed to add scent");
    }
  }

  async function toggleScent(id: string, enabled: boolean) {
    try {
      const res = await fetch("/api/admin/scents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });

      if (res.ok) {
        toast.success(enabled ? "Scent enabled" : "Scent disabled");
        fetchData();
      } else {
        toast.error("Failed to update scent");
      }
    } catch (error) {
      console.error("Failed to toggle scent:", error);
      toast.error("Failed to update scent");
    }
  }

  async function deleteScent(id: string) {
    try {
      const res = await fetch("/api/admin/scents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success("Scent deleted");
        fetchData();
      } else {
        toast.error("Failed to delete scent");
      }
    } catch (error) {
      console.error("Failed to delete scent:", error);
      toast.error("Failed to delete scent");
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Upcoming Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Jobs</CardTitle>
            <CardDescription>
              {upcoming.length} job{upcoming.length !== 1 ? "s" : ""} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No upcoming jobs
              </p>
            ) : (
              <>
                {upcoming.slice(0, upcomingLimit).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={updateBookingStatus}
                    onRebook={openRebookDialog}
                    formatDate={formatDate}
                  />
                ))}
                {upcoming.length > upcomingLimit && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setUpcomingLimit((l) => l + 3)}
                  >
                    Show more
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Past Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Past Jobs</CardTitle>
            <CardDescription>
              {past.length} past job{past.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {past.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No past jobs
              </p>
            ) : (
              <>
                {past.slice(0, pastLimit).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={updateBookingStatus}
                    onRebook={openRebookDialog}
                    formatDate={formatDate}
                    isPast
                  />
                ))}
                {past.length > pastLimit && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setPastLimit((l) => l + 3)}
                  >
                    Show more
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Unavailability Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Availability</CardTitle>
            <CardDescription>
              Block dates and timeframes from being booked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Select dates to block</p>
                <div className="border rounded-md p-2">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || isDateAlreadyBlocked(date);
                    }}
                    className="w-full"
                    classNames={{ root: "w-full" }}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Timeframe</p>
                  <div className="flex gap-2">
                    {(["morning", "afternoon", "all"] as const).map((tf) => (
                      <Button
                        key={tf}
                        variant={selectedTimeframe === tf ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeframe(tf)}
                        className="flex-1 capitalize"
                      >
                        {tf === "all" ? "Full Day" : tf}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={addUnavailableSlots}
                  disabled={selectedDates.length === 0}
                  className="w-full"
                >
                  <CalendarOff className="w-4 h-4 mr-2" />
                  Block {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""}
                </Button>

                {unavailable.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Currently blocked</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {unavailable.map((slot, i) => (
                        <div
                          key={`${slot.date}-${slot.timeOfDay}-${i}`}
                          className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm"
                        >
                          <span>
                            {formatDate(slot.date)} -{" "}
                            {slot.timeOfDay === "all" ? "Full Day" : slot.timeOfDay}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUnavailableSlot(slot.date, slot.timeOfDay)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manage Scents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Manage Scents
            </CardTitle>
            <CardDescription>
              Add, enable, or disable scent options for bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New scent name"
                value={newScentName}
                onChange={(e) => setNewScentName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addScent()}
              />
              <Button onClick={addScent} disabled={!newScentName.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {scents.length > 0 ? (
              <div className="space-y-2">
                {scents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                  >
                    <span className={s.enabled ? "" : "text-muted-foreground line-through"}>
                      {s.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant={s.enabled ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleScent(s.id, true)}
                        disabled={s.enabled}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={!s.enabled ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleScent(s.id, false)}
                        disabled={!s.enabled}
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteScent(s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No scents added yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rebook Dialog */}
      <Dialog open={!!rebookJob} onOpenChange={(open) => !open && closeRebookDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rebook Job</DialogTitle>
            <DialogDescription>
              Select a new date and time for {rebookJob?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Select Date</p>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={rebookDate}
                  onSelect={(date) => {
                    setRebookDate(date);
                    setRebookTime("");
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date <= today || isDateFullyBooked(date);
                  }}
                  className="w-full"
                  classNames={{ root: "w-full" }}
                />
              </div>
            </div>

            {rebookDate && (
              <div>
                <p className="text-sm font-medium mb-2">Select Time</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={rebookTime === "morning" ? "default" : "outline"}
                    onClick={() => setRebookTime("morning")}
                    disabled={isTimeSlotTaken(rebookDate, "morning")}
                    className="flex-1"
                  >
                    Morning
                    {isTimeSlotTaken(rebookDate, "morning") && " (Taken)"}
                  </Button>
                  <Button
                    type="button"
                    variant={rebookTime === "afternoon" ? "default" : "outline"}
                    onClick={() => setRebookTime("afternoon")}
                    disabled={isTimeSlotTaken(rebookDate, "afternoon")}
                    className="flex-1"
                  >
                    Afternoon
                    {isTimeSlotTaken(rebookDate, "afternoon") && " (Taken)"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={closeRebookDialog} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleRebook}
                disabled={!rebookDate || !rebookTime}
                className="flex-1"
              >
                Confirm Rebook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function JobCard({
  job,
  onStatusChange,
  onRebook,
  formatDate,
  isPast = false,
}: {
  job: Booking;
  onStatusChange: (id: string, status: string) => void;
  onRebook?: (job: Booking) => void;
  formatDate: (date: string) => string;
  isPast?: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
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
          className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[job.status]}`}
        >
          {job.status}
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
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
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
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange(job.id, "cancelled")}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
        {job.status === "cancelled" && onRebook && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRebook(job)}
          >
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
