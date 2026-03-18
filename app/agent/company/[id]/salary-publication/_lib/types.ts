export type PublicationUpload = {
  pointerId?: string;
  uploadId: string;
  incomeType: string;
  incomeTypeLabel: string;
  fileName: string | null;
  uploadedAt: string;
  publishedAt?: string;
  companyVisible: boolean;
  publishStatus: "SAVED" | "PUBLISHED";
  canManage: boolean;
  accrualYm: string | null;
  paymentYm: string | null;
  rowCount: number;
};

export type PublicationStatusResponse = {
  success: boolean;
  uploads: PublicationUpload[];
};

export type UploadPreviewColumn = {
  key: string;
  label: string;
};

export type UploadPreviewRow = Record<string, unknown>;

export type UploadPreviewResponse = {
  success: boolean;
  upload: {
    uploadId: string;
    incomeType: string;
    incomeTypeLabel: string;
    fileName: string | null;
    uploadedAt: string;
    publishStatus: "SAVED" | "PUBLISHED";
    companyVisible: boolean;
  };
  columns: UploadPreviewColumn[];
  rows: UploadPreviewRow[];
  total: number;
  limit: number;
};

export type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

export type ActionType = "SAVED" | "PUBLISHED";
