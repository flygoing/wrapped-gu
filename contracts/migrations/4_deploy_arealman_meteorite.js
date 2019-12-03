const CardERC20WrapperFactory = artifacts.require('CardERC20WrapperFactory')

module.exports = async function (deployer) {
  let factory = await CardERC20WrapperFactory.deployed()
  await factory.createWrapper(126, 4)
};
