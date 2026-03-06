import { fakerPT_BR as faker } from "@faker-js/faker";

export const GENERATOR_PREFIX = "@";

export interface GeneratorDefinition {
  description: string;
  generate: () => unknown;
}

function generateCpfDigits(): string {
  const baseDigits = Array.from({ length: 9 }, () => faker.number.int({ min: 0, max: 9 }));

  const calculateVerifierDigit = (digits: number[]) => {
    const weightedSum = digits.reduce(
      (sum, digit, index) => sum + digit * (digits.length + 1 - index),
      0,
    );
    const mod = weightedSum % 11;

    return mod < 2 ? 0 : 11 - mod;
  };

  const firstVerifierDigit = calculateVerifierDigit(baseDigits);
  const secondVerifierDigit = calculateVerifierDigit([...baseDigits, firstVerifierDigit]);

  return [...baseDigits, firstVerifierDigit, secondVerifierDigit].join("");
}

export const GENERATORS: Record<string, GeneratorDefinition> = {
  email: {
    description: "Gera um e-mail aleatório.",
    generate: () => faker.internet.email(),
  },
  uuid: {
    description: "Gera um UUID v4.",
    generate: () => crypto.randomUUID(),
  },
  timestamp: {
    description: "Gera timestamp ISO-8601 no instante atual.",
    generate: () => new Date().toISOString(),
  },
  cpf: {
    description: "Gera um CPF numérico válido (11 dígitos).",
    generate: () => generateCpfDigits(),
  },
  url: {
    description: "Gera uma URL aleatória.",
    generate: () => faker.internet.url(),
  },
  fullName: {
    description: "Gera nome completo.",
    generate: () => faker.person.fullName(),
  },
  firstName: {
    description: "Gera primeiro nome.",
    generate: () => faker.person.firstName(),
  },
  city: {
    description: "Gera cidade.",
    generate: () => faker.location.city(),
  },
  phone: {
    description: "Gera telefone.",
    generate: () => faker.phone.number(),
  },
  int: {
    description: "Gera número inteiro aleatório.",
    generate: () => faker.number.int(),
  },
  amount: {
    description: "Gera valor monetário aleatório.",
    generate: () => faker.finance.amount(),
  },
  recentDate: {
    description: "Gera uma data recente em ISO-8601.",
    generate: () => faker.date.recent().toISOString(),
  },
  pastDate: {
    description: "Gera uma data passada em ISO-8601.",
    generate: () => faker.date.past().toISOString(),
  },
  futureDate: {
    description: "Gera uma data futura em ISO-8601.",
    generate: () => faker.date.future().toISOString(),
  },
  alphanumeric: {
    description: "Gera string alfanumérica.",
    generate: () => faker.string.alphanumeric(),
  },
  isAtivo: {
    description: "Gera valor booleano true/false.",
    generate: () => faker.datatype.boolean(),
  },
};

export function listGenerators() {
  return Object.entries(GENERATORS)
    .map(([key, definition]) => ({
      key,
      token: `${GENERATOR_PREFIX}${key}`,
      description: definition.description,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function runGenerator(generatorKey: string): unknown {
  return GENERATORS[generatorKey]?.generate();
}
