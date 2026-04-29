export type PendingTransferRequest = {
  id: string;
  createdAt: string;
  fromOrganization: {
    id: string;
    organizationNumber: string;
    organizationName: string | null;
  } | null;
  toOrganization: {
    id: string;
    organizationNumber: string;
    organizationName: string | null;
  };
};

export type InviteContactType = "email" | "phone";

export type InviteResult = {
  ok: boolean;
  message: string;
};
