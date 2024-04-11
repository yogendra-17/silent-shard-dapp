"use client";
import { useState } from "react";

interface TextInputProps {
    label: string;
    placeholder: string;
    value: string;
    setValue: (value: string) => void;
    error: string;
    style?: any;
    props?: any;
}

export const TextInput = ({
    label,
    placeholder,
    value,
    setValue,
    error,
    ...props
}: TextInputProps) => {
    const handleInputChange = (e: any) => {
        e.preventDefault();
        setValue(e.target.value);
    };
    const [typing, setTyping] = useState(false);

    return (
        <div>
            <div className="w-[100%] sm:flex sm:flex-row items-center mb-4 gap-1 inline-flex">
                <div className="text-text-700 text-body2 sm:mr-4 sm:w-[80px]">
                    {label}
                </div>

                <div className="relative">
                <input
                    className={`rounded-xl px-3 py-2 xl:w-[340px] bg-white-primary border border-solid border-[#23272E] outline-none focus:border-white-disable
                ${error !== "" ? "!border-red-400" : ""}
                hover:border-gray-400
                focus:border-primary-500`}
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                    type="text"
                    {...props}
                />
                    {error && !typing && (
                        <div className="text-red-400 text-sm absolute top-[25%] right-2">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
