interface IAero {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        IAero.Route[] calldata routes,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function defaultFactory() external view returns (address);
    
    function ETHER() external view returns (address);

    struct Route {
        address from;
        address to;
        address factory;
    }
}
