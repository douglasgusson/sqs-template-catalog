import { fakerPT_BR as faker } from "@faker-js/faker";

export const GENERATOR_PREFIX = "@";

export interface GeneratorDefinition {
  description: string;
  generate: () => string | number | boolean;
}

function generateCpfDigits(): string {
  const baseDigits = Array.from({ length: 9 }, () =>
    faker.number.int({ min: 0, max: 9 }),
  );

  const calculateVerifierDigit = (digits: number[]) => {
    const weightedSum = digits.reduce(
      (sum, digit, index) => sum + digit * (digits.length + 1 - index),
      0,
    );
    const mod = weightedSum % 11;

    return mod < 2 ? 0 : 11 - mod;
  };

  const firstVerifierDigit = calculateVerifierDigit(baseDigits);
  const secondVerifierDigit = calculateVerifierDigit([
    ...baseDigits,
    firstVerifierDigit,
  ]);

  return [...baseDigits, firstVerifierDigit, secondVerifierDigit].join("");
}

const LOCATION_GENERATORS: Record<string, GeneratorDefinition> = {
  "location.country": {
    description: "Gera país.",
    generate: () => faker.location.country(),
  },
  "location.state": {
    description: "Gera estado.",
    generate: () => faker.location.state(),
  },
  "location.zipCode": {
    description: "Gera CEP.",
    generate: () => faker.location.zipCode(),
  },
  "location.streetAddress": {
    description: "Gera endereço.",
    generate: () => faker.location.streetAddress(),
  },
  "location.city": {
    description: "Gera cidade.",
    generate: () => faker.location.city(),
  },
};

const DATE_GENERATORS: Record<string, GeneratorDefinition> = {
  "date.past": {
    description: "Gera uma data passada em ISO-8601.",
    generate: () => faker.date.past().toISOString(),
  },
  "date.future": {
    description: "Gera uma data futura em ISO-8601.",
    generate: () => faker.date.future().toISOString(),
  },
  "date.recent": {
    description: "Gera uma data recente em ISO-8601.",
    generate: () => faker.date.recent().toISOString(),
  },
  "date.soon": {
    description: "Gera uma data próxima em ISO-8601.",
    generate: () => faker.date.soon().toISOString(),
  },
  "date.timestamp": {
    description: "Gera timestamp ISO-8601 no instante atual.",
    generate: () => new Date().toISOString(),
  },
};

const VEHICLE_GENERATORS: Record<string, GeneratorDefinition> = {
  "vehicle.manufacturer": {
    description: "Gera fabricante de veículo.",
    generate: () => faker.vehicle.manufacturer(),
  },
  "vehicle.model": {
    description: "Gera modelo de veículo.",
    generate: () => faker.vehicle.model(),
  },
  "vehicle.color": {
    description: "Gera cor de veículo.",
    generate: () => faker.vehicle.color(),
  },
  "vehicle.vin": {
    description: "Gera número de identificação do veículo (chassi).",
    generate: () => faker.vehicle.vin(),
  },
};

const PERSON_GENERATORS: Record<string, GeneratorDefinition> = {
  "person.fullName": {
    description: "Gera nome completo.",
    generate: () => faker.person.fullName(),
  },
  "person.firstName": {
    description: "Gera primeiro nome.",
    generate: () => faker.person.firstName(),
  },
  "person.lastName": {
    description: "Gera último nome.",
    generate: () => faker.person.lastName(),
  },
  "person.sex": {
    description: "Gera gênero (masculino, feminino ou outro).",
    generate: () => faker.person.sex(),
  },
};

const ALFA_NUMERIC_GENERATORS: Record<string, GeneratorDefinition> = {
  "alphanumeric.short": {
    description: "Gera string alfanumérica curta (10 caracteres).",
    generate: () => faker.string.alphanumeric(10),
  },
  "alphanumeric.medium": {
    description: "Gera string alfanumérica média (20 caracteres).",
    generate: () => faker.string.alphanumeric(20),
  },
  "alphanumeric.long": {
    description: "Gera string alfanumérica longa (50 caracteres).",
    generate: () => faker.string.alphanumeric(50),
  },
};

const NUMBER_GENERATORS: Record<string, GeneratorDefinition> = {
  "number.int": {
    description: "Gera número inteiro aleatório.",
    generate: () => faker.number.int(),
  },
  "number.float": {
    description: "Gera número decimal aleatório.",
    generate: () => faker.number.float(),
  },
};

const FINANCE_GENERATORS: Record<string, GeneratorDefinition> = {
  "finance.amount": {
    description: "Gera valor monetário aleatório.",
    generate: () => faker.finance.amount(),
  },
  "finance.currencyCode": {
    description: "Gera código de moeda (ISO 4217).",
    generate: () => faker.finance.currencyCode(),
  },
  "finance.iban": {
    description: "Gera número de conta bancária internacional (IBAN).",
    generate: () => faker.finance.iban(),
  },
};

const INTERNET_GENERATORS: Record<string, GeneratorDefinition> = {
  email: {
    description: "Gera um e-mail aleatório.",
    generate: () => faker.internet.email(),
  },
  url: {
    description: "Gera uma URL aleatória.",
    generate: () => faker.internet.url(),
  },
};

export const GENERATORS: Record<string, GeneratorDefinition> = {
  ...LOCATION_GENERATORS,
  ...DATE_GENERATORS,
  ...VEHICLE_GENERATORS,
  ...PERSON_GENERATORS,
  ...ALFA_NUMERIC_GENERATORS,
  ...NUMBER_GENERATORS,
  ...FINANCE_GENERATORS,
  ...INTERNET_GENERATORS,
  uuid: {
    description: "Gera um UUID v4.",
    generate: () => faker.string.uuid(),
  },
  cpf: {
    description: "Gera um CPF numérico válido (11 dígitos).",
    generate: () => generateCpfDigits(),
  },
  phone: {
    description: "Gera telefone.",
    generate: () => faker.phone.number(),
  },
  boolean: {
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
