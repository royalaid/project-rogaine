"use server";
export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function pinFileToIPFS(data: FormData) {
  console.log("Pinning file to IPFS");
  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PINATA_JWT}`,
      },
      body: data,
    });
    const resData: PinataResponse = await res.json();
    console.log({ resData });
    return resData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
