"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/popover";

import * as store from "@/utils/store";
import { useRouter } from "next/navigation";
import { json } from "stream/consumers";

function Page() {
    const placeholderAccount = {address: "...", balance: 0}
    const [loading, setLoading] = useState<boolean>(false);
    const [eoa, setEoa] = useState<store.accountType>(placeholderAccount);
    const router = useRouter();

    const step = 2;

    useEffect(() => {
        // show Eoa details
        console.log("getEoa check",store.getEoa())
        setEoa(store.getEoa());

    }, []);

    const handleMint = () => {
        (async () => {
            setLoading(true);
            // mint
            // await new Promise((resolve) => setTimeout(resolve, 1000));

            const response = await fetch("http://localhost:3001/api/simpleAccount/address",{
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const walletAccount = await response.json(); 
        store.setWalletAccount({address: walletAccount.scaAddress});
        setLoading(false);

            // redirect to homescreen
            router.push("/homescreen");
        })();
    };

    return (
        <div>
            <div className="absolute w-full top-0 right-0">
                <Progress
                    className="w-[99.5%]"
                    value={step * 33}
                    style={{ height: "4px" }}
                />
            </div>
            <Button
                className="rounded-full bg-gray-custom min-w-max aspect-square"
                size="icon"
                disabled={false}
                onClick={() => {
                    console.log("clicked");
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16.1705 4.4545C16.6098 4.89384 16.6098 5.60616 16.1705 6.0455L10.216 12L16.1705 17.9545C16.6098 18.3938 16.6098 19.1062 16.1705 19.5455C15.7312 19.9848 15.0188 19.9848 14.5795 19.5455L7.8295 12.7955C7.39017 12.3562 7.39017 11.6438 7.8295 11.2045L14.5795 4.4545C15.0188 4.01517 15.7312 4.01517 16.1705 4.4545Z"
                        fill="#B1BBC8"
                    />
                </svg>
            </Button>

            <div className="h2-bold text-blackleading-[38.4px] mt-4">
                Your Phone is Paired
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <img
                        className="h-[50%] mb-8"
                        src="/loading.gif"
                        alt="loading"
                    />
                    <div
                        className="text-center text-blackh2-bold"
                        style={{ marginBottom: 140 }}
                    >
                        Minting...
                    </div>
                </div>
            )}
            {!loading && !!eoa && (
                <>
                    <div className="h3 font-bold text-blackleading-[38.4px] mt-12">
                        Your EOA:
                    </div>

                    <div
                        className="mt-2 mb-12 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                        style={{
                            border: "1px solid #23272E",
                            padding: "16px 40px",
                        }}
                    >
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
                                                {eoa.address.slice(0,4)}
                                                {"..."}
                                                {eoa.address.slice(
                                                    eoa.address.length-5,
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
                            </div>
                            <div className="ml-auto"></div>
                        </div>
                    </div>

                    <div className="h3 text-center font-bold text-blackleading-[38.4px] mt-12">
                        You can now mint your counterfactual address and create
                        an AA wallet.
                    </div>

                    <Button
                        className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-full self-center mt-8"
                        onClick={handleMint}
                    >
                        Mint AA Wallet
                    </Button>
                </>
            )}
        </div>
    );
}

export default Page;
