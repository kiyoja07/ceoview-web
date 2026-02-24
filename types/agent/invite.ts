export type SendAgentInviteBody = {
  email?: string;
};

export type AgentInvitePreviewResponse = {
  organization: {
    name: string | null;
    number: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  invitedEmailMasked: string;
  expiresAt: string;
};

export type AcceptAgentInviteBody = {
  token?: string;
  email?: string;
  name?: string;
  phone?: string | null;
  agreedToJoin?: boolean;
};

export type AcceptAgentInviteResponse = {
  redirectTo: string;
  message: string;
};
