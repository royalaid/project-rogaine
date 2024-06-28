import { ethers } from "ethers";
import { IERC20, IWETH } from "../../typechain-types";

function sqrt(value: bigint): bigint {
  return BigInt(Math.floor(Math.sqrt(Number(value))));
}

interface TokenReserve {
  token: IERC20 | IWETH;
  reserve: bigint;
}

export async function calculateSwapAmount(
  token1: TokenReserve,
  token2: TokenReserve
): Promise<{
  amount: bigint;
  tokenToSwap: IERC20 | IWETH;
  tokenToReceive: IERC20 | IWETH;
}> {
  const targetReserve = sqrt(token1.reserve * token2.reserve);
  const diff1 = token1.reserve - targetReserve;
  const diff2 = token2.reserve - targetReserve;
  // console.log({
  //   diff1: ethers.formatEther(diff1),
  //   token1: await token1.token.symbol(),
  //   diff2: ethers.formatEther(diff2),
  //   token2: await token2.token.symbol(),
  // });

  return diff1 > 0n
    ? { amount: diff1, tokenToSwap: token1.token, tokenToReceive: token2.token }
    : {
        amount: diff2,
        tokenToSwap: token2.token,
        tokenToReceive: token1.token,
      };
}
