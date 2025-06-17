"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const isLoadingPage = pathname === "/";

  if (isLoadingPage) {
    return null;
  }

  return <Navbar />;
}
