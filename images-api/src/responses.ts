export type CFImage = {
  id: string;
  filename: string;
  metadata: object;
  requireSignedURLs: { [_: string]: string };
  variants: {
    thumbnail: string;
    hero: string;
    original: string;
  };
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
