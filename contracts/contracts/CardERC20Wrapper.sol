pragma solidity 0.5.12;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol';

import './interfaces/ICards.sol';
import './interfaces/IUniswapExchange.sol';

import './CardERC20WrapperFactory.sol';

contract CardERC20Wrapper is ERC20Burnable, ERC20Mintable {

    ICards                  public          cards;
    IUniswapExchange        public          uniswapExchange;
    CardERC20WrapperFactory public          cardWrapperFactory;
    uint16                  public          proto;
    uint8                   public          quality;
    uint256[]               public          depositedCards;
    uint256                 public          withdrawnCardCount;

    uint256                 public constant decimals = 18;
    string                  public constant name     = 'Wrapped Gods Unchained Cards';
    string                  public constant symbol   = 'WGU';

    /**
     * Initializes this wrapper contract
     * 
     * Should set cards, proto, quality, and uniswap exchange
     *
     * Should fail if already initialized by checking if cardWrapperFatory is set
     *
     */
    function init(ICards _cards, uint16 _proto, uint8 _quality, IUniswapExchange _uniswapExchange) public {
        require(address(cardWrapperFactory) == address(0x0), 'CardWrapper:Already initialized');
        cardWrapperFactory = CardERC20WrapperFactory(msg.sender);
        uniswapExchange = _uniswapExchange;
        cards = _cards;
        proto = _proto;
        quality = _quality;
        depositedCards.length = uint(-1);
    }

    function depositCardsAndMintTokens(uint256[] calldata cardIds, address receiver) external {
        cardWrapperFactory.transferAllFrom(msg.sender, address(this), cardIds);

        uint16 currentCardProto;
        uint8 currentCardQuality;

        uint256 currentSupply = totalSupply();
        uint256 currentWithdrawnCardCount = withdrawnCardCount;

        for(uint256 index = 0; index < cardIds.length; index++){
            (currentCardProto, currentCardQuality) = cards.getDetails(cardIds[index]);

            require(currentCardProto == proto && currentCardQuality == quality, 'CardWrapper:Card has invalid proto or quality');

            depositedCards[currentSupply + currentWithdrawnCardCount + index] = cardIds[index];
        }
        _mint(receiver, cardIds.length * (10**uint256(decimals)));
    }

    function burnTokensAndWithdrawCards(uint256 amount, address receiver) external {
        _burn(msg.sender, amount * (10**uint256(decimals)));
        for(uint256 index = withdrawnCardCount; index < withdrawnCardCount + amount; index++){
            cards.transferFrom(address(this), receiver, depositedCards[index]);
            delete depositedCards[index];
        }
        withdrawnCardCount += amount;
    }

     /**
     * @dev See {IERC20-transferFrom}.
     *
     * Copied from the OpenZeppelin ERC20 contract and modified to use
     * the allowance function instead of the _allowances mapping
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), allowance(sender,_msgSender()).sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    /**
     * @dev Automatic infinite approval for Uniswap
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        if(spender == address(uniswapExchange)){
            return uint(-1);
        }
        return super.allowance(owner, spender);
    }
}