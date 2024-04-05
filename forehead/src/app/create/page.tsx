"use client";

import { pinFileToIPFS } from "@/app/create/upload";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

function Mint() {
  const [files] = useState<FormData>(new FormData());
  const [filess, setFiless] = useState<File[]>([]);
  const onDrop = (acceptedFiles: File[]) => {
    files.set("file", acceptedFiles[0]);
    setFiless((fs) => fs.concat(acceptedFiles));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });
  return (
    <div className="container">
      <h1>Create</h1>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : filess.length > 0 ? (
          <p>
            {filess.map((f) => (
              <span key={f.name}>{f.name}</span>
            ))}
          </p>
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
