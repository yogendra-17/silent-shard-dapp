'use client';
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  // if paired 
  if (true) {
    router.replace("/IntroPage")
  }
}
