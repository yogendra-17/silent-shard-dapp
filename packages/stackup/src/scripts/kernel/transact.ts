import { Client, Presets } from "userop";
import { ethers } from "ethers";
import { CLIOpts, createCalls } from "../../src";
// @ts-ignore
import config from "../../config.json";
import { SilentWallet } from "../../silentWallet";

export default async function main(opts: CLIOpts): Promise<void> {
  const calls = await createCalls(
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  );

  console.log(`Building UserOperation...`);
  const paymasterMiddleware = opts.withPM
    ? Presets.Middleware.verifyingPaymaster(
        config.paymaster.rpcUrl,
        config.paymaster.context
      )
    : undefined;
  const kernel = await Presets.Builder.Kernel.init(
    new SilentWallet(config.address,config.public_key,config.p1KeyShare,config.keygenResult),
    config.rpcUrl,
    { paymasterMiddleware, overrideBundlerRpc: opts.overrideBundlerRpc }
  );
  const client = await Client.init(config.rpcUrl, {
    overrideBundlerRpc: opts.overrideBundlerRpc,
  });

  const res = await client.sendUserOperation(
    calls.length === 1 ? kernel.execute(calls[0]) : kernel.executeBatch(calls),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
