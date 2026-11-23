const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { Employee } = require('./employee.entity');
const { EmployeesController } = require('./employees.controller');
const { EmployeesService } = require('./employees.service');

class EmployeesModule {}

Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})(EmployeesModule);

module.exports = { EmployeesModule };
