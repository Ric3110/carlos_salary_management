const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryAssignment } = require('./salary-assignment.entity');
const { SalaryAssignmentsController } = require('./salary-assignments.controller');
const { SalaryAssignmentsService } = require('./salary-assignments.service');

class SalaryAssignmentsModule {}

Module({
  imports: [TypeOrmModule.forFeature([SalaryAssignment, Employee])],
  controllers: [SalaryAssignmentsController],
  providers: [SalaryAssignmentsService],
})(SalaryAssignmentsModule);

module.exports = { SalaryAssignmentsModule };
