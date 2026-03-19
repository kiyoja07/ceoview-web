export type MessageSendResult = {
  success: true;
};

export type EmailSendInput = {
  to: string;
  title: string;
  body: string;
};

export type SmsSendInput = {
  to: string;
  content: string;
  subject?: string;
};

export type KakaoMessageButton = {
  type: "WL";
  name: string;
  mobileUrl: string;
  pcUrl?: string;
};

export type KakaoSendInput = {
  to: string;
  body: string;
  templateCode?: string;
  buttons?: KakaoMessageButton[];
};
