const { BadRequestException } = require('@nestjs/common');

const ALLOWED_FIELDS = new Set([
  'first_name',
  'middle_name',
  'last_name',
  'date_hired',
]);

function validateEmployeeInput(payload, partial = false) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('An employee information object is required.');
  }

  const fields = Object.keys(payload);
  if (fields.length === 0) {
    throw new BadRequestException('Provide employee information.');
  }

  const unknown = fields.filter((field) => !ALLOWED_FIELDS.has(field));
  if (unknown.length) {
    throw new BadRequestException(`Unrecognized or read-only fields: ${unknown.join(', ')}`);
  }

  const result = {};
  for (const field of ['first_name', 'last_name']) {
    if (!partial || Object.hasOwn(payload, field)) {
      const value = payload[field];
      if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
        throw new BadRequestException(`${field} must be a non-empty string of at most 100 characters.`);
      }
      result[field] = value.trim();
    }
  }

  if (Object.hasOwn(payload, 'middle_name')) {
    const value = payload.middle_name;
    if (value === null || value === '') {
      result.middle_name = null;
    } else if (typeof value === 'string' && value.trim().length <= 100) {
      result.middle_name = value.trim() || null;
    } else {
      throw new BadRequestException('middle_name must be a string of at most 100 characters or null.');
    }
  }

  if (!partial || Object.hasOwn(payload, 'date_hired')) {
    const value = payload.date_hired;
    const validFormat = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = validFormat ? new Date(`${value}T00:00:00.000Z`) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('date_hired must be a valid date in YYYY-MM-DD format.');
    }
    result.date_hired = value;
  }

  return result;
}

function parseEmployeeId(id) {
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) {
    throw new BadRequestException('Employee ID must be a positive integer.');
  }
  const employeeId = Number(id);
  if (!Number.isSafeInteger(employeeId) || employeeId > 2147483647) {
    throw new BadRequestException('Employee ID is outside the valid range.');
  }
  return employeeId;
}

module.exports = { validateEmployeeInput, parseEmployeeId };
