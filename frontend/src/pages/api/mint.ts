// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type TransactionResponse = {
  chainId: string;
  method: string;
  params: {
    abi: any[];
    to: string;
    data: string;
    value: string;
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransactionResponse>,
) {
  if (req.method === 'POST') {
    const { address } = req.body; // Assuming the address of the connected wallet is sent in the request body

    // Example response for a transaction request
    res.status(200).json({
      chainId: "eip155:10",
      method: "eth_sendTransaction",
      params: {
        abi: [], // The ABI would be dynamically generated based on the contract and method being called
        to: "0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D",
        data: "0x783a112b0000000000000000000000000000000000000000000000000000000000000e250000000000000000000000000000000000000000000000000000000000000001",
        value: "984316556204476",
      },
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
