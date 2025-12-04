"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { StepProps, AddressSuggestion } from "./types";

export function PersonalDetailsStep({
  formData,
  setFormData,
  errors,
  showError,
  handleBlur,
}: StepProps) {
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced address search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (addressQuery.length < 3) {
      setAddressSuggestions([]);
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/address?q=${encodeURIComponent(addressQuery)}`
        );
        const data = await response.json();
        setAddressSuggestions(data.addresses ?? []);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        setAddressSuggestions([]);
      } finally {
        setAddressLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [addressQuery]);

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          onBlur={() => handleBlur("name")}
          aria-invalid={!!showError("name")}
        />
        {showError("name") && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Mobile */}
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile *</Label>
        <Input
          id="mobile"
          type="tel"
          placeholder="04XX XXX XXX"
          value={formData.mobile}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, mobile: e.target.value }))
          }
          onBlur={() => handleBlur("mobile")}
          aria-invalid={!!showError("mobile")}
        />
        {showError("mobile") && (
          <p className="text-sm text-destructive">{errors.mobile}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label>Address *</Label>
        <Popover open={addressOpen} onOpenChange={setAddressOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={addressOpen}
              aria-invalid={!!showError("address")}
              className={cn(
                "w-full justify-between font-normal",
                showError("address") && "border-destructive"
              )}
              onClick={() => handleBlur("address")}
            >
              <span className="truncate">
                {formData.address || "Search for your address..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type your address..."
                value={addressQuery}
                onValueChange={setAddressQuery}
              />
              <CommandList>
                {addressLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {!addressLoading &&
                  addressQuery.length >= 3 &&
                  addressSuggestions.length === 0 && (
                    <CommandEmpty>No addresses found.</CommandEmpty>
                  )}
                {!addressLoading && addressQuery.length < 3 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type at least 3 characters to search
                  </div>
                )}
                {!addressLoading && addressSuggestions.length > 0 && (
                  <CommandGroup>
                    {addressSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.value}
                        value={suggestion.label}
                        onSelect={() => {
                          setFormData((prev) => ({
                            ...prev,
                            address: suggestion.label,
                          }));
                          setAddressOpen(false);
                          setAddressQuery("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.address === suggestion.label
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="truncate">{suggestion.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {showError("address") && (
          <p className="text-sm text-destructive">{errors.address}</p>
        )}
        <p className="text-xs text-muted-foreground">
          We generally only service the Sunshine Coast area
        </p>
      </div>

      {/* Returning Customer */}
      <div className="space-y-2">
        <Label>Returning Customer?</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.returningCustomer ? "default" : "outline"}
            onClick={() =>
              setFormData((prev) => ({ ...prev, returningCustomer: true }))
            }
            className="flex-1"
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!formData.returningCustomer ? "default" : "outline"}
            onClick={() =>
              setFormData((prev) => ({ ...prev, returningCustomer: false }))
            }
            className="flex-1"
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
}
