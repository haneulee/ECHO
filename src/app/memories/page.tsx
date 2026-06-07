import { ArchivePageView } from "@/app/memories/ArchivePageView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories",
};

export default function MemoriesPage() {
  return <ArchivePageView />;
}
