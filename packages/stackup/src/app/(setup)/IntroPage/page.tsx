"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import frontAnimation from "../../../../public/frontAnimation.json";
import Lottie from "lottie-react";

function Page() {
    const router = useRouter();
    const nextPageClick = () => {
        router.replace("/pair");
    };

    return (
        <div>
            <div className="absolute w-full top-0 right-0"></div>
            <div className="flex flex-col items-center h-[20vh]">
                <div
                    className="text-center text-black h2-bold"
                    style={{
                        fontFamily: "Epilogue",
                        fontSize: "24px",
                        fontWeight: 800,
                        lineHeight: "38px",
                        letterSpacing: "0px",
                        textAlign: "center",
                    }}
                >
                    Eliminate Single Points of failure with<br></br>
                    Distributed Smart Contract Accounts
                </div>
                <div
                    className="text-center text-black"
                    style={{
                        fontFamily: "Epilogue",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "22px",
                        letterSpacing: "0px",
                        textAlign: "center",
                        marginTop: "24px",
                    }}
                >
                    A beautiful confluence between Multi Party Computation and
                    Account Abstraction to enable a 2FA- like experience
                </div>
            </div>
            <div>
                <img
                    src="/slxstackup.svg"
                    alt="qr code"
                    className="w-1/2 h-1/2 m-auto"
                />
            </div>
            <br></br>
            <div className="flex items-center justify-center">
                <Lottie className="w-[600px]" animationData={frontAnimation} />
            </div>

            <Button
                className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-full self-center mt-8"
                onClick={nextPageClick}
            >
                Pair with phone
            </Button>
        </div>
    );
}

export default Page;
