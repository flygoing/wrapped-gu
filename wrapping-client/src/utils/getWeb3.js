import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum, null, { transactionConfirmationBlocks: 1, transactionPollingTimeout: 1200 });
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.WebsocketProvider(
          "wss://mainnet.infura.io/ws/v3/8cba317604d6459b98984d6b8ac7bec6"
        );
        const web3 = new Web3(provider);
        resolve(web3);
      }
    });
  });

export default getWeb3;
