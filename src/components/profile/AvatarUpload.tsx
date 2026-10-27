import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { acceptFor, validateUpload } from "@/lib/uploads/limits";
import { prepareAndValidate } from "@/lib/uploads/prepare";
import { describeStorageFailure, describeUnreadableFile, describeUploadViolation, type UploadNotice } from "@/lib/uploads/notices";
import { UploadErrorAlert } from "@/components/uploads/UploadErrorAlert";

interface AvatarUploadProps {
  currentUrl: string | null;
  userId: string;
  onUpload: (url: string) => void;
}

const CROP_SIZE = 400;

function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, CROP_SIZE, CROP_SIZE);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
        "image/jpeg",
        0.9
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export const AvatarUpload = ({ currentUrl, userId, onUpload }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<UploadNotice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const showError = (notice: UploadNotice) => setUploadError(notice);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    const prepared = await prepareAndValidate('avatar', file);
    if (prepared.ok === false) {
      showError(prepared);
      return;
    }

    setUploading(true);
    try {
      const cropped = await cropToSquare(prepared.file);
      const croppedFile = new File([cropped], "avatar.jpg", { type: "image/jpeg" });
      const violation = validateUpload('avatar', croppedFile);
      if (violation) {
        showError(describeUploadViolation('avatar', violation));
        return;
      }

      const filePath = `${userId}/avatar.jpg`;

      const { error: quotaError } = await supabase.rpc('reserve_storage_upload', {
        p_bucket: 'avatars',
        p_object_name: filePath,
      });
      if (quotaError) {
        showError(describeStorageFailure('avatar', quotaError));
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedFile, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) {
        await supabase.rpc('release_storage_upload', {
          p_bucket: 'avatars',
          p_object_name: filePath,
        });
        showError(describeStorageFailure('avatar', uploadError));
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl } as any)
        .eq("userid", userId);

      if (updateError) {
        showError(describeStorageFailure('avatar', updateError));
        return;
      }

      onUpload(publicUrl);
      toast({ title: "Profile photo updated" });
    } catch {
      showError(describeUnreadableFile('avatar'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-border">
          {currentUrl ? (
            <AvatarImage src={currentUrl} alt="Profile avatar" />
          ) : null}
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptFor('avatar')}
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP · Max 2 MB</p>
      <UploadErrorAlert notice={uploadError} onDismiss={() => setUploadError(null)} />
    </div>
  );
};
