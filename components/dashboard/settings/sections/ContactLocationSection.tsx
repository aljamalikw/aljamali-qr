"use client";

import type { RestaurantSettingsData } from "@/lib/dashboard/settings/types";
import {
  SettingsField,
  SettingsSection,
  settingsInputClass,
} from "../ui/SettingsSection";

interface ContactSectionProps {
  contact: RestaurantSettingsData["contact"];
  location: RestaurantSettingsData["location"];
  onContactChange: (contact: RestaurantSettingsData["contact"]) => void;
  onLocationChange: (location: RestaurantSettingsData["location"]) => void;
}

export function ContactLocationSection({
  contact,
  location,
  onContactChange,
  onLocationChange,
}: ContactSectionProps) {
  const updateContact = (
    key: keyof RestaurantSettingsData["contact"],
    value: string,
  ) => onContactChange({ ...contact, [key]: value });

  const updateLocation = (
    key: keyof RestaurantSettingsData["location"],
    value: string,
  ) => onLocationChange({ ...location, [key]: value });

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Contact Information"
        description="How guests and Aljamali QR can reach you."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField label="Phone Number">
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => updateContact("phone", e.target.value)}
              className={settingsInputClass}
              placeholder="+965 2222 3344"
            />
          </SettingsField>
          <SettingsField label="WhatsApp Number">
            <input
              type="tel"
              value={contact.whatsapp}
              onChange={(e) => updateContact("whatsapp", e.target.value)}
              className={settingsInputClass}
              placeholder="96550000000"
            />
          </SettingsField>
          <SettingsField label="Email Address">
            <input
              type="email"
              value={contact.email}
              onChange={(e) => updateContact("email", e.target.value)}
              className={settingsInputClass}
              placeholder="hello@restaurant.com"
            />
          </SettingsField>
          <SettingsField label="Website">
            <input
              type="url"
              value={contact.website}
              onChange={(e) => updateContact("website", e.target.value)}
              className={settingsInputClass}
              placeholder="https://yourrestaurant.com"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Location"
        description="Your restaurant address for guests and maps integration."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField label="Country">
            <input
              type="text"
              value={location.country}
              onChange={(e) => updateLocation("country", e.target.value)}
              className={settingsInputClass}
            />
          </SettingsField>
          <SettingsField label="City">
            <input
              type="text"
              value={location.city}
              onChange={(e) => updateLocation("city", e.target.value)}
              className={settingsInputClass}
            />
          </SettingsField>
          <SettingsField label="Area">
            <input
              type="text"
              value={location.area}
              onChange={(e) => updateLocation("area", e.target.value)}
              className={settingsInputClass}
            />
          </SettingsField>
          <SettingsField label="Street">
            <input
              type="text"
              value={location.street}
              onChange={(e) => updateLocation("street", e.target.value)}
              className={settingsInputClass}
            />
          </SettingsField>
          <SettingsField label="Google Maps URL" className="sm:col-span-2">
            <input
              type="url"
              value={location.mapsUrl}
              onChange={(e) => updateLocation("mapsUrl", e.target.value)}
              className={settingsInputClass}
              placeholder="https://maps.google.com/..."
            />
          </SettingsField>
        </div>
      </SettingsSection>
    </div>
  );
}
