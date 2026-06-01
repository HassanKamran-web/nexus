import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";

const f = createUploadthing();

export const ourFileRouter = {
  
  pdfUploader: f({ pdf: { maxFileSize: "8MB" } })
    .middleware(async () => {
      const session = await getServerSession();
      if (!session) throw new Error("Unauthorized");
      return { userEmail: session.user?.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userEmail, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;