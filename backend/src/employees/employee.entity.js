const { EntitySchema } = require('typeorm');

const Employee = new EntitySchema({
  name: 'Employee',
  tableName: 'employees',
  columns: {
    employee_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    first_name: { type: 'varchar', length: 100 },
    middle_name: { type: 'varchar', length: 100, nullable: true },
    last_name: { type: 'varchar', length: 100 },
    date_hired: { type: 'date' },
    created_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' },
  },
});

module.exports = { Employee };
