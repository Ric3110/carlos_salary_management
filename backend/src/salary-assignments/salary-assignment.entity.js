const { EntitySchema } = require('typeorm');

// Maps to the existing PostgreSQL table. synchronize is disabled in AppModule.
const SalaryAssignment = new EntitySchema({
  name: 'SalaryAssignment',
  tableName: 'salary_assignments',
  columns: {
    salary_assignment_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    employee_id: {
      type: 'int',
      unique: true,
    },
    monthly_basic_salary: {
      type: 'numeric',
      precision: 12,
      scale: 2,
    },
    created_at: {
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});

module.exports = { SalaryAssignment };
