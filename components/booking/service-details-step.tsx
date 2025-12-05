"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { StepProps, Scent } from "./types";

export function ServiceDetailsStep({
  formData,
  setFormData,
  errors,
  showError,
  handleBlur,
}: StepProps) {
  const [scents, setScents] = useState<Scent[]>([]);
  const [scentsLoading, setScentsLoading] = useState(true);

  useEffect(() => {
    async function fetchScents() {
      setScentsLoading(true);
      try {
        const response = await fetch("/api/scents");
        if (response.ok) {
          const data = await response.json();
          setScents(data.scents);
        }
      } catch (error) {
        console.error("Failed to fetch scents:", error);
      } finally {
        setScentsLoading(false);
      }
    }
    fetchScents();
  }, []);

  // Reset scent when service type changes from "both" to something else
  useEffect(() => {
    if (formData.serviceType !== "both" && formData.scent === "no-preference") {
      setFormData((prev) => ({ ...prev, scent: "none" }));
    }
  }, [formData.serviceType, formData.scent, setFormData]);

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div className="space-y-2">
        <Label>Service Type *</Label>
        <Select
          value={formData.serviceType}
          onValueChange={(value: "both" | "interior" | "exterior") => {
            setFormData((prev) => ({ ...prev, serviceType: value }));
            handleBlur("serviceType");
          }}
        >
          <SelectTrigger
            className={cn(
              "w-full",
              showError("serviceType") && "border-destructive"
            )}
          >
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Full Detail (Interior & Exterior)</SelectItem>
            <SelectItem value="interior">Interior Only</SelectItem>
            <SelectItem value="exterior">Exterior Only</SelectItem>
          </SelectContent>
        </Select>
        {showError("serviceType") && (
          <p className="text-sm text-destructive">{errors.serviceType}</p>
        )}
      </div>

      {/* Preferred Scent */}
      <div className="space-y-2">
        <Label>Preferred Scent *</Label>
        <Select
          value={formData.scent}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, scent: value }));
            handleBlur("scent");
          }}
        >
          <SelectTrigger
            className={cn(
              "w-full",
              showError("scent") && "border-destructive"
            )}
          >
            <SelectValue placeholder="Select a scent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {formData.serviceType === "both" && (
              <SelectItem value="no-preference">No Preference</SelectItem>
            )}
            {scentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              scents.map((s) => (
                <SelectItem key={s.id} value={s.name.toLowerCase()}>
                  {s.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {showError("scent") && (
          <p className="text-sm text-destructive">{errors.scent}</p>
        )}
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label htmlFor="photos">Photos (optional)</Label>
        <Input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, photos: e.target.files }))
          }
          className="cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          Upload photos of any areas that need special attention
        </p>
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests (optional)</Label>
        <Textarea
          id="specialRequests"
          placeholder="Any specific areas of concern, stains, pet hair, etc."
          value={formData.specialRequests}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))
          }
          rows={4}
        />
      </div>
    </div>
  );
}
