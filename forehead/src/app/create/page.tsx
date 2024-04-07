"use client";

import { Title } from "@/app/components/text";
import { ROGAINE_ADDRESS } from "@/app/constants";
import { PinataResponse, pinFileToIPFS } from "@/app/create/upload";
import { useUploadedFiles } from "@/app/util/localstorage";
import { useWriteRogaineCreateMemeFor } from "@/generated";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";

function MintContractInteraction() {
  const account = useAccount();
  const { data: balanceRes } = useBalance({ address: account.address });
  const [ipfsHash, setIpfsHash] = useState("");
  const { error, writeContractAsync, isPending, isError } =
    useWriteRogaineCreateMemeFor();
  const { address } = account;
  if (!address) return <div>Connect Wallet</div>;
  console.log({ error });
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h1>Write Contract</h1>
      <h2>{balanceRes?.formatted}</h2>
      {isPending ? <h1>Pending...</h1> : null}
      {isError ? (
        <>
          <h1>Error...</h1>
          <p>{error?.message}</p>
        </>
      ) : null}
      <input value={ipfsHash} onChange={(e) => setIpfsHash(e.target.value)} />
      <button
        className="buy-button"
        onClick={() => {
          const txPromise = writeContractAsync({
            address: ROGAINE_ADDRESS,
            args: [address, ipfsHash, 1n],
            value: parseEther("0.01"),
          });
          void toast.promise(txPromise, {
            pending: "Creating Meme",
            success: "Meme Created",
            error: "Failed to create meme",
          });
        }}
      >
        Write Contract
      </button>
    </div>
  );
}

function Mint() {
  const [isClient, setIsClient] = useState(false);
  const [uploads, setUploads] = useUploadedFiles<PinataResponse>();
  const [files] = useState<FormData>(new FormData());
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showAllPrevUploads, setShowAllPrevUploads] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

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
      <MintContractInteraction />
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
        {isClient &&
          uploads.map((upload, idx) => {
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
