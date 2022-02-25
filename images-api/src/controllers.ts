import { requestGet, requestPost } from "./api";
import { Image, UploadURL } from "./models";
import { CFDirectUploadURL, CFImage, CFResponse } from "./responses";

const serviceIdKey = "serviceID";
const serviceIdValue = "til.webdonalds.org";

const uploaderIdKey = "uploaderID";

export async function listAllImages(): Promise<Image[]> {
  const response = await requestGet("/images/v1");
  const images = (await response.json<CFResponse<{ images: CFImage[] }>>()).result.images;
  return images
    .filter((i) => i.meta && (i.meta[serviceIdKey] === serviceIdValue))
    .map((i) => ({
      id: i.id,
      uploaderID: i.meta["uploaderID"],
      publicURL: i.variants.filter((i) => i.endsWith("/public"))[0],
      thumbnailURL: i.variants.filter((i) => i.endsWith("/thumbnail"))[0],
    }));
}

export async function generateUploadUrl(request: Request): Promise<UploadURL> {
  const body = await request.json<{ uploaderID: string }>();
  if (!body?.uploaderID) {
    throw Error("uploaderId must be specified");
  }

  const response = await requestPost("/images/v2/direct_upload", {
    requireSignedURLs: false,
    metadata: JSON.stringify({
      [serviceIdKey]: serviceIdValue,
      [uploaderIdKey]: body.uploaderID,
    }),
  });
  return { url: (await response.json<CFResponse<CFDirectUploadURL>>()).result.uploadURL };
}
