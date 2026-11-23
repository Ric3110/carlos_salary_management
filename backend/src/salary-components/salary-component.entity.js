const { EntitySchema } = require('typeorm');

const SalaryComponent = new EntitySchema({
  name: 'SalaryComponent',
  tableName: 'salary_components',
  columns: {
    salary_component_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    name: { type: 'varchar', length: 100 },
    is_deleted: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
  },
});

module.exports = { SalaryComponent };
