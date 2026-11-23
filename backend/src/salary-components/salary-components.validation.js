const { BadRequestException } = require('@nestjs/common');

const MAX_PG_INT = 2147483647;

function parseId(value, label) {
  const text = typeof value === 'number' && Number.isSafeInteger(value)
    ? String(value)
    : value;
  if (typeof text !== 'string' || !/^[1-9]\d*$/.test(text)) {
    throw new BadRequestException(`${label} must be a positive integer.`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_PG_INT) {
    throw new BadRequestException(`${label} is outside the valid range.`);
  }
  return parsed;
}

function validateFields(payload, allowed, required) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('A JSON object is required.');
  }
  const keys = Object.keys(payload);
  if (!keys.length) {
    throw new BadRequestException('At least one field must be provided.');
  }
  const unknown = keys.filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new BadRequestException(`Unrecognized or read-only fields: ${unknown.join(', ')}`);
  }
  for (const field of required) {
    if (!Object.hasOwn(payload, field)) {
      throw new BadRequestException(`${field} is required.`);
    }
  }
}

function parseName(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
    throw new BadRequestException('name must be a non-empty string of at most 100 characters.');
  }
  return value.trim();
}

function parseAmount(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('amount must be a non-negative monetary value.');
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new BadRequestException('amount must be finite.');
  }
  const text = String(value).trim();
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(text)) {
    throw new BadRequestException(
      'amount must be from 0 to 9999999999.99 with at most two decimal places.',
    );
  }
  const [whole, fraction = ''] = text.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

function validateComponentNameInput(payload) {
  validateFields(payload, ['name'], ['name']);
  return { name: parseName(payload.name) };
}

function validateAssignmentInput(payload, partial = false) {
  if (partial) {
    validateFields(payload, ['amount'], ['amount']);
    return { amount: parseAmount(payload.amount) };
  }
  validateFields(payload, ['salary_component_id', 'amount'], ['salary_component_id', 'amount']);
  return {
    salary_component_id: parseId(payload.salary_component_id, 'salary_component_id'),
    amount: parseAmount(payload.amount),
  };
}

module.exports = {
  parseId,
  validateComponentNameInput,
  validateAssignmentInput,
};
