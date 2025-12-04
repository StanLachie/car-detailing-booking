"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

// Generate years from 2000 to current year, plus Pre-2000's option
const currentYear = new Date().getFullYear();
const vehicleYears = [
  ...Array.from({ length: currentYear - 1999 }, (_, i) =>
    String(currentYear - i)
  ),
  "Pre-2000's",
];

export function VehicleDetailsStep({
  formData,
  setFormData,
  errors,
  showError,
  handleBlur,
}: StepProps) {
  return (
    <div className="space-y-6">
      {/* Vehicle Year */}
      <div className="space-y-2">
        <Label>Vehicle Year *</Label>
        <Select
          value={formData.vehicleYear}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, vehicleYear: value }));
            handleBlur("vehicleYear");
          }}
        >
          <SelectTrigger
            className={cn(
              "w-full",
              showError("vehicleYear") && "border-destructive"
            )}
          >
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {vehicleYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showError("vehicleYear") && (
          <p className="text-sm text-destructive">{errors.vehicleYear}</p>
        )}
      </div>

      {/* Vehicle Make */}
      <div className="space-y-2">
        <Label htmlFor="vehicleMake">Vehicle Make *</Label>
        <Input
          id="vehicleMake"
          placeholder="e.g. Toyota, Mazda, Ford"
          value={formData.vehicleMake}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, vehicleMake: e.target.value }))
          }
          onBlur={() => handleBlur("vehicleMake")}
          aria-invalid={!!showError("vehicleMake")}
        />
        {showError("vehicleMake") && (
          <p className="text-sm text-destructive">{errors.vehicleMake}</p>
        )}
      </div>

      {/* Vehicle Model */}
      <div className="space-y-2">
        <Label htmlFor="vehicleModel">Vehicle Model *</Label>
        <Input
          id="vehicleModel"
          placeholder="e.g. Corolla, CX-5, Ranger"
          value={formData.vehicleModel}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, vehicleModel: e.target.value }))
          }
          onBlur={() => handleBlur("vehicleModel")}
          aria-invalid={!!showError("vehicleModel")}
        />
        {showError("vehicleModel") && (
          <p className="text-sm text-destructive">{errors.vehicleModel}</p>
        )}
      </div>
    </div>
  );
}
