// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { cn } from '@/utils/ui';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export const AddressCopyPopover: React.FC<{ address: string; className?: string }> = ({
  address,
  className,
}) => {
  return (
    <Popover>
      <PopoverTrigger>
        <div
          className={cn('flex items-center text-[#F7F8F8] b1-bold', className)}
          onClick={async () => {
            navigator.clipboard.writeText(address);
          }}>
          {address && address.length >= 5 && (
            <span className="mr-1">
              {address.slice(0, 5)}
              {'...'}
              {address.slice(address.length - 5, address.length)}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.37315 1.75L4.375 1.75H12.8125L12.8143 1.75C13.5591 1.75212 14.2728 2.04893 14.7994 2.57558C15.3261 3.10224 15.6229 3.81592 15.625 4.56072C15.625 4.56565 15.625 4.57059 15.6249 4.57552L15.6186 4.875H15.8984C17.4733 4.875 18.75 6.15169 18.75 7.72656V16.3984C18.75 17.9733 17.4733 19.25 15.8984 19.25H7.22656C5.65169 19.25 4.375 17.9733 4.375 16.3984V16.125H4.0625L4.06072 16.125C3.31592 16.1229 2.60224 15.8261 2.07558 15.2994C1.54893 14.7728 1.25212 14.0591 1.25 13.3143L1.25 13.3125V4.875L1.25 4.87315C1.25245 4.04559 1.58228 3.25263 2.16745 2.66745C2.75263 2.08228 3.54559 1.75245 4.37315 1.75ZM5.625 16.3984C5.625 17.283 6.34204 18 7.22656 18H15.8984C16.783 18 17.5 17.283 17.5 16.3984V7.72656C17.5 6.84204 16.783 6.125 15.8984 6.125H14.9826C14.9813 6.125 14.9801 6.125 14.9789 6.125H7.22656C6.34204 6.125 5.625 6.84204 5.625 7.72656V16.3984ZM14.3684 4.875H7.22656C5.65169 4.875 4.375 6.15169 4.375 7.72656V14.875H4.06351C3.64928 14.8736 3.25239 14.7085 2.95947 14.4155C2.66656 14.1226 2.50139 13.7258 2.5 13.3115V4.87599C2.50169 4.37898 2.69988 3.9028 3.05134 3.55134C3.4028 3.19988 3.87898 3.00169 4.37599 3H12.8115C13.2258 3.00139 13.6226 3.16656 13.9155 3.45947C14.207 3.75098 14.372 4.14545 14.375 4.55751L14.3684 4.875Z"
              fill="#ECEEF2"
            />
          </svg>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="flex justify-center w-18 p-1 b2-md">
        Copied!
      </PopoverContent>
    </Popover>
  );
};
