const CardERC20WrapperFactory = artifacts.require('CardERC20WrapperFactory')
const CardERC20Wrapper = artifacts.require('CardERC20Wrapper')
const CARDS = '0x0e3a2a1f2146d86a604adc220b4967a898d7fe07'
const UNISWAP_FACTORY = '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'
module.exports = function (deployer) {
  deployer.deploy(CardERC20WrapperFactory, CardERC20Wrapper.address, CARDS, UNISWAP_FACTORY)
};
