import { type Template } from "@/lib/types";

export function createEmptyTemplate(): Template {
  return {
    id: crypto.randomUUID(),
    name: "Novo Template",
    description: "Descreva rapidamente o objetivo desta mensagem.",
    queueUrl: "",
    jsonBody: JSON.stringify(
      {
        eventType: "order.created",
        orderId: "{{orderId}}",
        customerEmail: "{{@email}}",
        correlationId: "{{@uuid}}",
      },
      null,
      2,
    ),
    messageAttributes: [
      {
        key: "source",
        type: "String",
        value: "catalogo-mensagens",
      },
    ],
  };
}

export function createMockTemplates(): Template[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Pedido criado",
      description: "Evento padrão de criação de pedido.",
      queueUrl: "",
      jsonBody: JSON.stringify(
        {
          eventType: "order.created",
          orderId: "{{orderId}}",
          userId: "{{userId}}",
          customerEmail: "{{@email}}",
          createdAt: "{{@date.recent}}",
        },
        null,
        2,
      ),
      messageAttributes: [
        { key: "domain", type: "String", value: "orders" },
        { key: "traceId", type: "String", value: "{{@uuid}}" },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Usuário atualizado",
      description: "Mensagem para sincronização de dados de usuário.",
      queueUrl: "",
      jsonBody: JSON.stringify(
        {
          eventType: "user.updated",
          userId: "{{userId}}",
          email: "{{@email}}",
          fullName: "{{@fullName}}",
          company: "Acme Corp",
        },
        null,
        2,
      ),
      messageAttributes: [
        { key: "domain", type: "String", value: "users" },
        { key: "version", type: "Number", value: "1" },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Pagamento confirmado",
      description: "Evento para confirmação de pagamento no billing.",
      queueUrl: "",
      jsonBody: JSON.stringify(
        {
          eventType: "payment.confirmed",
          paymentId: "{{paymentId}}",
          orderId: "{{orderId}}",
          amount: "{{amount}}",
          transactionRef: "{{@alphanumeric}}",
        },
        null,
        2,
      ),
      messageAttributes: [
        { key: "domain", type: "String", value: "billing" },
        { key: "priority", type: "String", value: "high" },
      ],
    },
  ];
}
