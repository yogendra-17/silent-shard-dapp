"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
// import { toast,  } from 'react-toastify';

// import { ErrorToast } from '@/components/Toast/error';
import { Button } from "@/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Separator } from "@/components/separator";
import { TextInput } from "@/components/textInput";

import * as store from "@/utils/store";
import { useRouter } from "next/navigation";

interface HomescreenProps {}

const Homescreen: React.FC<HomescreenProps> = ({}) => {
    const placeholderAccount = { address: "...", balance: 0 };
    const [walletAccount, setWalletAccount] =
        useState<store.accountType>(placeholderAccount);
    const [eoa, setEoa] = useState<store.accountType>(placeholderAccount);
    const [network, setNetwork] = useState("..."); // set to polygon mumbai after switch
    const [switchChain, setSwitchChain] = useState<"none" | "popup" | "button">(
        "none"
    );
    const router = useRouter();

    useEffect(() => {
        if (store.getPairingStatus() == "Unpaired") {
            router.replace("/intro");
            return;
        }
        // get wallet account and eoa
        setWalletAccount(store.getWalletAccount());
        setEoa(store.getEoa());
    }, []);

    const POLYGON_MUMBAI_CHAIN_ID = BigInt(80001);
    const POLYGON_MUMBAI = {
        chainId: "0x13881", // 80001 in hex
        chainName: "Matic(Polygon) Mumbai Testnet",
        nativeCurrency: {
            name: "Matic Mumbai",
            symbol: "MATIC",
            decimals: 18,
        },
        rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
        blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
    };

    useEffect(() => {
        if (walletAccount.address == "...") return;
        if (eoa.address == "...") return;
        (async () => {
            if (!(await isChainPolygon())) {
                setSwitchChain("popup");
                const didUserSwitch = await switchToPolygon();
                if (!didUserSwitch) {
                    setSwitchChain("button");
                    return;
                }
                setSwitchChain("none");
            }

            setNetwork("Polygon Mumbai");
            let { balance_wallet, balance_eoa } = await updateBalance();
            setWalletAccount({
                ...walletAccount,
            });
            setEoa({
                ...eoa,
            });
        })();
    }, [walletAccount.address, eoa.address]);

    async function onSwitchChainClick() {
        if (switchChain === "popup") return;
        const didUserSwitch = await switchToPolygon();
        didUserSwitch ? setSwitchChain("none") : setSwitchChain("button");
    }

    async function isChainPolygon() {
        // @ts-ignore
        const provider = new ethers.BrowserProvider(window.ethereum);

        const currentChainId = (await provider.getNetwork()).chainId;
        if (currentChainId == POLYGON_MUMBAI_CHAIN_ID) {
            console.log(currentChainId, "chianid");
            return true;
        }

        // else not polygon
        console.log("chain id not polygon ");
        return false;
    }

    async function switchToPolygon(): Promise<boolean> {
        try {
            // @ts-ignore
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [POLYGON_MUMBAI],
            });
            if (await isChainPolygon()) {
                setNetwork("Polygon Mumbai");
                return true;
            } else {
                return false;
            }
        } catch (e: unknown) {
            console.log("error", e);
            return false;
        }
    }

    async function updateBalance() {
        // @ts-ignore
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance_wallet = await provider.getBalance(walletAccount.address);
        let balance_eoa = await provider.getBalance(eoa.address);

        return { balance_wallet, balance_eoa };
    }

    const [showSuccessBanner, setShowSuccessBanner] = useState(true);
    const [showTransactionInitiatedBanner, setShowTransactionInitiatedBanner] =
        useState(false);
    const [showTransactionSignedBanner, setShowTransactionSignedBanner] =
        useState(false);

    //transaction
    const [recipientAddress, setRecipientAddress] = useState("0x");
    const [amount, setAmount] = useState("0");
    const [txHash, setTxHash] = useState<null | string>(null);
    const [isSendValid, setIsSendValid] = useState(false);
    const [recipientAddressError, setRecipientAddressError] = useState("");
    const [amountError, setAmountError] = useState("");

    useEffect(() => {
        setIsSendValid(
            switchChain == "none" &&
                recipientAddressError == "" &&
                amountError == ""
        );
    }, [recipientAddress, amount, switchChain]);

    function handleRecipientAddressChange(address_: string) {
        setRecipientAddress(address_);

        function isValidAddress(address: string): boolean {
            if (/^0x[a-fA-F\d]{40}$/.test(address)) {
                return true;
            }
            return false;
        }
        isValidAddress(address_)
            ? setRecipientAddressError("")
            : setRecipientAddressError("Invalid Address");
    }

    function handleAmountChange(amount_: string) {
        setAmount(amount_);

        function isValidAmount(amount: string): boolean {
            if (isNaN(parseFloat(amount))) {
                return false;
            }
            // amount must be all digits
            if (!/^[\d|\.]+$/.test(amount)) {
                return false;
            }

            return true;
        }

        isValidAmount(amount_)
            ? setAmountError("")
            : setAmountError("Invalid Amount");
    }

    function handleSend(event: React.MouseEvent): void {
        event.preventDefault();

        (async () => {
            // clear banners
            setShowTransactionSignedBanner(false);

            // send sign request to server
            setShowTransactionInitiatedBanner(true);

            const requestData = {
                to: recipientAddress,
                amount: amount,
            };
            const response = await fetch(
                "http://localhost:3001/api/simpleAccount/transfer",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestData),
                }
            );

            const resData = await response.json();
            console.log(resData);
            store.setTxHash(resData.transactionHash); // tx hash received from backend?
            setShowTransactionInitiatedBanner(false);

            // show sign successful banner
            setShowTransactionSignedBanner(true);
        })();
    }

    function logout(event: React.MouseEvent): void {
        event.preventDefault();
        router.push("/pair");
    }

    return (
        <div className="">
            <div className="animate__animated animate__slideInUp animate__faster relative flex flex-col justify-center py-6 px-10 border rounded-[8px] border-none  w-[92vw] lg:w-[52.75vw] m-auto bg-white-primary">
                <div className="border-none bg-transparent h-max py-0">
                    {showSuccessBanner && (
                        <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#08170E] border-[#166533] w-full text-[#BBF7D1]">
                            <svg
                                className="absolute top-4 right-4 cursor-pointer"
                                onClick={() => {
                                    setShowSuccessBanner(false);
                                }}
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                    fill="#4ADE80"
                                />
                            </svg>
                            <div className="full-w full-h flex flex-col justify-center items-center">
                                <svg
                                    className="my-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="64"
                                    viewBox="0 0 64 64"
                                    fill="none"
                                >
                                    <path
                                        d="M32 6C17.6637 6 6 17.6637 6 32C6 46.3363 17.6637 58 32 58C46.3363 58 58 46.3363 58 32C58 17.6637 46.3363 6 32 6ZM45.5312 23.2862L28.7313 43.2863C28.547 43.5058 28.3177 43.6831 28.0589 43.8062C27.8001 43.9294 27.5178 43.9955 27.2313 44H27.1975C26.9172 43.9999 26.64 43.9409 26.384 43.8267C26.1279 43.7126 25.8987 43.5459 25.7113 43.3375L18.5112 35.3375C18.3284 35.1436 18.1862 34.915 18.0929 34.6653C17.9996 34.4156 17.9572 34.1498 17.9681 33.8835C17.9791 33.6171 18.0431 33.3557 18.1565 33.1145C18.27 32.8733 18.4305 32.6571 18.6286 32.4788C18.8267 32.3005 19.0585 32.1636 19.3103 32.0762C19.5621 31.9887 19.8288 31.9525 20.0948 31.9696C20.3608 31.9867 20.6207 32.0568 20.8592 32.1758C21.0978 32.2948 21.3101 32.4603 21.4837 32.6625L27.145 38.9525L42.4688 20.7138C42.8125 20.3163 43.2988 20.0702 43.8226 20.0284C44.3463 19.9867 44.8655 20.1528 45.2678 20.4907C45.6701 20.8287 45.9233 21.3114 45.9726 21.8345C46.0219 22.3576 45.8634 22.8791 45.5312 23.2862Z"
                                        fill="#4ADE80"
                                    />
                                </svg>
                                <div className="text-center">
                                    Your Distributed AA wallet is ready! Add
                                    funds to your wallet from a faucet to get
                                    started!
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className="mb-3 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                        style={{
                            border: "1px solid #23272E",
                            padding: "32px 40px",
                        }}
                    >
                        {(switchChain === "popup" ||
                            switchChain === "button") && (
                            <div
                                className="text-center text-indigo-300 font-bold cursor-pointer"
                                onClick={onSwitchChainClick}
                            >
                                Switch to Polygon Mumbai (Testnet) ...
                            </div>
                        )}
                        {switchChain === "none" && (
                            <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 flex-wrap items-center">
                                <div className="mr-3 h-[48px] w-[48px] rounded-full aspect-square bg-[#181625] flex justify-center">
                                    <svg
                                        className="self-center"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="28"
                                        height="28"
                                        viewBox="0 0 28 28"
                                        fill="none"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M8.58732 5.80487H22.5984C22.7999 5.80478 23.0012 5.81756 23.2011 5.84315C23.1334 5.36757 22.97 4.91064 22.7209 4.4999C22.4718 4.08917 22.1421 3.73313 21.7516 3.45327C21.3612 3.1734 20.9181 2.9755 20.4491 2.8715C19.9802 2.76749 19.495 2.75954 19.0228 2.84811L5.39572 5.17462C5.20928 5.20319 5.0208 5.23491 4.83208 5.27012H4.82015C4.73687 5.28605 4.65445 5.30489 4.57303 5.32657C2.52494 5.84199 1.92539 7.69905 1.92539 8.82366V10.1217C1.90768 10.2626 1.89859 10.4052 1.89844 10.5487V20.8987C1.89944 21.8134 2.26324 22.6903 2.91002 23.3371C3.55681 23.9839 4.43375 24.3477 5.34844 24.3487H22.5984C23.5131 24.3477 24.3901 23.9839 25.0369 23.3371C25.6836 22.6903 26.0474 21.8134 26.0484 20.8987V10.5487C26.0474 9.63397 25.6836 8.75703 25.0369 8.11025C24.3901 7.46346 23.5131 7.09966 22.5984 7.09866H8.82539C7.91274 7.09866 7.81273 5.99258 8.58732 5.80487ZM20.0379 17.4487C19.6967 17.4487 19.3632 17.3475 19.0795 17.1579C18.7959 16.9684 18.5748 16.699 18.4442 16.3838C18.3136 16.0686 18.2795 15.7217 18.346 15.3871C18.4126 15.0525 18.5769 14.7451 18.8181 14.5039C19.0594 14.2627 19.3667 14.0984 19.7014 14.0318C20.036 13.9652 20.3828 13.9994 20.698 14.13C21.0132 14.2605 21.2826 14.4816 21.4722 14.7653C21.6617 15.049 21.7629 15.3825 21.7629 15.7237C21.7629 16.1812 21.5812 16.6199 21.2577 16.9434C20.9342 17.2669 20.4954 17.4487 20.0379 17.4487Z"
                                            fill="#A2A3FF"
                                        />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-black-200 text-sm">
                                        My Wallet
                                    </div>
                                    <Popover>
                                        <PopoverTrigger>
                                            <div
                                                className="flex items-center"
                                                onClick={async () => {
                                                    navigator.clipboard.writeText(
                                                        walletAccount.address
                                                    );
                                                }}
                                            >
                                                <span className="mr-1 text-[black] b1-bold ">
                                                    {walletAccount.address.slice(
                                                        0,
                                                        5
                                                    )}
                                                    {"..."}
                                                    {walletAccount.address.slice(
                                                        walletAccount.address
                                                            .length - 5,
                                                        walletAccount.address
                                                            .length
                                                    )}
                                                </span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="21"
                                                    viewBox="0 0 20 21"
                                                    fill="none"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M4.37315 1.75L4.375 1.75H12.8125L12.8143 1.75C13.5591 1.75212 14.2728 2.04893 14.7994 2.57558C15.3261 3.10224 15.6229 3.81592 15.625 4.56072C15.625 4.56565 15.625 4.57059 15.6249 4.57552L15.6186 4.875H15.8984C17.4733 4.875 18.75 6.15169 18.75 7.72656V16.3984C18.75 17.9733 17.4733 19.25 15.8984 19.25H7.22656C5.65169 19.25 4.375 17.9733 4.375 16.3984V16.125H4.0625L4.06072 16.125C3.31592 16.1229 2.60224 15.8261 2.07558 15.2994C1.54893 14.7728 1.25212 14.0591 1.25 13.3143L1.25 13.3125V4.875L1.25 4.87315C1.25245 4.04559 1.58228 3.25263 2.16745 2.66745C2.75263 2.08228 3.54559 1.75245 4.37315 1.75ZM5.625 16.3984C5.625 17.283 6.34204 18 7.22656 18H15.8984C16.783 18 17.5 17.283 17.5 16.3984V7.72656C17.5 6.84204 16.783 6.125 15.8984 6.125H14.9826C14.9813 6.125 14.9801 6.125 14.9789 6.125H7.22656C6.34204 6.125 5.625 6.84204 5.625 7.72656V16.3984ZM14.3684 4.875H7.22656C5.65169 4.875 4.375 6.15169 4.375 7.72656V14.875H4.06351C3.64928 14.8736 3.25239 14.7085 2.95947 14.4155C2.66656 14.1226 2.50139 13.7258 2.5 13.3115V4.87599C2.50169 4.37898 2.69988 3.9028 3.05134 3.55134C3.4028 3.19988 3.87898 3.00169 4.37599 3H12.8115C13.2258 3.00139 13.6226 3.16656 13.9155 3.45947C14.207 3.75098 14.372 4.14545 14.375 4.55751L14.3684 4.875Z"
                                                        fill="black"
                                                    />
                                                </svg>
                                            </div>
                                            
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            side="right"
                                            className="flex justify-center w-18 p-1 b2-md"
                                        >
                                            Copied!
                                        </PopoverContent>
                                    </Popover>
                                    {/* <div className="text-blackh2-bold mt-2">
                                        {walletAccount.balance} ETH
                                    </div> */}
                                </div>

                                <div className="ml-auto"></div>

                                <div className="text-black">
                                    <div className="text-sm text-black-200">
                                        EOA:
                                    </div>
                                    <Popover>
                                        <PopoverTrigger>
                                            <div
                                                className="flex items-center"
                                                onClick={async () => {
                                                    navigator.clipboard.writeText(
                                                        eoa.address
                                                    );
                                                }}
                                            >
                                                <span className="mr-1 text-[black] b1-bold">
                                                    {eoa.address.slice(0, 5)}
                                                    {"..."}
                                                    {eoa.address.slice(
                                                        eoa.address.length - 5,
                                                        eoa.address.length
                                                    )}
                                                </span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="21"
                                                    viewBox="0 0 20 21"
                                                    fill="none"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M4.37315 1.75L4.375 1.75H12.8125L12.8143 1.75C13.5591 1.75212 14.2728 2.04893 14.7994 2.57558C15.3261 3.10224 15.6229 3.81592 15.625 4.56072C15.625 4.56565 15.625 4.57059 15.6249 4.57552L15.6186 4.875H15.8984C17.4733 4.875 18.75 6.15169 18.75 7.72656V16.3984C18.75 17.9733 17.4733 19.25 15.8984 19.25H7.22656C5.65169 19.25 4.375 17.9733 4.375 16.3984V16.125H4.0625L4.06072 16.125C3.31592 16.1229 2.60224 15.8261 2.07558 15.2994C1.54893 14.7728 1.25212 14.0591 1.25 13.3143L1.25 13.3125V4.875L1.25 4.87315C1.25245 4.04559 1.58228 3.25263 2.16745 2.66745C2.75263 2.08228 3.54559 1.75245 4.37315 1.75ZM5.625 16.3984C5.625 17.283 6.34204 18 7.22656 18H15.8984C16.783 18 17.5 17.283 17.5 16.3984V7.72656C17.5 6.84204 16.783 6.125 15.8984 6.125H14.9826C14.9813 6.125 14.9801 6.125 14.9789 6.125H7.22656C6.34204 6.125 5.625 6.84204 5.625 7.72656V16.3984ZM14.3684 4.875H7.22656C5.65169 4.875 4.375 6.15169 4.375 7.72656V14.875H4.06351C3.64928 14.8736 3.25239 14.7085 2.95947 14.4155C2.66656 14.1226 2.50139 13.7258 2.5 13.3115V4.87599C2.50169 4.37898 2.69988 3.9028 3.05134 3.55134C3.4028 3.19988 3.87898 3.00169 4.37599 3H12.8115C13.2258 3.00139 13.6226 3.16656 13.9155 3.45947C14.207 3.75098 14.372 4.14545 14.375 4.55751L14.3684 4.875Z"
                                                        fill="#ECEEF2"
                                                    />
                                                </svg>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            side="right"
                                            className="flex justify-center w-18 p-1 b2-md"
                                        >
                                            Copied!
                                        </PopoverContent>
                                    </Popover>
                                    <div className="mt-4 rounded-full bg-[#585A48] text-sm py-2 px-3 flex flex-row">
                                        {network === "Polygon Mumbai" && (
                                            <img
                                                src="/polygon.svg"
                                                className="mr-2"
                                            />
                                        )}
                                        <div>{network}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {showTransactionInitiatedBanner && (
                        <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#08170E] border-[#166533] w-full text-[#BBF7D1]">
                            <svg
                                className="absolute top-4 right-4 cursor-pointer"
                                onClick={() => {
                                    setShowTransactionInitiatedBanner(false);
                                }}
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                    fill="#4ADE80"
                                />
                            </svg>
                            <div className="full-w full-h flex flex-col justify-center items-center">
                                <div className="text-center">
                                    Transaction initiated. Approve the signature
                                    on your phone{" "}
                                </div>
                            </div>
                        </div>
                    )}

                    {showTransactionSignedBanner && (
                        <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#08170E] border-[#166533] w-full text-[#BBF7D1]">
                            <svg
                                className="absolute top-4 right-4 cursor-pointer"
                                onClick={() => {
                                    setShowTransactionSignedBanner(false);
                                }}
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                    fill="#4ADE80"
                                />
                            </svg>
                            <div className="full-w full-h flex flex-col justify-center items-center">
                                <svg
                                    className="my-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="64"
                                    viewBox="0 0 64 64"
                                    fill="none"
                                >
                                    <path
                                        d="M32 6C17.6637 6 6 17.6637 6 32C6 46.3363 17.6637 58 32 58C46.3363 58 58 46.3363 58 32C58 17.6637 46.3363 6 32 6ZM45.5312 23.2862L28.7313 43.2863C28.547 43.5058 28.3177 43.6831 28.0589 43.8062C27.8001 43.9294 27.5178 43.9955 27.2313 44H27.1975C26.9172 43.9999 26.64 43.9409 26.384 43.8267C26.1279 43.7126 25.8987 43.5459 25.7113 43.3375L18.5112 35.3375C18.3284 35.1436 18.1862 34.915 18.0929 34.6653C17.9996 34.4156 17.9572 34.1498 17.9681 33.8835C17.9791 33.6171 18.0431 33.3557 18.1565 33.1145C18.27 32.8733 18.4305 32.6571 18.6286 32.4788C18.8267 32.3005 19.0585 32.1636 19.3103 32.0762C19.5621 31.9887 19.8288 31.9525 20.0948 31.9696C20.3608 31.9867 20.6207 32.0568 20.8592 32.1758C21.0978 32.2948 21.3101 32.4603 21.4837 32.6625L27.145 38.9525L42.4688 20.7138C42.8125 20.3163 43.2988 20.0702 43.8226 20.0284C44.3463 19.9867 44.8655 20.1528 45.2678 20.4907C45.6701 20.8287 45.9233 21.3114 45.9726 21.8345C46.0219 22.3576 45.8634 22.8791 45.5312 23.2862Z"
                                        fill="#4ADE80"
                                    />
                                </svg>
                                <div className="text-center">
                                    Signature Successful, check the transaction{" "}
                                    {``}
                                    <span className="font-bold">
                                        <a
                                            href={
                                                "https://mumbai.polygonscan.com/tx/" +
                                                `${localStorage.getItem(
                                                    "txHash"
                                                )}`
                                            }
                                        >
                                            {" "}
                                            here
                                        </a>
                                    </span>{" "}
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className="mb-3 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                        style={{
                            border: "1px solid #23272E",
                            padding: "32px 40px",
                        }}
                    >
                        <div className="text-black">
                            <div className="h2-bold mb-8">Transact</div>
                            <div className="">
                                <div>
                                    <TextInput
                                        label="Address"
                                        placeholder={"0x..."}
                                        value={recipientAddress}
                                        setValue={handleRecipientAddressChange}
                                        error={recipientAddressError}
                                    />
                                    <div className="flex flex-row item-center justify-between gap-8">
                                        <TextInput
                                            label="Amount"
                                            placeholder={"0.0..."}
                                            value={amount}
                                            setValue={handleAmountChange}
                                            error={amountError}
                                        />
                                        <Button
                                            onClick={handleSend}
                                            className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active self-center mb-4 w-full"
                                            disabled={!isSendValid}
                                        >
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        className="flex items-center justify-center text-red-300 rounded-md px-2"
                        onClick={logout}
                    >
                        <img src="/logout.svg" className="mr-3" />
                        <div className="mr-3 text-sm">Delete Wallet</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Homescreen;
