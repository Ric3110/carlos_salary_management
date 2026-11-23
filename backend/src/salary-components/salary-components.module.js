const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryComponent } = require('./salary-component.entity');
const { EmployeeSalaryComponent } = require('./employee-salary-component.entity');
const { SalaryComponentsController } = require('./salary-components.controller');
const { EmployeeSalaryComponentsController } = require('./employee-salary-components.controller');
const { SalaryComponentsService } = require('./salary-components.service');

class SalaryComponentsModule {}

Module({
  imports: [TypeOrmModule.forFeature([SalaryComponent, EmployeeSalaryComponent, Employee])],
  controllers: [SalaryComponentsController, EmployeeSalaryComponentsController],
  providers: [SalaryComponentsService],
})(SalaryComponentsModule);

module.exports = { SalaryComponentsModule };
