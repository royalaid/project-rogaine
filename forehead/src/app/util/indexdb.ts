import { useEffect } from "react";
import setupIndexedDB, { useIndexedDBStore } from "use-indexeddb";

const idbName = "ipfs-db";
const uploadStoreName = "uploads";

export const idbConfig = {
  databaseName: idbName,
  version: 1,
  stores: [
    {
      name: uploadStoreName,
      id: { keyPath: "id", autoIncrement: true },
      indices: [
        { name: "filename", keyPath: "name", options: { unique: false } },
        { name: "ipfsHash", keyPath: "IpfsHash", options: { unique: true } },
        { name: "timestamp", keyPath: "Timestamp", options: { unique: false } },
        { name: "pinSize", keyPath: "PinSize" },
      ],
    },
  ],
};

export const useSetupIndexDB = () => {
  useEffect(() => {
    (
      navigator.storage &&
      navigator.storage.persist &&
      navigator.storage.persist()
    ).then((granted) => {
      setupIndexedDB(idbConfig)
        .then(() => console.log("success"))
        .catch((e) => console.error("error / unsupported", e));
      if (granted) {
        console.log("Persistent storage granted");
      } else {
        console.log("Persistent storage not granted");
      }
    });
  }, []);
};

export const useUploadsIndexDB = () => {
  return useIndexedDBStore(uploadStoreName);
};
