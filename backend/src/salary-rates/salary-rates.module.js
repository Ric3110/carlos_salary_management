const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryAssignment } = require('../salary-assignments/salary-assignment.entity');
const { SalaryComponent } = require('../salary-components/salary-component.entity');
const { EmployeeSalaryComponent } = require('../salary-components/employee-salary-component.entity');
const { SalaryRatesController } = require('./salary-rates.controller');
const { SalaryRatesService } = require('./salary-rates.service');

class SalaryRatesModule {}

Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      SalaryAssignment,
      SalaryComponent,
      EmployeeSalaryComponent,
    ]),
  ],
  controllers: [SalaryRatesController],
  providers: [SalaryRatesService],
})(SalaryRatesModule);

module.exports = { SalaryRatesModule };
