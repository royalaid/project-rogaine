"use server";
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
    const resData = await res.json();
    console.log({ resData });
  } catch (error) {
    console.log(error);
  }
}
