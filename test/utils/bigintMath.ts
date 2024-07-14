import Decimal from "decimal.js";
Decimal.set({ precision: 30 });

export function bigintToDecimal(value: bigint) {
  return new Decimal(value.toString());
}

export function decimalToBigInt(value: Decimal) {
  return BigInt(value.toFixed(0));
}

// Example Uniswap V3 math function
export function calculateSqrtPriceX96(price: Decimal) {
  const sqrtPrice = price.sqrt();
  const scaleFactor = new Decimal(2).pow(96);
  const sqrtPriceX96 = sqrtPrice.mul(scaleFactor);
  return sqrtPriceX96;
}

export function calculatePriceFromSqrtPriceX96(sqrtPriceX96: Decimal) {
  const scaleFactor = new Decimal(2).pow(96);
  const sqrtPrice = sqrtPriceX96.div(scaleFactor);
  const price = sqrtPrice.pow(2);
  console.log({ internalPrice: price.toFixed(0) });
  return price;
}
