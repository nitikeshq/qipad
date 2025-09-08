import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  onUploadComplete?: (imageUrl: string) => void;
  buttonClassName?: string;
  children?: ReactNode;
  accept?: string;
  maxFiles?: number;
}

/**
 * A simple file upload component for object storage
 * Handles file selection, upload to presigned URL, and returns the uploaded file URL
 */
export function ObjectUploader({
  onUploadComplete,
  buttonClassName,
  children,
  accept = "image/*",
  maxFiles = 1,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Get upload URL from backend
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file to presigned URL
      const fileUploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Extract the object path from the upload URL
      const objectPath = uploadURL.split('?')[0].split('/').slice(-2).join('/');
      const imageUrl = `/objects/${objectPath}`;

      // Set object ACL policy
      const aclResponse = await fetch('/api/objects/acl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadURL,
          visibility: 'public'
        }),
      });

      if (!aclResponse.ok) {
        console.warn('Failed to set ACL policy, but upload succeeded');
      }

      onUploadComplete?.(imageUrl);
      toast({
        title: "Upload successful",
        description: "Image uploaded successfully"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="object-uploader-input"
        disabled={isUploading}
      />
      <label htmlFor="object-uploader-input" className="cursor-pointer">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className={buttonClassName}
          asChild
        >
          <div>
            {isUploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Uploading...
              </>
            ) : children ? (
              children
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </>
            )}
          </div>
        </Button>
      </label>
    </div>
  );
}