'use client';
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  if (true) {
    router.replace("/IntroPage")
  }
}
