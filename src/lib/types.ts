export type MessageAttributeType = "String" | "Number" | "Binary";

export interface TemplateMessageAttribute {
  key: string;
  type: MessageAttributeType;
  value: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  queueUrl: string;
  jsonBody: string;
  messageAttributes: TemplateMessageAttribute[];
}

export type HistoryStatus = "success" | "error";

export interface SendHistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  queueUrl: string;
  sentAt: string;
  status: HistoryStatus;
  finalPayload: string;
  finalMessageAttributes: TemplateMessageAttribute[];
  responseMessageId?: string;
  errorMessage?: string;
}

export interface PublishMessageInput {
  queueUrl: string;
  messageBody: string;
  messageAttributes: TemplateMessageAttribute[];
}

export interface PublishMessageResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}
