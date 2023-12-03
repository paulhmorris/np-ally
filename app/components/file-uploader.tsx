import { useNavigate } from "@remix-run/react";
import { IconCircleCheckFilled, IconCloudUpload } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function FileUploader() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState({
    uploading: false,
    success: false,
    error: "",
  });
  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setUploadStatus((s) => ({ ...s, error: "" }));
      if (!file) {
        setUploadStatus((s) => ({ ...s, error: "No file selected." }));
        return;
      }

      setUploadStatus((s) => ({ ...s, uploading: true }));

      // Get presigned URL
      const response = await fetch("/resources/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      if (!response.ok) {
        setUploadStatus(() => ({ uploading: false, success: false, error: "Error getting upload URL." }));
        return;
      }

      const { signedUrl, s3Key } = (await response.json()) as { signedUrl: string; s3Key: string };

      // Upload file to bucket
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: formData,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        setUploadStatus(() => ({ uploading: false, success: false, error: "Error uploading file." }));
        return;
      }

      // Save receipt to database
      const receiptResponse = await fetch("/resources/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name, s3Key }),
      });

      if (!receiptResponse.ok) {
        setUploadStatus(() => ({
          uploading: false,
          success: false,
          error: "Error saving receipt. Your file was uploaded.",
        }));
        return;
      }

      navigate(".", { replace: true });
      setUploadStatus((s) => ({ ...s, success: true, error: "" }));
      setFile(null);
    } catch (error) {
      setUploadStatus(() => ({
        uploading: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    } finally {
      setUploadStatus((s) => ({ ...s, uploading: false }));
    }
  }

  return (
    <>
      <form
        method="post"
        onSubmit={handleFileUpload}
        encType="multipart/form-data"
        className="flex items-start gap-4"
        aria-describedby="receipts-label upload-error"
      >
        <div className="flex h-10 w-auto items-center">
          <Label htmlFor="file" className="sr-only">
            Receipt
          </Label>
          <Input
            id="file"
            name="file"
            type="file"
            className="cursor-pointer hover:bg-muted"
            disabled={uploadStatus.uploading || uploadStatus.success}
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setFile(files[0]);
              }
            }}
          />
        </div>
        {uploadStatus.success ? (
          <div className="flex h-10 items-center gap-1 text-green-700">
            <span className="text-sm font-medium">Success!</span>
            <IconCircleCheckFilled className="h-5 w-5" />
          </div>
        ) : (
          <Button
            disabled={uploadStatus.uploading || !file}
            variant="outline"
            type="submit"
            className="flex w-auto items-center gap-2 shadow-none"
          >
            <span>Upload</span>
            <IconCloudUpload className="h-4 w-4" />
          </Button>
        )}
      </form>
      {uploadStatus.error ? (
        <p className="mt-0.5 text-xs font-medium text-destructive" role="alert" id="upload-error">
          {uploadStatus.error}
        </p>
      ) : null}
    </>
  );
}
