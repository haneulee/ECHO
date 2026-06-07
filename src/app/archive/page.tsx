import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Memories",
};

export default function ArchiveRedirectPage() {
  redirect("/memories");
}
