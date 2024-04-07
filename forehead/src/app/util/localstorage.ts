import _ from "lodash";
import { useLocalStorage } from "usehooks-ts";

export function useUploadedFiles<T>() {
  const [uploadedFiles, setUploadedFiles] = useLocalStorage<T[]>(
    "uploadedFiles",
    [],
  );
  return [
    uploadedFiles,
    (x: T[]) =>
      setUploadedFiles((old) => {
        return _.uniqBy([...old, ...x], "IpfsHash");
      }),
  ] as const;
}
