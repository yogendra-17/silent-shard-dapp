"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/progress";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/passwordInput";
import { Label } from "@/components/ui/label";

function Page() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const step = 2;

    return (
        <div>
            <div className="absolute w-full top-0 right-0">
                <Progress
                    className="w-[99.5%]"
                    value={step * 25}
                    style={{ height: "4px" }}
                />
            </div>
            <Button
                className="rounded-full bg-gray-custom min-w-max aspect-square"
                size="icon"
                disabled={true}
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
            <div className="flex full-w justify-between items-center mt-4">
                <div className="h2-bold text-blackleading-[38.4px] flex">
                    Backup your account
                </div>
                <div className="flex items-center cursor-pointer">
                    <svg
                        className="mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2.25 11.625C2.25 6.44782 6.44782 2.25 11.625 2.25C16.8022 2.25 21 6.44782 21 11.625C21 16.8022 16.8022 21 11.625 21C6.44782 21 2.25 16.8022 2.25 11.625ZM11.625 3.75C7.27624 3.75 3.75 7.27624 3.75 11.625C3.75 15.9738 7.27624 19.5 11.625 19.5C15.9738 19.5 19.5 15.9738 19.5 11.625C19.5 7.27624 15.9738 3.75 11.625 3.75ZM9.5625 10.3125C9.5625 9.89829 9.89829 9.5625 10.3125 9.5625H11.8125C12.2267 9.5625 12.5625 9.89829 12.5625 10.3125V15.1875H13.875C14.2892 15.1875 14.625 15.5233 14.625 15.9375C14.625 16.3517 14.2892 16.6875 13.875 16.6875H9.75C9.33579 16.6875 9 16.3517 9 15.9375C9 15.5233 9.33579 15.1875 9.75 15.1875H11.0625V11.0625H10.3125C9.89829 11.0625 9.5625 10.7267 9.5625 10.3125Z"
                            fill="#867DFC"
                        />
                        <path
                            d="M11.625 6.09375C11.384 6.09375 11.1483 6.16523 10.9479 6.29915C10.7475 6.43306 10.5913 6.62341 10.499 6.8461C10.4068 7.0688 10.3826 7.31385 10.4297 7.55027C10.4767 7.78668 10.5928 8.00384 10.7632 8.17429C10.9337 8.34473 11.1508 8.46081 11.3872 8.50783C11.6236 8.55486 11.8687 8.53072 12.0914 8.43848C12.3141 8.34623 12.5044 8.19002 12.6384 7.9896C12.7723 7.78918 12.8438 7.55355 12.8438 7.3125C12.8438 6.98927 12.7153 6.67927 12.4868 6.45071C12.2582 6.22215 11.9482 6.09375 11.625 6.09375Z"
                            fill="#867DFC"
                        />
                    </svg>
                    <div className="text-indigo-custom b2-regular">
                        How backup works?
                    </div>
                </div>
            </div>

            <p className="b2-regular text-[#8E95A2]">
                Create a <b>password</b> to protect your backup and unlock
                backup options on the mobile app. This password will be required
                to recover your account on any browser or desktop device.
            </p>

            <div className="space-y-3 my-6 px-14">
                <div>
                    <Label htmlFor="current_password">Enter a password</Label>
                    <PasswordInput
                        id="current_password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="password"
                    />
                </div>

                <div>
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        value={passwordConfirmation}
                        onChange={(e) =>
                            setPasswordConfirmation(e.target.value)
                        }
                        autoComplete="new-password"
                        placeholder="password"
                    />
                </div>
                <div className="flex items-center">
                    <svg
                        className="mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M8 1.5C4.41594 1.5 1.5 4.41594 1.5 8C1.5 11.5841 4.41594 14.5 8 14.5C11.5841 14.5 14.5 11.5841 14.5 8C14.5 4.41594 11.5841 1.5 8 1.5ZM8 11.4972C7.87639 11.4972 7.75555 11.4605 7.65277 11.3919C7.54999 11.3232 7.46988 11.2256 7.42258 11.1114C7.37527 10.9972 7.36289 10.8715 7.38701 10.7503C7.41112 10.629 7.47065 10.5177 7.55806 10.4302C7.64547 10.3428 7.75683 10.2833 7.87807 10.2592C7.99931 10.2351 8.12497 10.2475 8.23918 10.2948C8.35338 10.3421 8.45099 10.4222 8.51967 10.525C8.58834 10.6277 8.625 10.7486 8.625 10.8722C8.625 11.0379 8.55915 11.1969 8.44194 11.3141C8.32473 11.4313 8.16576 11.4972 8 11.4972ZM8.67875 5.21125L8.49938 9.02375C8.49938 9.15636 8.4467 9.28354 8.35293 9.3773C8.25916 9.47107 8.13198 9.52375 7.99937 9.52375C7.86677 9.52375 7.73959 9.47107 7.64582 9.3773C7.55205 9.28354 7.49937 9.15636 7.49937 9.02375L7.32 5.21313V5.21156C7.31607 5.11998 7.33071 5.02854 7.36305 4.94277C7.39539 4.85699 7.44475 4.77865 7.50817 4.71245C7.57158 4.64626 7.64774 4.59358 7.73205 4.55759C7.81636 4.5216 7.90708 4.50305 7.99875 4.50305C8.09042 4.50305 8.18114 4.5216 8.26545 4.55759C8.34976 4.59358 8.42592 4.64626 8.48933 4.71245C8.55275 4.77865 8.60211 4.85699 8.63445 4.94277C8.66679 5.02854 8.68143 5.11998 8.6775 5.21156L8.67875 5.21125Z"
                            fill="#EAB308"
                        />
                    </svg>
                    <div className="b2-regular text-[#8E95A2]">
                        You will have to remember this password.{" "}
                        <span className="text-[#5B616E]">
                            Once set, it can&apos;t be changed
                        </span>
                    </div>
                </div>

                <div className="b2-regular flex flex-col border border-[#1e55af] rounded-lg my-4 p-2 bg-[rgba(96,154,250,0.1)]">
                    <div className="flex text-[#1567E4] mb-2">
                        <svg
                            className="mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M8 1.75C4.55375 1.75 1.75 4.55375 1.75 8C1.75 11.4462 4.55375 14.25 8 14.25C11.4462 14.25 14.25 11.4462 14.25 8C14.25 4.55375 11.4462 1.75 8 1.75ZM8 4.3125C8.1607 4.3125 8.31779 4.36015 8.4514 4.44943C8.58502 4.53871 8.68916 4.6656 8.75065 4.81407C8.81215 4.96253 8.82824 5.1259 8.79689 5.28351C8.76554 5.44112 8.68815 5.58589 8.57452 5.69952C8.46089 5.81315 8.31612 5.89054 8.15851 5.92189C8.0009 5.95324 7.83753 5.93715 7.68907 5.87565C7.5406 5.81416 7.41371 5.71002 7.32443 5.5764C7.23515 5.44279 7.1875 5.2857 7.1875 5.125C7.1875 4.90951 7.2731 4.70285 7.42548 4.55048C7.57785 4.3981 7.78451 4.3125 8 4.3125ZM9.5 11.375H6.75C6.61739 11.375 6.49021 11.3223 6.39645 11.2286C6.30268 11.1348 6.25 11.0076 6.25 10.875C6.25 10.7424 6.30268 10.6152 6.39645 10.5214C6.49021 10.4277 6.61739 10.375 6.75 10.375H7.625V7.625H7.125C6.99239 7.625 6.86521 7.57232 6.77145 7.47855C6.67768 7.38479 6.625 7.25761 6.625 7.125C6.625 6.99239 6.67768 6.86521 6.77145 6.77145C6.86521 6.67768 6.99239 6.625 7.125 6.625H8.125C8.25761 6.625 8.38479 6.67768 8.47855 6.77145C8.57232 6.86521 8.625 6.99239 8.625 7.125V10.375H9.5C9.63261 10.375 9.75979 10.4277 9.85355 10.5214C9.94732 10.6152 10 10.7424 10 10.875C10 11.0076 9.94732 11.1348 9.85355 11.2286C9.75979 11.3223 9.63261 11.375 9.5 11.375Z"
                                fill="#609AFA"
                            />
                        </svg>
                        <div>Password must contain atleast</div>
                    </div>
                    <ul
                        className="ml-5 text-[#609AFA]"
                        style={{ listStyleType: "disc" }}
                    >
                        <li>Eight (8) characters</li>
                        <li>One Number</li>
                        <li>One Lower case alphabet</li>
                        <li>One Upper case alphabet</li>
                        <li>One special character (@,$,#,! etc)</li>
                    </ul>
                </div>
            </div>
            <div className="w-full justify-center flex">
                <Button
                    className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-1/2"
                    // onClick={nextPageClick}
                >
                    Proceed
                </Button>
            </div>
        </div>
    );
}

export default Page;
