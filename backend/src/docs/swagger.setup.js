'use strict';

const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { schemas, ref } = require('./swagger.schemas');


const tags = [
  { name: 'Employees', description: 'Onboard employees, view records, and edit employee information.' },
  { name: 'Salary Assignments', description: 'Assign or update the monthly basic salary for an employee.' },
  { name: 'Salary Components', description: 'Maintain the reusable catalog of active salary component names.' },
  { name: 'Employee Salary Components', description: 'Assign reusable components and individual amounts to employees.' },
  { name: 'Salary Rates', description: 'Compute PHP salary rates from basic salary and active components.' },
];

const employeeId = {
  name: 'employeeId', description: 'Auto-generated employee ID (positive integer).',
};
const id = { name: 'id', description: 'Auto-generated employee ID (positive integer).' };
const componentId = {
  name: 'componentId', description: 'Active salary component ID (positive integer).',
};

const operations = [
  {
    method: 'post', path: '/employees', tag: 'Employees',
    summary: 'Create an employee',
    description: 'PostgreSQL automatically generates employee_id. Middle name is optional.',
    body: 'EmployeeCreate', output: 'Employee', errors: [400],
  },
  {
    method: 'get', path: '/employees', tag: 'Employees',
    summary: 'List all employees', output: 'Employee', array: true,
  },
  {
    method: 'get', path: '/employees/{id}', tag: 'Employees',
    summary: 'Get an employee by ID', params: [id], output: 'Employee', errors: [400, 404],
  },
  {
    method: 'patch', path: '/employees/{id}', tag: 'Employees',
    summary: 'Update employee information',
    description: 'Send only the fields to update. employee_id cannot be modified.',
    params: [id], body: 'EmployeeUpdate', output: 'Employee', errors: [400, 404],
  },

  {
    method: 'post', path: '/salary-assignments', tag: 'Salary Assignments',
    summary: 'Assign an employee’s initial monthly basic salary',
    description: 'A second active salary assignment for the same employee is rejected. Use PATCH to update.',
    body: 'SalaryAssignmentCreate', output: 'SalaryAssignment', errors: [400, 404, 409],
  },
  {
    method: 'get', path: '/salary-assignments', tag: 'Salary Assignments',
    summary: 'List employees with current basic salaries',
    description: 'Includes employees who have no salary assignment (null salary fields).',
    output: 'SalaryAssignment', array: true,
  },
  {
    method: 'get', path: '/salary-assignments/{employeeId}', tag: 'Salary Assignments',
    summary: 'Get current basic salary for an employee',
    params: [employeeId], output: 'SalaryAssignment', errors: [400, 404],
  },
  {
    method: 'patch', path: '/salary-assignments/{employeeId}', tag: 'Salary Assignments',
    summary: 'Update an existing monthly basic salary',
    params: [employeeId], body: 'SalaryAssignmentUpdate', output: 'SalaryAssignment',
    errors: [400, 404],
  },

  {
    method: 'post', path: '/salary-components', tag: 'Salary Components',
    summary: 'Create a reusable salary component name',
    description: 'There is no predefined catalog. Duplicate active names (case-insensitive) are rejected.',
    body: 'ComponentCreate', output: 'Component', errors: [400, 409],
  },
  {
    method: 'get', path: '/salary-components', tag: 'Salary Components',
    summary: 'List active salary component names', output: 'Component', array: true,
  },
  {
    method: 'get', path: '/salary-components/{componentId}', tag: 'Salary Components',
    summary: 'Get an active salary component',
    params: [componentId], output: 'Component', errors: [400, 404],
  },
  {
    method: 'patch', path: '/salary-components/{componentId}', tag: 'Salary Components',
    summary: 'Rename an active salary component',
    params: [componentId], body: 'ComponentUpdate', output: 'Component',
    errors: [400, 404, 409],
  },
  {
    method: 'delete', path: '/salary-components/{componentId}', tag: 'Salary Components',
    summary: 'Soft-delete a catalog component',
    description: 'Also soft-deletes active employee assignments for this component, retaining history.',
    params: [componentId], output: 'ComponentDeleteResult', errors: [400, 404],
  },

  {
    method: 'get', path: '/employees/{employeeId}/salary-components', tag: 'Employee Salary Components',
    summary: 'List active component assignments for an employee',
    params: [employeeId], output: 'EmployeeComponent', array: true, errors: [400, 404],
  },
  {
    method: 'post', path: '/employees/{employeeId}/salary-components', tag: 'Employee Salary Components',
    summary: 'Assign a reusable component to an employee',
    description: 'Each employee may have at most one active assignment per component.',
    params: [employeeId], body: 'EmployeeComponentCreate', output: 'EmployeeComponent',
    errors: [400, 404, 409],
  },
  {
    method: 'patch', path: '/employees/{employeeId}/salary-components/{componentId}',
    tag: 'Employee Salary Components',
    summary: 'Update a component amount for an employee',
    params: [employeeId, componentId], body: 'EmployeeComponentUpdate',
    output: 'EmployeeComponent', errors: [400, 404],
  },
  {
    method: 'delete', path: '/employees/{employeeId}/salary-components/{componentId}',
    tag: 'Employee Salary Components',
    summary: 'Soft-delete one employee’s component assignment',
    description: 'Does not delete the reusable component from the global catalog.',
    params: [employeeId, componentId], output: 'EmployeeComponentDeleteResult',
    errors: [400, 404],
  },

  {
    method: 'get', path: '/salary-rates', tag: 'Salary Rates',
    summary: 'List employees available for salary rate computation',
    output: 'SalaryRatesListItem', array: true,
  },
  {
    method: 'get', path: '/salary-rates/{employeeId}', tag: 'Salary Rates',
    summary: 'Calculate current employee salary rates',
    description: 'Returns basic salary, each active component, components subtotal, and total; annual = monthly × 12, daily = annual ÷ 314, hourly = daily ÷ 8, per-minute = hourly ÷ 60. All amounts in PHP.',
    params: [employeeId], output: 'SalaryRates', errors: [400, 404, 409],
  },
];

function applyDocumentation(document) {
  document.tags = tags;
  document.components = document.components || {};
  document.components.schemas = { ...(document.components.schemas || {}), ...schemas };

  for (const operation of operations) {
    const target = document.paths?.[operation.path]?.[operation.method];
    if (!target) {
      throw new Error(
        `Swagger: missing route ${operation.method.toUpperCase()} ${operation.path}. ` +
        'Check whether the controller route changed or its module is registered.',
      );
    }

    target.tags = [operation.tag];
    target.summary = operation.summary;
    if (operation.description) target.description = operation.description;

    if (operation.params?.length) {
      target.parameters = operation.params.map(({ name, description }) => ({
        name, in: 'path', required: true, description,
        schema: { type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647 },
        example: 1,
      }));
    }

    if (operation.body) {
      target.requestBody = {
        required: true,
        content: { 'application/json': { schema: ref(operation.body) } },
      };
    }

    const okStatus = operation.method === 'post' ? '201' : '200';
    target.responses = {
      [okStatus]: {
        description: operation.method === 'post' ? 'Created successfully' : 'Request successful',
        content: {
          'application/json': {
            schema: operation.array
              ? { type: 'array', items: ref(operation.output) }
              : ref(operation.output),
          },
        },
      },
    };
    for (const code of (operation.errors || [])) {
      const desc = {
        400: 'Invalid request or input',
        404: 'Employee, component, or assignment not found',
        409: 'Conflicting assignment or missing salary prerequisite',
      }[code];
      target.responses[String(code)] = {
        description: desc,
        content: { 'application/json': { schema: ref('ErrorResponse') } },
      };
    }
  }
  return document;
}

function setupSwagger(app) {
  const configuration = new DocumentBuilder()
    .setTitle('Employee Onboarding and Salary Management API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, configuration);
  applyDocumentation(document);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { docExpansion: 'list', displayRequestDuration: true },
  });
  return document;
}

module.exports = { setupSwagger, applyDocumentation, operations };
