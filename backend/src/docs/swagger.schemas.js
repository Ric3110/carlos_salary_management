'use strict';

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const id = (description) => ({
  type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647,
  description, example: 1,
});
const dateTime = { type: 'string', format: 'date-time', readOnly: true,
  example: '2026-11-23T02:00:00.000Z' };
const date = { type: 'string', format: 'date', example: '2026-11-23' };
const money = { type: 'string', pattern: '^(0|[1-9]\\d{0,9})(\\.\\d{1,2})?$',
  description: 'Non-negative amount, up to 10 digits before the decimal; maximum 2 decimal places. A number or decimal string is accepted in requests; responses use strings.',
  example: '25000.00' };
const moneyInput = {
  oneOf: [
    { type: 'number', minimum: 0, maximum: 9999999999.99, multipleOf: 0.01, example: 25000 },
    money,
  ],
  description: 'PHP amount as a JSON number or decimal string. Maximum two decimal places.',
};
const name = { type: 'string', minLength: 1, maxLength: 100,
  description: 'Nonblank text; leading and trailing spaces are removed.', example: 'Alex' };

const employeeFields = {
  first_name: { ...name, example: 'Alex' },
  middle_name: { type: 'string', maxLength: 100, nullable: true, example: 'M' },
  last_name: { ...name, example: 'Reyes' },
  date_hired: date,
};
const salaryComponentFields = {
  name: { ...name, example: 'Transportation Allowance' },
};
const formattedRate = {
  type: 'object',
  properties: Object.fromEntries(
    ['monthly', 'annual', 'daily', 'hourly', 'per_minute'].map((key) =>
      [key, { type: 'string', description: 'Philippine Peso (₱), formatted to two decimals', example: '₱1,000.00' }]),
  ),
};
const rateFields = {
  monthly: { type: 'string', example: '30000.00' },
  annual: { type: 'string', example: '360000.00' },
  daily: { type: 'string', example: '1146.50' },
  hourly: { type: 'string', example: '143.31' },
  per_minute: { type: 'string', example: '2.39' },
  formatted: formattedRate,
};

const schemas = {
  EmployeeCreate: {
    type: 'object', additionalProperties: false,
    required: ['first_name', 'last_name', 'date_hired'],
    properties: employeeFields,
  },
  EmployeeUpdate: {
    type: 'object', additionalProperties: false, minProperties: 1,
    properties: employeeFields,
  },
  Employee: {
    type: 'object',
    required: ['employee_id', 'first_name', 'last_name', 'date_hired'],
    properties: {
      employee_id: id('Auto-generated employee identifier (SERIAL).'),
      ...employeeFields,
      created_at: dateTime, updated_at: dateTime,
    },
  },
  SalaryAssignmentCreate: {
    type: 'object', additionalProperties: false,
    required: ['employee_id', 'monthly_basic_salary'],
    properties: { employee_id: id('Existing employee ID.'), monthly_basic_salary: moneyInput },
  },
  SalaryAssignmentUpdate: {
    type: 'object', additionalProperties: false,
    required: ['monthly_basic_salary'],
    properties: { monthly_basic_salary: moneyInput },
  },
  SalaryAssignment: {
    type: 'object',
    properties: {
      employee_id: id('Employee ID'),
      first_name: { type: 'string', example: 'Alex' },
      middle_name: { type: 'string', nullable: true, example: 'M' },
      last_name: { type: 'string', example: 'Reyes' },
      salary_assignment_id: { ...id('Salary assignment ID, if one exists.'), nullable: true },
      monthly_basic_salary: { ...money, nullable: true },
      created_at: { ...dateTime, nullable: true },
      updated_at: { ...dateTime, nullable: true },
    },
  },
  ComponentCreate: {
    type: 'object', additionalProperties: false,
    required: ['name'], properties: salaryComponentFields,
  },
  ComponentUpdate: {
    type: 'object', additionalProperties: false,
    required: ['name'], properties: salaryComponentFields,
  },
  Component: {
    type: 'object',
    properties: {
      salary_component_id: id('Auto-generated reusable component ID.'),
      ...salaryComponentFields,
      is_deleted: { type: 'boolean', example: false },
      created_at: dateTime, updated_at: dateTime,
    },
  },
  EmployeeComponentCreate: {
    type: 'object', additionalProperties: false,
    required: ['salary_component_id', 'amount'],
    properties: {
      salary_component_id: id('ID of an active component in the catalog.'),
      amount: moneyInput,
    },
  },
  EmployeeComponentUpdate: {
    type: 'object', additionalProperties: false,
    required: ['amount'],
    properties: { amount: moneyInput },
  },
  EmployeeComponent: {
    type: 'object',
    properties: {
      employee_salary_component_id: id('Assignment record identifier.'),
      employee_id: id('Employee ID'),
      salary_component_id: id('Catalog component ID'),
      name: { type: 'string', example: 'Transportation Allowance' },
      amount: money,
      created_at: dateTime, updated_at: dateTime,
    },
  },
  ComponentDeleteResult: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Salary component soft-deleted.' },
      salary_component_id: id('Deleted catalog component ID.'),
      affected_employee_assignments: { type: 'integer', minimum: 0, example: 2 },
    },
  },
  EmployeeComponentDeleteResult: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Salary component removed from employee (soft-deleted).' },
      employee_id: id('Employee ID'),
      salary_component_id: id('Removed component ID'),
    },
  },
  SalaryRatesListItem: {
    type: 'object',
    properties: {
      employee_id: id('Employee ID'),
      first_name: { type: 'string', example: 'Alex' },
      middle_name: { type: 'string', nullable: true, example: 'M' },
      last_name: { type: 'string', example: 'Reyes' },
      date_hired: date,
      has_salary_assignment: { type: 'boolean', example: true },
      monthly_basic_salary: { ...money, nullable: true },
    },
  },
  RateBreakdown: { type: 'object', properties: rateFields },
  ComponentRateBreakdown: {
    type: 'object',
    properties: {
      salary_component_id: id('Catalog component ID'),
      name: { type: 'string', example: 'Transportation Allowance' },
      ...rateFields,
    },
  },
  SalaryRates: {
    type: 'object',
    properties: {
      employee: {
        type: 'object',
        properties: {
          employee_id: id('Employee ID'),
          first_name: { type: 'string', example: 'Alex' },
          middle_name: { type: 'string', nullable: true, example: 'M' },
          last_name: { type: 'string', example: 'Reyes' },
          date_hired: date,
        },
      },
      currency: { type: 'string', enum: ['PHP'], example: 'PHP' },
      calculation_basis: {
        type: 'object',
        properties: {
          months_per_year: { type: 'integer', example: 12 },
          annual_working_days: { type: 'integer', example: 314 },
          hours_per_day: { type: 'integer', example: 8 },
          minutes_per_hour: { type: 'integer', example: 60 },
        },
      },
      breakdown: {
        type: 'object',
        properties: {
          basic_salary: ref('RateBreakdown'),
          components: { type: 'array', items: ref('ComponentRateBreakdown') },
          components_total: ref('RateBreakdown'),
          total: ref('RateBreakdown'),
        },
      },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      statusCode: { type: 'integer', example: 400 },
      message: { type: 'string', example: 'Invalid or missing input.' },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
};

module.exports = { schemas, ref };
