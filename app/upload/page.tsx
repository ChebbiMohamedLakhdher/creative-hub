import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UploadForm from "@/components/ui/UploadForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Your Work",
};

export default async function UploadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Upload Your Work</h1>
        <p className="mt-2 text-muted">
          Share your creative projects with the community
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <UploadForm />
      </div>
    </div>
  );
}
