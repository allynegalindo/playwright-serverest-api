import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export const schemaMatchers = {
  toMatchSchema(received, schema) {
    const validate = ajv.compile(schema); // o Ajv guarda em cache o schema já compilado
    const pass = validate(received);

    return {
      pass,
      message: () =>
        pass
          ? `Esperava que a resposta NÃO seguisse o schema "${schema.title}"`
          : `A resposta não segue o schema "${schema.title}":\n` +
            `${ajv.errorsText(validate.errors, { separator: '\n' })}\n\n` +
            `Recebido: ${JSON.stringify(received, null, 2)}`,
    };
  },
};
