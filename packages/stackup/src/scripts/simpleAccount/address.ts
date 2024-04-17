import { ethers } from "ethers";
import { Presets } from "userop";
import { SilentWallet } from "../../silentWallet";

export default async function smartContractAddress() {
  // Access the storage to retrieve the SilentShareStorage object
  const storageKey = 'SilentShare1';
  const storageDataString = localStorage.getItem(storageKey);
  if (!storageDataString) {
    console.error("No storage data found");
    return;
  }

  // Parse the JSON string to an object
  const storageData = JSON.parse(storageDataString);
  const newPairingState = storageData.newPairingState;
  const distributedKey = newPairingState.distributedKey;

  // Assuming these fields exist in your retrieved storage data
  const address = distributedKey.publicKey; // Adjust field access as necessary
  const publicKey = distributedKey.publicKey; // This might be the same or different depending on your storage structure
  const p1KeyShare = distributedKey.keyShareData.x1;
  const keygenResult = JSON.stringify(distributedKey); // You might want to structure this differently depending on needs
  
  // Initialize SilentWallet with retrieved configuration
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new SilentWallet(address, publicKey, p1KeyShare, keygenResult),
    "https://api.stackup.sh/v1/paymaster/b92ecc803a5eea0376e9a82a5960367f1ae2dd40ec26fa3678bc07fa09d75ab3"
  );

  // Get the address of the SimpleAccount
  const simpleAccountAddress = simpleAccount.getSender();
  console.log(`SimpleAccountyogi address: ${simpleAccountAddress}`);

  return simpleAccountAddress;
}
