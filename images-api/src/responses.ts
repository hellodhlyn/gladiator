export type CFImage = {
  id: string;
  filename: string;
  meta: object;
  requireSignedURLs: { [_: string]: string };
  variants: string[];
  uploaded: string;
};

export type CFDirectUploadURL = {
  uploadURL: string;
  id: string;
};

export type CFResponse<T> = {
  success: boolean;
  errors: string[];
  messages: string[];
  result: T;
};
