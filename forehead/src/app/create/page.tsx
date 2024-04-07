"use client";

import { Title } from "@/app/components/text";
import { PinataResponse, pinFileToIPFS } from "@/app/create/upload";
import { useUploadedFiles } from "@/app/util/localstorage";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

function Mint() {
  const [uploads, setUploads] = useUploadedFiles<PinataResponse>();
  const [files] = useState<FormData>(new FormData());
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showAllPrevUploads, setShowAllPrevUploads] = useState(false);
  const onDrop = (acceptedFiles: File[]) => {
    files.set("file", acceptedFiles[0]);
    const file = acceptedFiles[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setImageSrc(fileUrl);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items ?? [];
      debugger;
      for (let index in items) {
        let item = items[index];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (!file) return;
          const blob = new Blob([file], { type: file.type });
          files.set("file", blob);
          const fileUrl = URL.createObjectURL(file);
          setImageSrc(fileUrl);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      // Add other image MIME types as needed
    },
  });

  return (
    <div className="container items-center gap-3">
      <Title className="mx-auto ">Create</Title>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {imageSrc ? (
          <div className="flex h-full w-full justify-center">
            <img
              className="h-fit w-fit justify-self-center object-contain"
              src={imageSrc}
              alt="Preview"
            />
          </div>
        ) : (
          <div className="flex h-80 w-full items-center justify-center border-2 border-dashed border-black bg-gray-500 ">
            <p className="p-3">
              {isDragActive
                ? "Drop the files here ..."
                : "Drag 'n' drop some files here, or click to select files"}
            </p>
          </div>
        )}
      </div>
      <button
        className="buy-button"
        onClick={async () => {
          console.log("Pin File to IPFS");
          const res = pinFileToIPFS(files);
          void toast.promise(res, {
            pending: "Pinning file to IPFS",
            success: "File pinned to IPFS",
            error: "Failed to pin file to IPFS",
          });
          setUploads([await res]);
          console.log("Done");
        }}
      >
        Pin File to IPFS
      </button>
      <button
        className="buy-button"
        onClick={() => {
          setShowAllPrevUploads(!showAllPrevUploads);
        }}
      >
        {!showAllPrevUploads ? "Show" : "Hide"} prev uploads
      </button>
      <div
        className={`${showAllPrevUploads ? "flex" : "hidden"} w-full flex-col items-center`}
      >
        {uploads.map((upload, idx) => {
          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(upload.IpfsHash);
              toast("Copied to clipboard", { type: "success" });
              console.log("Image URL copied to clipboard");
            } catch (err) {
              console.log("Failed to copy: ", err);
            }
          };

          return (
            <div key={upload.IpfsHash}>
              <img
                onClick={handleCopy}
                alt={`Image number ${idx}`}
                src={`https://ipfs.io/ipfs/${upload.IpfsHash}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Mint;
