export type accountType = {
    
    address: string;
};

export type pairingStatusType = "Paired" | "Unpaired";

export function setEoa(eoa: accountType) {
    console.log("eoa set store,", eoa)
    localStorage.setItem("eoa", JSON.stringify(eoa));
}

export function getEoa(): accountType {
    console.log("eoa get store,",localStorage.getItem("eoa"))

    return JSON.parse(localStorage.getItem("eoa") || "{}");
}

export function setWalletAccount(walletAccount: accountType) {
    console.log("WalletAccount store",walletAccount)
    localStorage.setItem("walletAccount", JSON.stringify(walletAccount));
}

export function getWalletAccount(): accountType {
    console.log("GetWalletAccount store",localStorage.getItem("getWalletAccount"))
    return JSON.parse(localStorage.getItem("walletAccount") || "{}");
}

export function setPairingStatus(status: pairingStatusType) {
    localStorage.setItem("pairingStatus", status);
}

export function getPairingStatus(): pairingStatusType {
    return localStorage.getItem("pairingStatus") as pairingStatusType;
}

export function setTxHash(txHash : string){
    console.log("setTxHash Store",txHash)
    localStorage.setItem("txnHash",JSON.stringify(txHash))
}

export function getTxHash() {
    return JSON.parse(localStorage.getItem("txHash") || "{}")

}

export function clearLocalStorage() {
    setPairingStatus("Unpaired");
    localStorage.removeItem("eoa");
    localStorage.removeItem("walletAccount");
    
}

