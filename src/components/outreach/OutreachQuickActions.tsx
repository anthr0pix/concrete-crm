"use client";

import { Phone, Mail, Globe, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export default function OutreachQuickActions({
  phone,
  email,
  website,
  address,
  city,
  state,
  zip,
}: Props) {
  const fullAddress = [address, city, state].filter(Boolean).join(", ") +
    (zip ? ` ${zip}` : "");

  const hasAny = phone || email || website || fullAddress.trim();
  if (!hasAny) return null;

  const websiteUrl = website
    ? website.match(/^https?:\/\//)
      ? website
      : `https://${website}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl shadow-sm px-4 py-3 mb-6">
      {phone && (
        <a href={`tel:${phone}`}>
          <Button size="sm" variant="outline">
            <Phone className="w-4 h-4 mr-1.5" /> Call
          </Button>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`}>
          <Button size="sm" variant="outline">
            <Mail className="w-4 h-4 mr-1.5" /> Email
          </Button>
        </a>
      )}
      {websiteUrl && (
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline">
            <Globe className="w-4 h-4 mr-1.5" /> Website
          </Button>
        </a>
      )}
      {fullAddress.trim() && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="sm" variant="outline">
            <Navigation className="w-4 h-4 mr-1.5" /> Directions
          </Button>
        </a>
      )}
    </div>
  );
}
