import { ethers } from "ethers";
import { Presets } from "userop";
// @ts-ignore
import config from "../../config.json";
import { SilentWallet } from "../../silentWallet";

export default async function main() {
  const kernel = await Presets.Builder.Kernel.init(
    new SilentWallet(config.address,config.public_key,config.p1KeyShare,config.keygenResult),

    config.rpcUrl
  );
  const address = kernel.getSender();

  console.log(`Kernel address: ${address}`);
}
