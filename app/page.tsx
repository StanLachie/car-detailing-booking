"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { registerDevConsole } from "@/lib/console";
import {
  TOTAL_STEPS,
  MOBILE_REGEX,
  MIN_NAME_LENGTH,
  BUSINESS_NAME,
} from "@/lib/config";
import logo from "./logo.png";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateBrisbane } from "@/lib/date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PersonalDetailsStep,
  VehicleDetailsStep,
  ServiceDetailsStep,
  ScheduleStep,
  type BookingFormData,
  type FormErrors,
  type TakenBooking,
} from "@/components/booking";

function validateMobile(mobile: string): string | undefined {
  const cleaned = mobile.replace(/\s/g, "");
  if (!cleaned) return "Mobile number is required";
  if (!MOBILE_REGEX.test(cleaned)) {
    return "Please enter a valid Australian mobile number";
  }
  return undefined;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < MIN_NAME_LENGTH)
    return `Name must be at least ${MIN_NAME_LENGTH} characters`;
  return undefined;
}

const initialFormData: BookingFormData = {
  name: "",
  mobile: "",
  address: "",
  returningCustomer: false,
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  serviceType: "both",
  scent: "none",
  photos: null,
  specialRequests: "",
  date: undefined,
  timeOfDay: "",
};

async function fetchBookings(): Promise<{ bookings: TakenBooking[] }> {
  const res = await fetch("/api/bookings");
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

async function fetchPricing(): Promise<{
  pricing: {
    vehicleType: string;
    interiorPrice: number;
    exteriorPrice: number;
    bothPrice: number;
  }[];
}> {
  const res = await fetch("/api/pricing");
  if (!res.ok) throw new Error("Failed to fetch pricing");
  return res.json();
}

async function createBooking(data: {
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
}) {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create booking");
  }
  return res.json();
}

export default function Home() {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Register dev console when logged in
  useEffect(() => {
    if (!session) return;

    const cleanup = registerDevConsole({
      formData,
      setFormData,
      currentStep,
      setCurrentStep,
      setTouched,
      setSubmitted,
      setBookingComplete,
      initialFormData,
    });

    return cleanup;
  }, [session, formData, currentStep]);

  const { data: bookingsData } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
  });

  const { data: pricingData } = useQuery({
    queryKey: ["pricing"],
    queryFn: fetchPricing,
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setBookingComplete(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const takenBookings = bookingsData?.bookings ?? [];
  const pricing = pricingData?.pricing ?? [];

  // Compute errors from form data
  const errors = useMemo(() => {
    const newErrors: FormErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const mobileError = validateMobile(formData.mobile);
    if (mobileError) newErrors.mobile = mobileError;

    if (!formData.address) newErrors.address = "Address is required";

    if (!formData.vehicleYear) newErrors.vehicleYear = "Please select a year";
    if (!formData.vehicleMake.trim())
      newErrors.vehicleMake = "Please enter the make";
    if (!formData.vehicleModel.trim())
      newErrors.vehicleModel = "Please enter the model";

    if (!formData.serviceType)
      newErrors.serviceType = "Please select a service type";
    if (!formData.scent) newErrors.scent = "Please select a scent";

    if (!formData.date) newErrors.date = "Please select a date";

    if (formData.date && !formData.timeOfDay)
      newErrors.timeOfDay = "Please select a time";

    return newErrors;
  }, [formData]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof FormErrors) => {
    return (touched[field] || submitted) && errors[field];
  };

  // Check if current step has errors
  const getStepErrors = (step: number): (keyof FormErrors)[] => {
    switch (step) {
      case 0:
        return ["name", "mobile", "address"];
      case 1:
        return ["vehicleYear", "vehicleMake", "vehicleModel"];
      case 2:
        return ["serviceType", "scent"];
      case 3:
        return ["date", "timeOfDay"];
      default:
        return [];
    }
  };

  const isStepValid = (step: number) => {
    const stepFields = getStepErrors(step);
    return !stepFields.some((field) => errors[field]);
  };

  const canProceed = isStepValid(currentStep);

  const handleNext = () => {
    // Mark all fields in current step as touched
    const stepFields = getStepErrors(currentStep);
    const newTouched = { ...touched };
    stepFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (canProceed && currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    bookingMutation.mutate({
      name: formData.name,
      mobile: formData.mobile,
      address: formData.address,
      returningCustomer: formData.returningCustomer,
      vehicleYear: formData.vehicleYear,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      serviceType: formData.serviceType,
      scent: formData.scent,
      specialRequests: formData.specialRequests || null,
      date: formatDateBrisbane(formData.date!),
      timeOfDay: formData.timeOfDay,
    });
  };

  const stepProps = {
    formData,
    setFormData,
    errors,
    touched,
    submitted,
    handleBlur,
    showError,
  };

  if (bookingComplete) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Booking Received!</h2>
              <p className="text-muted-foreground mb-6">
                Thanks {formData.name.split(" ")[0]}! We&apos;ve received your
                booking request for{" "}
                {formData.date?.toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "Australia/Brisbane",
                })}{" "}
                ({formData.timeOfDay}).
              </p>
              <p className="text-muted-foreground">
                You&apos;ll receive a confirmation shortly via text message.
              </p>
            </CardContent>
          </Card>

          {/* Contact options */}
          <Card className="mt-6">
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Questions? Get in touch
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${process.env.NEXT_PUBLIC_CONTACT_NUMBER}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`sms:${process.env.NEXT_PUBLIC_CONTACT_NUMBER}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Text
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Image
              src={logo}
              alt={BUSINESS_NAME}
              className="h-32 w-auto mx-auto"
              priority
            />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {currentStep === 0 && <PersonalDetailsStep {...stepProps} />}
              {currentStep === 1 && <VehicleDetailsStep {...stepProps} />}
              {currentStep === 2 && <ServiceDetailsStep {...stepProps} />}
              {currentStep === 3 && (
                <ScheduleStep {...stepProps} takenBookings={takenBookings} />
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}

                {currentStep < TOTAL_STEPS - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                    disabled={!canProceed}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      Object.keys(errors).length > 0 ||
                      bookingMutation.isPending
                    }
                  >
                    {bookingMutation.isPending
                      ? "Booking..."
                      : "Book Appointment"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="mt-6">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="text-right font-semibold">
                    Interior
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Exterior
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Full Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.map((p) => (
                  <TableRow key={p.vehicleType}>
                    <TableCell>{p.vehicleType}</TableCell>
                    <TableCell className="text-right">
                      ${p.interiorPrice}+
                    </TableCell>
                    <TableCell className="text-right">
                      ${p.exteriorPrice}+
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${p.bothPrice}+
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Prices listed are starting prices, final pricing may vary based on
              vehicle size and condition
            </p>
          </CardContent>
        </Card>

        {/* Contact options */}
        <Card className="mt-6">
          <CardContent>
            <p className="text-sm text-muted-foreground text-center mb-3">
              Need help or prefer to book by phone?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${process.env.NEXT_PUBLIC_CONTACT_NUMBER}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`sms:${process.env.NEXT_PUBLIC_CONTACT_NUMBER}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
