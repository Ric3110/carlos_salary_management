const { BadRequestException } = require('@nestjs/common');

const MAX_PG_INT = 2147483647;

function parseEmployeeId(value) {
  const text = typeof value === 'number' && Number.isSafeInteger(value)
    ? String(value)
    : value;

  if (typeof text !== 'string' || !/^[1-9]\d*$/.test(text)) {
    throw new BadRequestException('employee_id must be a positive integer.');
  }

  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_PG_INT) {
    throw new BadRequestException('employee_id is outside the valid range.');
  }
  return parsed;
}

function parseMoney(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('monthly_basic_salary must be a non-negative amount.');
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new BadRequestException('monthly_basic_salary must be a finite amount.');
  }

  const text = String(value).trim();
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(text)) {
    throw new BadRequestException(
      'monthly_basic_salary must be between 0 and 9999999999.99, with at most 2 decimal places.',
    );
  }

  const [whole, decimals = ''] = text.split('.');
  return `${whole}.${decimals.padEnd(2, '0')}`;
}

function validateSalaryAssignmentInput(payload, partial = false) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('Provide a JSON salary assignment object.');
  }

  const allowed = partial
    ? new Set(['monthly_basic_salary'])
    : new Set(['employee_id', 'monthly_basic_salary']);

  const fields = Object.keys(payload);
  if (!fields.length) {
    throw new BadRequestException('Provide salary assignment information.');
  }

  const invalidFields = fields.filter((field) => !allowed.has(field));
  if (invalidFields.length) {
    throw new BadRequestException(`Unrecognized or read-only fields: ${invalidFields.join(', ')}`);
  }

  if (!Object.hasOwn(payload, 'monthly_basic_salary')) {
    throw new BadRequestException('monthly_basic_salary is required.');
  }

  const result = {
    monthly_basic_salary: parseMoney(payload.monthly_basic_salary),
  };

  if (!partial) {
    if (!Object.hasOwn(payload, 'employee_id')) {
      throw new BadRequestException('employee_id is required.');
    }
    result.employee_id = parseEmployeeId(payload.employee_id);
  }

  return result;
}

module.exports = { parseEmployeeId, parseMoney, validateSalaryAssignmentInput };
