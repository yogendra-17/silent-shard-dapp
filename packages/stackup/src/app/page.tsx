'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  // if paired 
  if (true) {
    router.replace("/IntroPage")
  }
}
