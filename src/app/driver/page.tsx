import type { Metadata } from "next";
import DriverWrapper from "./components/DriverWrapper";

export const metadata: Metadata = {
  title: "Driver - TP Dumpsters",
  robots: { index: false, follow: false },
};

export default function DriverPage() {
  return <DriverWrapper />;
}
