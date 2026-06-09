import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getRequestContext } from "@/lib/context";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({ pdf: { maxFileSize: "32MB" }, image: { maxFileSize: "16MB" } })
    .middleware(async () => {
      const ctx = await getRequestContext();
      if (!ctx) throw new Error("Não autorizado");
      return { tenantId: ctx.tenantId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl ?? file.url };
    }),

  materialUploader: f({ pdf: { maxFileSize: "32MB" }, image: { maxFileSize: "16MB" } })
    .middleware(async () => {
      const ctx = await getRequestContext();
      if (!ctx) throw new Error("Não autorizado");
      return { tenantId: ctx.tenantId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl ?? file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
