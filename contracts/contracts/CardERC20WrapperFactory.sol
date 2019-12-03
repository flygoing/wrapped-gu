pragma solidity 0.5.12;

import '@optionality.io/clone-factory/contracts/CloneFactory.sol';

import './interfaces/IUniswapFactory.sol';
import './interfaces/ICards.sol';
import './interfaces/IUniswapExchange.sol';

import './CardERC20Wrapper.sol';

contract CardERC20WrapperFactory is CloneFactory {

    // State
    address public target;
    ICards public cards;
    IUniswapFactory public uniswapFactory;
    mapping(uint16 => mapping(uint8 => address)) _protoQualityToTokenAddress;
    mapping(address => bool) _validWrapperAddresses;
    // Events
    event WrapperCreated(uint16 indexed proto, uint8 indexed quality, address indexed tokenAddress);

    constructor(address _target, ICards _cards, IUniswapFactory _uniswapFactory) public {
        target = _target;
        cards = _cards;
        uniswapFactory = _uniswapFactory;
    }

    function createWrapper(uint16 proto, uint8 quality) external {
        require(getWrapperAddress(proto, quality) == address(0x0), 'Factory:Wrapper is already created');

        CardERC20Wrapper newCardWrapper = CardERC20Wrapper(createClone(target));

        address uniswapExchange = uniswapFactory.getExchange(address(newCardWrapper));

        _protoQualityToTokenAddress[proto][quality] = address(newCardWrapper);
        _validWrapperAddresses[address(newCardWrapper)] = true;

        if(uniswapExchange == address(0x0)){
            uniswapExchange = uniswapFactory.createExchange(address(newCardWrapper));
        }

        newCardWrapper.init(cards, proto, quality, IUniswapExchange(uniswapExchange));

        emit WrapperCreated(proto, quality, address(newCardWrapper));
    }

    function getWrapperAddress(uint16 proto, uint8 quality) public view returns (address) {
        return _protoQualityToTokenAddress[proto][quality];
    }

    function isValidWrapper(address wrapper) public view returns (bool) {
        return _validWrapperAddresses[wrapper];
    }

    function transferAllFrom(address from, address to, uint256[] memory cardIds) public {
        require(isValidWrapper(msg.sender), 'CardWrapperFactory:Sender is not a valid wrapper');
        cards.transferAllFrom(from, to, cardIds);
    }

}