const CardERC20Wrapper = artifacts.require('CardERC20Wrapper');

module.exports = function (deployer) {
  deployer.deploy(CardERC20Wrapper);
};
