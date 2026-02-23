"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JobPhoto } from "@prisma/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,          // target ≤ 500 KB
  maxWidthOrHeight: 1200,   // shrink anything larger than 1200px
  useWebWorker: true,
  fileType: "image/jpeg",   // normalize everything to JPEG (HEIC included)
  initialQuality: 0.8,
};

interface Props {
  jobId: string;
  photos: JobPhoto[];
}

export default function PhotoUpload({ jobId, photos }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [isBefore, setIsBefore] = useState(true);

  const upload = async (file: File) => {
    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      toast.error("Only JPEG, PNG, WebP, and HEIC photos are allowed");
      return;
    }

    setUploading(true);
    try {
      // Compress / resize
      setProgress("Compressing...");
      const compressed = await imageCompression(file, {
        ...COMPRESSION_OPTIONS,
        onProgress: (pct) => setProgress(`Compressing ${pct}%`),
      });

      // Upload to Supabase Storage
      setProgress("Uploading...");
      const supabase = createClient();
      const path = `${jobId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from("job-photos").upload(path, compressed, {
        contentType: "image/jpeg",
        cacheControl: "31536000", // 1 year — photos don't change
        upsert: false,
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("job-photos").getPublicUrl(path);

      // Save URL to DB
      const res = await fetch(`/api/jobs/${jobId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl, isBefore }),
      });
      if (!res.ok) throw new Error("Failed to save photo");

      const originalKB = Math.round(file.size / 1024);
      const compressedKB = Math.round(compressed.size / 1024);
      toast.success(`Uploaded (${originalKB}KB → ${compressedKB}KB)`);
      router.refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const deletePhoto = async (photoId: string) => {
    await fetch(`/api/jobs/${jobId}/photos?photoId=${photoId}`, { method: "DELETE" });
    toast.success("Photo removed");
    router.refresh();
  };

  const beforePhotos = photos.filter((p) => p.isBefore);
  const afterPhotos = photos.filter((p) => !p.isBefore);

  return (
    <div className="space-y-6">
      {/* Upload controls */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setIsBefore(true)}
            className={`px-4 py-1.5 text-sm font-medium ${isBefore ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
          >
            Before
          </button>
          <button
            onClick={() => setIsBefore(false)}
            className={`px-4 py-1.5 text-sm font-medium ${!isBefore ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
          >
            After
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          {progress ?? "Upload Photo"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
        <span className="text-xs text-slate-400">JPEG, PNG, WebP, HEIC</span>
      </div>

      {/* Before / After grid */}
      {[{ label: "Before", list: beforePhotos }, { label: "After", list: afterPhotos }].map(({ label, list }) => (
        <div key={label}>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">{label} Photos</h3>
          {list.length === 0 ? (
            <p className="text-sm text-slate-300 italic">No {label.toLowerCase()} photos yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {list.map((photo) => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-square bg-slate-100">
                  <Image src={photo.url} alt={photo.caption ?? label} fill className="object-cover" />
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {photo.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1">{photo.caption}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
