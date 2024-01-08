export const checkMetaMaskInstallation = async (
  handleMmConnectTimeout: () => void
) => {
  const leastSupportedMetaMaskVersion = "10.34.4";
  let isMmStillConnect;
  try {
    // if MetaMask is installed, it should respond within 1000ms.
    // This logic handles the case where MetaMask is uninstalled while using the Snap.
    // MetaMask doesn't expose API to notify if its uninstalled or not. Ref: https://github.com/MetaMask/metamask-extension/issues/5936
    isMmStillConnect = setTimeout(() => {
      handleMmConnectTimeout();
    }, 1000);

    const providerName = await window.ethereum.request({
      method: "web3_clientVersion",
    });
    clearTimeout(isMmStillConnect);
    if (!providerName.includes("MetaMask")) {
      return {
        isMetaMaskInstalled: false,
      };
    }
    const currentMetaMaskVersion = providerName
      .split("/")[1]
      .slice(1) as string;
    return {
      isMetaMaskInstalled: true,
      leastSupportedMetaMaskVersion,
      currentMetaMaskVersion,
    };
  } catch (error) {
    clearTimeout(isMmStillConnect);
    return {
      isMetaMaskInstalled: false,
    };
  }
};
