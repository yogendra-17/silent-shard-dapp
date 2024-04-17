import { ethers } from "ethers";
import { IP1KeyShare } from "@silencelaboratories/ecdsa-tss";
import * as utils from './mpc/utils';

import * as index from "./mpc/index";
import { hexlify } from "@ethersproject/bytes";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import {
  Signer,
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { keccak256 } from "@ethersproject/keccak256";
import {
  BytesLike,
  hexZeroPad,
  joinSignature,
  Signature,
  splitSignature,
} from "@ethersproject/bytes";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import { serialize, UnsignedTransaction } from "@ethersproject/transactions";
import { hashMessage, _TypedDataEncoder } from "@ethersproject/hash";
import { stringify } from "querystring";
import { _toUtf8String } from "@ethersproject/strings/lib/utf8";
import { concat, toUtf8Bytes } from "ethers/lib/utils";

export class SilentWallet extends Signer {
  public address: string;
  public public_key: string;

  private p1KeyShare: IP1KeyShare;
  readonly provider?: ethers.providers.Provider;
  keygenResult: any;

  constructor(
    address: string,
    public_key: string,
    p1KeyShare: any,
    keygenResult: any,
    provider?: Provider
  ) {
    super();

    this.address = address;
    this.public_key = public_key;
    this.p1KeyShare = p1KeyShare;
    this.provider = provider;
    this.keygenResult = keygenResult;
  }

  public static async generate(): Promise<SilentWallet> {
    await index.initPairing();
    await index.runPairing();
    const keygenResult = await index.runKeygen();
    await index.runBackup();
    const p1KeyShare: IP1KeyShare = keygenResult.distributedKey.keyShareData;
    if (!p1KeyShare) {
      throw new Error("Failed to generate p1KeyShare");
    }

    const publicKey = p1KeyShare.public_key;
    const address = ethers.utils.computeAddress(`0x04${publicKey}`);
    return new SilentWallet(address, publicKey, p1KeyShare, keygenResult);
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signMessage(message: ethers.utils.Bytes): Promise<string> {
    const messagePrefix = "\x19Ethereum Signed Message:\n";

    const messageDigest = hashMessage(message);
    const messageSome = concat([
      toUtf8Bytes(messagePrefix),
      toUtf8Bytes(String(message.length)),
      message
  ])

  const hexMessage = hexlify(messageSome)


    // console.log("message",message)
    // console.log("messageSo",messagesome)
    // console.log("messageDigest",messageDigest)
    const signSdk = await index.runSign(
      "keccak256",
      hexMessage,
      messageDigest,
      "eth_sign",
      this.keygenResult.distributedKey.accountId,
      this.keygenResult.distributedKey.keyShareData
    );

    const signBytes = Buffer.from(signSdk.signature, "hex");
    const r = signBytes.subarray(0, 32);
    const s = signBytes.subarray(32, 64);
    const recid = signSdk.recId;

    const split = splitSignature({
      recoveryParam: recid,
      r: hexZeroPad(`0x${r.toString("hex")}`, 32),
      s: hexZeroPad(`0x${s.toString("hex")}`, 32),
    });

    const signedMsg = joinSignature(split);

    return signedMsg;
  }
  async signTransaction(transaction: TransactionRequest): Promise<string> {
    console.log("running signtransaction");
    return resolveProperties(transaction).then(async (tx) => {
      if (tx.from != null) {
        if (getAddress(tx.from) !== this.address) {
          throw new Error(
            `transaction from address mismatch (from:${tx.from} address:${this.address})`
          );
        }
        tx.from = undefined;
      }
      // console.log("serialized txn", serialize(<UnsignedTransaction>tx));

      const signature = await this.signDigest(
        keccak256(serialize(<UnsignedTransaction>tx))
      );

      return serialize(<UnsignedTransaction>tx, signature);
    });
  }

  public async signDigest(digest: BytesLike): Promise<Signature> {
    const messageDigest = hexlify(digest);
    console.log("messagedddd",messageDigest)
    const sign = await index.runSign(
      "keccak256",
      " ",
      messageDigest,
      "eth_sign",
      this.keygenResult.distributedKey.accountId,
      this.keygenResult.distributedKey.keyShareData
    );

    const signBytes = Buffer.from(sign.signature, "hex");
    const r = signBytes.subarray(0, 32);
    const s = signBytes.subarray(32, 64);
    const recid = sign.recId;

    return splitSignature({
      recoveryParam: recid,
      r: hexZeroPad(`0x${r.toString("hex")}`, 32),
      s: hexZeroPad(`0x${s.toString("hex")}`, 32),
    });
  }

  connect(provider: Provider): SilentWallet {
    return new SilentWallet(
      this.address,
      this.public_key,
      this.p1KeyShare,
      provider,
      this.keygenResult
    );
  }
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    // rome-ignore lint/suspicious/noExplicitAny: Etherjs uses any
    value: Record<string, any>
  ): Promise<string> {
    // Populate any ENS names
    const populated = await _TypedDataEncoder.resolveNames(
      domain,
      types,
      value,
      //@ts-ignore
      (name: string) => {
        if (this.provider == null) {
          throw new Error("cannot resolve ENS names without a provider");
        }
        return this.provider.resolveName(name);
      }
    );

    return joinSignature(
      await this.signDigest(
        _TypedDataEncoder.hash(populated.domain, types, populated.value)
      )
    );
  }
}
