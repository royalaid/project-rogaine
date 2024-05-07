pragma solidity ^0.8.24;

interface IAEROTrader {
    function ETHER() external view returns (address);
    function UNSAFE_swapExactTokensForTokens(uint256[] calldata amounts, Route[] calldata routes, address to, uint256 deadline) external returns (uint256[] memory);
    function addLiquidity(address tokenA, address tokenB, bool stable, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
    function addLiquidityETH(address token, bool stable, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
    function defaultFactory() external view returns (address);
    function factoryRegistry() external view returns (address);
    function generateZapInParams(address tokenA, address tokenB, bool stable, address _factory, uint256 amountInA, uint256 amountInB, Route[] calldata routesA, Route[] calldata routesB) external view returns (uint256 amountOutMinA, uint256 amountOutMinB, uint256 amountAMin, uint256 amountBMin);
    function generateZapOutParams(address tokenA, address tokenB, bool stable, address _factory, uint256 liquidity, Route[] calldata routesA, Route[] calldata routesB) external view returns (uint256 amountOutMinA, uint256 amountOutMinB, uint256 amountAMin, uint256 amountBMin);
    function getAmountsOut(uint256 amountIn, Route[] calldata routes) external view returns (uint256[] memory amounts);
    function getReserves(address tokenA, address tokenB, bool stable, address _factory) external view returns (uint256 reserveA, uint256 reserveB);
    function isTrustedForwarder(address forwarder) external view returns (bool);
    function poolFor(address tokenA, address tokenB, bool stable, address _factory) external view returns (address pool);
    function quoteAddLiquidity(address tokenA, address tokenB, bool stable, address _factory, uint256 amountADesired, uint256 amountBDesired) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity);
    function quoteRemoveLiquidity(address tokenA, address tokenB, bool stable, address _factory, uint256 liquidity) external view returns (uint256 amountA, uint256 amountB);
    function quoteStableLiquidityRatio(address tokenA, address tokenB, address _factory) external view returns (uint256 ratio);
    function removeLiquidity(address tokenA, address tokenB, bool stable, address _factory, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB);
    function removeLiquidityETH(address token, bool stable, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountToken, uint256 amountETH);
    function removeLiquidityETHSupportingFeeOnTransferTokens(address token, bool stable, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountETH);
    function sortTokens(address tokenA, address tokenB) external pure returns (address token0, address token1);
    function swapExactETHForTokens(uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external payable returns (uint256[] memory amounts);
    function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external payable;
    function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external returns (uint256[] memory amounts);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external;
    function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external returns (uint256[] memory amounts);
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, Route[] calldata routes, address to, uint256 deadline) external;
    function voter() external view returns (address);
    function weth() external view returns (IWETH);

    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }
}


