import fs from "fs/promises";
import path from "path";
import prettier from "prettier";
import { SilentWallet } from "../silentWallet";

const INIT_CONFIG = {
  rpcUrl:
    "https://api.stackup.sh/v1/node/b92ecc803a5eea0376e9a82a5960367f1ae2dd40ec26fa3678bc07fa09d75ab3",
  paymaster: {
    rpcUrl:
      "https://api.stackup.sh/v1/node/b92ecc803a5eea0376e9a82a5960367f1ae2dd40ec26fa3678bc07fa09d75ab3",
    context: {},
  },
};
const CONFIG_PATH = path.resolve(__dirname, "../config.json");

async function main() {
  // performKeygen()

  const silentSigner = await SilentWallet.generate();

  return fs.writeFile(
    CONFIG_PATH,
    await prettier.format(
      JSON.stringify({ ...INIT_CONFIG, ...silentSigner }, null, 2),
      { parser: "json" }
    )
  );
}

main()
  .then(() => console.log(`Config written to ${CONFIG_PATH}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
