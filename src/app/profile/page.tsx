import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Your daily encounters",
};

export default function ProfileRedirectPage() {
  redirect("/main");
}
