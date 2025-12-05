"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  formatDateBrisbane,
  formatDateDisplay,
  isDateWithin24Hours,
  isWithin24Hours,
} from "@/lib/date";
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
  XCircle,
  RefreshCw,
  ChevronDown,
  Loader2,
  CalendarOff,
  Plus,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import {
  JobCard,
  type Booking,
  type Scent,
  type UnavailableSlot,
  type TakenBooking,
} from "@/components/dashboard";

// API fetch functions
async function fetchBookings(): Promise<{
  upcoming: Booking[];
  past: Booking[];
}> {
  const res = await fetch("/api/admin/bookings");
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

async function fetchUnavailable(): Promise<{ slots: UnavailableSlot[] }> {
  const res = await fetch("/api/admin/unavailable");
  if (!res.ok) throw new Error("Failed to fetch unavailable slots");
  return res.json();
}

async function fetchTakenBookings(): Promise<{ bookings: TakenBooking[] }> {
  const res = await fetch("/api/bookings");
  if (!res.ok) throw new Error("Failed to fetch taken bookings");
  return res.json();
}

async function fetchScents(): Promise<{ scents: Scent[] }> {
  const res = await fetch("/api/admin/scents");
  if (!res.ok) throw new Error("Failed to fetch scents");
  return res.json();
}

// API mutation functions
async function updateBookingStatusApi(data: {
  id: string;
  status: string;
  date?: string;
  timeOfDay?: string;
}) {
  const res = await fetch("/api/admin/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update booking");
  return res.json();
}

async function addUnavailableSlotsApi(
  slots: { date: string; timeOfDay: string }[]
) {
  const res = await fetch("/api/admin/unavailable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slots }),
  });
  if (!res.ok) throw new Error("Failed to block dates");
  return res.json();
}

async function removeUnavailableSlotApi(data: {
  date: string;
  timeOfDay: string;
}) {
  const res = await fetch("/api/admin/unavailable", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slots: [data] }),
  });
  if (!res.ok) throw new Error("Failed to unblock date");
  return res.json();
}

async function addScentApi(name: string) {
  const res = await fetch("/api/admin/scents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to add scent");
  }
  return res.json();
}

async function toggleScentApi(data: { id: string; enabled: boolean }) {
  const res = await fetch("/api/admin/scents", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update scent");
  return res.json();
}

async function deleteScentApi(id: string) {
  const res = await fetch("/api/admin/scents", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete scent");
  return res.json();
}

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI state
  const [upcomingLimit, setUpcomingLimit] = useState(3);
  const [pastLimit, setPastLimit] = useState(3);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "morning" | "afternoon" | "all"
  >("all");

  // Rebook dialog state
  const [rebookJob, setRebookJob] = useState<Booking | null>(null);
  const [rebookDate, setRebookDate] = useState<Date | undefined>();
  const [rebookTime, setRebookTime] = useState<"morning" | "afternoon" | "">(
    ""
  );

  // Scent management state
  const [newScentName, setNewScentName] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Queries
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    isFetching: bookingsFetching,
  } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: fetchBookings,
    enabled: !!session,
  });

  const {
    data: unavailableData,
    isLoading: unavailableLoading,
    isFetching: unavailableFetching,
  } = useQuery({
    queryKey: ["admin-unavailable"],
    queryFn: fetchUnavailable,
    enabled: !!session,
  });

  const {
    data: takenData,
    isLoading: takenLoading,
    isFetching: takenFetching,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchTakenBookings,
    enabled: !!session,
  });

  const {
    data: scentsData,
    isLoading: scentsLoading,
    isFetching: scentsFetching,
  } = useQuery({
    queryKey: ["admin-scents"],
    queryFn: fetchScents,
    enabled: !!session,
  });

  const upcoming = bookingsData?.upcoming ?? [];
  const past = bookingsData?.past ?? [];
  const unavailable = unavailableData?.slots ?? [];
  const takenBookings = takenData?.bookings ?? [];
  const scents = scentsData?.scents ?? [];
  const loading =
    bookingsLoading || unavailableLoading || takenLoading || scentsLoading;
  const refetching =
    bookingsFetching || unavailableFetching || takenFetching || scentsFetching;

  // Track manual refresh to show toast on completion
  const manualRefreshRef = useRef(false);
  const prevRefetchingRef = useRef(refetching);

  useEffect(() => {
    if (prevRefetchingRef.current && !refetching && manualRefreshRef.current) {
      toast.success("Data refreshed");
      manualRefreshRef.current = false;
    }
    prevRefetchingRef.current = refetching;
  }, [refetching]);

  // Invalidate all dashboard queries
  const invalidateAll = () => {
    manualRefreshRef.current = true;
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-unavailable"] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-scents"] });
  };

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: updateBookingStatusApi,
    onSuccess: (_, variables) => {
      const statusMessages: Record<string, string> = {
        completed: "Job marked as completed",
        cancelled: "Job cancelled",
        pending: "Job rebooked",
      };
      toast.success(statusMessages[variables.status] || "Status updated");
      invalidateAll();
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const addUnavailableMutation = useMutation({
    mutationFn: addUnavailableSlotsApi,
    onSuccess: () => {
      toast.success(
        `Blocked ${selectedDates.length} date${
          selectedDates.length !== 1 ? "s" : ""
        }`
      );
      setSelectedDates([]);
      invalidateAll();
    },
    onError: () => {
      toast.error("Failed to block dates");
    },
  });

  const removeUnavailableMutation = useMutation({
    mutationFn: removeUnavailableSlotApi,
    onSuccess: () => {
      toast.success("Date unblocked");
      invalidateAll();
    },
    onError: () => {
      toast.error("Failed to unblock date");
    },
  });

  const addScentMutation = useMutation({
    mutationFn: addScentApi,
    onSuccess: () => {
      toast.success("Scent added");
      setNewScentName("");
      invalidateAll();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleScentMutation = useMutation({
    mutationFn: toggleScentApi,
    onSuccess: (_, variables) => {
      toast.success(variables.enabled ? "Scent enabled" : "Scent disabled");
      invalidateAll();
    },
    onError: () => {
      toast.error("Failed to update scent");
    },
  });

  const deleteScentMutation = useMutation({
    mutationFn: deleteScentApi,
    onSuccess: () => {
      toast.success("Scent deleted");
      invalidateAll();
    },
    onError: () => {
      toast.error("Failed to delete scent");
    },
  });

  function updateBookingStatus(id: string, status: string) {
    updateStatusMutation.mutate({ id, status });
  }

  function addUnavailableSlots() {
    if (selectedDates.length === 0) return;
    const slots = selectedDates.map((date) => ({
      date: formatDateBrisbane(date),
      timeOfDay: selectedTimeframe,
    }));
    addUnavailableMutation.mutate(slots);
  }

  function removeUnavailableSlot(date: string, timeOfDay: string) {
    removeUnavailableMutation.mutate({ date, timeOfDay });
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

  const isTimeSlotTaken = (
    checkDate: Date,
    timeframe: "morning" | "afternoon"
  ) => {
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

  function handleRebook() {
    if (!rebookJob || !rebookDate || !rebookTime) return;
    updateStatusMutation.mutate(
      {
        id: rebookJob.id,
        status: "pending",
        date: formatDateBrisbane(rebookDate),
        timeOfDay: rebookTime,
      },
      {
        onSuccess: () => {
          toast.success("Job rebooked successfully");
          closeRebookDialog();
        },
      }
    );
  }

  // Scent management functions
  function addScent() {
    if (!newScentName.trim()) return;
    addScentMutation.mutate(newScentName.trim());
  }

  function toggleScent(id: string, enabled: boolean) {
    toggleScentMutation.mutate({ id, enabled });
  }

  function deleteScent(id: string) {
    deleteScentMutation.mutate(id);
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
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={invalidateAll} disabled={refetching}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refetching ? "animate-spin" : ""}`}
            />
            {refetching ? "Refreshing..." : "Refresh"}
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
                    pendingStatus={
                      updateStatusMutation.isPending
                        ? (updateStatusMutation.variables as { id: string; status: string })
                        : null
                    }
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
                    pendingStatus={
                      updateStatusMutation.isPending
                        ? (updateStatusMutation.variables as { id: string; status: string })
                        : null
                    }
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
                <p className="text-sm font-medium mb-2">
                  Select dates to block
                </p>
                <div className="border border-border rounded-md p-2">
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
                        variant={
                          selectedTimeframe === tf ? "default" : "outline"
                        }
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
                  disabled={
                    selectedDates.length === 0 ||
                    addUnavailableMutation.isPending
                  }
                  className="w-full"
                >
                  <CalendarOff className="w-4 h-4 mr-2" />
                  {addUnavailableMutation.isPending
                    ? "Blocking..."
                    : `Block ${selectedDates.length} date${selectedDates.length !== 1 ? "s" : ""}`}
                </Button>

                {unavailable.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Currently blocked
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {unavailable.map((slot, i) => (
                        <div
                          key={`${slot.date}-${slot.timeOfDay}-${i}`}
                          className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm"
                        >
                          <span>
                            {formatDate(slot.date)} -{" "}
                            {slot.timeOfDay === "all"
                              ? "Full Day"
                              : slot.timeOfDay}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeUnavailableSlot(slot.date, slot.timeOfDay)
                            }
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
              <Button
                onClick={addScent}
                disabled={!newScentName.trim() || addScentMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1" />
                {addScentMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>

            {scents.length > 0 ? (
              <div className="space-y-2">
                {scents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                  >
                    <span
                      className={
                        s.enabled ? "" : "text-muted-foreground line-through"
                      }
                    >
                      {s.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant={s.enabled ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleScent(s.id, true)}
                        disabled={
                          s.enabled ||
                          (toggleScentMutation.isPending &&
                            toggleScentMutation.variables?.id === s.id)
                        }
                      >
                        {toggleScentMutation.isPending &&
                        toggleScentMutation.variables?.id === s.id &&
                        toggleScentMutation.variables?.enabled === true ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant={!s.enabled ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleScent(s.id, false)}
                        disabled={
                          !s.enabled ||
                          (toggleScentMutation.isPending &&
                            toggleScentMutation.variables?.id === s.id)
                        }
                      >
                        {toggleScentMutation.isPending &&
                        toggleScentMutation.variables?.id === s.id &&
                        toggleScentMutation.variables?.enabled === false ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
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
      <Dialog
        open={!!rebookJob}
        onOpenChange={(open) => !open && closeRebookDialog()}
      >
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
              <div className="border border-border rounded-md p-2">
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
              <Button
                variant="outline"
                onClick={closeRebookDialog}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRebook}
                disabled={
                  !rebookDate || !rebookTime || updateStatusMutation.isPending
                }
                className="flex-1"
              >
                {updateStatusMutation.isPending
                  ? "Rebooking..."
                  : "Confirm Rebook"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
