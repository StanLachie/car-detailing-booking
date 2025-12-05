"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, X, Upload, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_ATTACHMENTS,
} from "@/lib/config";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StepProps, Scent, Attachment } from "./types";

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Failed to load video"));
    video.src = URL.createObjectURL(file);
  });
}

interface FileUploadProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

function FileUpload({ attachments, onAttachmentsChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} files allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const newAttachments: Attachment[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Invalid file type`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: File too large (max ${MAX_FILE_SIZE_MB}MB)`);
          continue;
        }

        // Validate video duration
        if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
          try {
            const duration = await getVideoDuration(file);
            if (duration > MAX_VIDEO_DURATION_SECONDS) {
              toast.error(`${file.name}: Video must be under ${MAX_VIDEO_DURATION_SECONDS} seconds`);
              continue;
            }
          } catch {
            toast.error(`${file.name}: Could not read video duration`);
            continue;
          }
        }

        // Upload file
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(`${file.name}: ${error.error || "Upload failed"}`);
          continue;
        }

        const data = await res.json();
        newAttachments.push({
          url: data.url,
          type: data.type,
          name: data.name,
        });
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div
        className={cn(
          "border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50",
          uploading && "pointer-events-none opacity-50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click to upload photos or videos</span>
          </div>
        )}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.url}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              {attachment.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {attachment.type === "video" && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                  Video
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

      {/* Attachments */}
      <div className="space-y-2">
        <Label>Photos / Videos (optional)</Label>
        <FileUpload
          attachments={formData.attachments}
          onAttachmentsChange={(attachments) =>
            setFormData((prev) => ({ ...prev, attachments }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Upload photos or short videos (under {MAX_VIDEO_DURATION_SECONDS}s) of areas that need attention. Max {MAX_ATTACHMENTS} files.
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
