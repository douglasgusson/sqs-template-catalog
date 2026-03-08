"use server";

import {
  type MessageAttributeValue,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

import { type PublishMessageInput, type PublishMessageResult } from "@/lib/types";

function toAwsMessageAttributes(input: PublishMessageInput["messageAttributes"]) {
  // Converte a estrutura interna do app para o formato nativo do AWS SDK.
  return input.reduce<Record<string, MessageAttributeValue>>((result, attribute) => {
    if (!attribute.key.trim()) {
      return result;
    }

    if (attribute.type === "Binary") {
      result[attribute.key] = {
        DataType: "Binary",
        BinaryValue: Buffer.from(attribute.value, "base64"),
      };

      return result;
    }

    result[attribute.key] = {
      DataType: attribute.type,
      StringValue: attribute.value,
    };

    return result;
  }, {});
}

export async function publishSqsMessageAction(
  input: PublishMessageInput,
): Promise<PublishMessageResult> {
  // A action roda no servidor, então credenciais e configuração AWS ficam seguras no backend.
  const region = process.env.AWS_REGION ?? "us-east-1";
  const sqsClient = new SQSClient({
    region,
    endpoint: process.env.AWS_SQS_ENDPOINT,
  });

  try {
    const response = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: input.queueUrl,
        MessageBody: input.messageBody,
        MessageAttributes: toAwsMessageAttributes(input.messageAttributes),
      }),
    );

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao enviar mensagem para o SQS.",
    };
  }
}
