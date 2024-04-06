"use client";

import { Title } from "@/app/components/text";
import { pinFileToIPFS } from "@/app/create/upload";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

function Mint() {
  const [files] = useState<FormData>(new FormData());
  const [imageSrc, setImageSrc] = useState<string | null>(null);
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

    console.log("Adding paste event listener");
    window.addEventListener("paste", handlePaste);
    console.log("Added paste event listener");

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
    <div className="container">
      <Title className="mx-auto ">Create</Title>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : imageSrc ? (
          <div className="flex h-full w-full justify-center">
            <img
              className="h-fit w-fit justify-self-center object-contain"
              src={imageSrc}
              alt="Preview"
            />
          </div>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <button
        className="buy-button"
        onClick={async () => {
          console.log("Pin File to IPFS");
          console.log(pinFileToIPFS);
          await pinFileToIPFS(files);
          console.log("Done");
        }}
      >
        Pin File to IPFS
      </button>
    </div>
  );
}

export default Mint;
