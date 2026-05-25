"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.8,
};

interface Props {
  jobId: string;
  photoCount: number;
  onDone?: () => void;
}

export default function CrewPhotoUpload({ jobId, photoCount, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      toast.error("Only JPEG, PNG, WebP, and HEIC photos are allowed");
      return;
    }

    setUploading(true);
    try {
      setProgress("Compressing...");
      const compressed = await imageCompression(file, {
        ...COMPRESSION_OPTIONS,
        onProgress: (pct) => setProgress(`Compressing ${pct}%`),
      });

      setProgress("Uploading...");
      const supabase = createClient();
      const path = `${jobId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from("job-photos").upload(path, compressed, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("job-photos").getPublicUrl(path);

      const res = await fetch(`/api/jobs/${jobId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl, isBefore: false }),
      });
      if (!res.ok) throw new Error("Failed to save photo");

      toast.success("Photo uploaded");
      onDone?.();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        <Camera className="w-4 h-4 mr-1.5" />
        {progress ?? `Photo${photoCount > 0 ? ` (${photoCount})` : ""}`}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
    </div>
  );
}
