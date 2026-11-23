const { EntitySchema } = require('typeorm');

const EmployeeSalaryComponent = new EntitySchema({
  name: 'EmployeeSalaryComponent',
  tableName: 'employee_salary_components',
  columns: {
    employee_salary_component_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    employee_id: { type: 'int' },
    salary_component_id: { type: 'int' },
    amount: { type: 'numeric', precision: 12, scale: 2 },
    is_deleted: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
  },
});

module.exports = { EmployeeSalaryComponent };
