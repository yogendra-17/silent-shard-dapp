import { KeyringSnapRpcClient } from "@metamask/keyring-api";

import { SnapError } from "./error";

const SNAP_ID = process.env.REACT_APP_SNAP_ID!;
const getKeyringClient = () => {
  return new KeyringSnapRpcClient(SNAP_ID, window.ethereum);
};

const connect = async (latestSnapVersion: string | null) => {
  await window.ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [SNAP_ID]: latestSnapVersion
        ? {
            version: latestSnapVersion,
          }
        : {},
    },
  });
};

const isConnected = async () => {
  try {
    const result = await window.ethereum.request({
      method: "wallet_getSnaps",
    });
    return !!(SNAP_ID in result && result[SNAP_ID].enabled);
  } catch (err) {
    return false;
  }
};

const isPaired = async () => {
  const data = await callSnap<IsPairedResponse>("tss_isPaired", null);
  return data;
};

const runPairing = async () => {
  return await callSnap<RunPairingResponse>("tss_runPairing", null);
};

const runKeygen = async () => {
  return await callSnap<RunKeygenResponse>("tss_runKeygen", null);
};

const unPair = async () => {
  return await callSnap<object>("tss_unpair", null);
};

const initPairing = async () => {
  return await callSnap<InitPairingResponse>("tss_initPairing", null);
};

const snapVersion = async () => {
  return await callSnap<SnapVersionResponse>("tss_snapVersion", null);
};

const callSnap = async <T>(
  method: string,
  params: unknown | null
): Promise<{
  response: T | null;
  snapErr: SnapError | null;
}> => {
  const request = { method: method, params: params ?? [] };
  try {
    const response = await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: SNAP_ID,
        request,
      },
    });
    return {
      response: response as T,
      snapErr: null,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        response: null,
        snapErr: new SnapError(error.message, -1),
      };
    } else {
      const rpcError = error as ProviderRpcError;
      try {
        const snapErr = JSON.parse(rpcError.message);
        return {
          response: null,
          snapErr,
        };
      } catch (error: unknown) {
        return {
          response: null,
          snapErr: new SnapError(rpcError.message, rpcError.code),
        };
      }
    }
  }
};

export {
  connect,
  getKeyringClient,
  initPairing,
  isConnected,
  isPaired,
  runKeygen,
  runPairing,
  snapVersion,
  unPair,
};
