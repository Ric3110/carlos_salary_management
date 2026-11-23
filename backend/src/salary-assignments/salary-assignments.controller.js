const {
  Controller,
  Dependencies,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Bind,
} = require('@nestjs/common');
const { SalaryAssignmentsService } = require('./salary-assignments.service');

class SalaryAssignmentsController {
  constructor(salaryAssignmentsService) {
    this.salaryAssignmentsService = salaryAssignmentsService;
  }

  create(body) {
    return this.salaryAssignmentsService.create(body);
  }

  findAll() {
    return this.salaryAssignmentsService.findAll();
  }

  findOne(employeeId) {
    return this.salaryAssignmentsService.findOne(employeeId);
  }

  update(employeeId, body) {
    return this.salaryAssignmentsService.update(employeeId, body);
  }
}


function registerRoute(name, decorator, bindings = []) {
  const prototype = SalaryAssignmentsController.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
  decorator(prototype, name, descriptor);
  if (bindings.length) {
    Bind(...bindings)(prototype, name, descriptor);
  }
}

registerRoute('create', Post(), [Body()]);
registerRoute('findAll', Get());
registerRoute('findOne', Get(':employeeId'), [Param('employeeId')]);
registerRoute('update', Patch(':employeeId'), [Param('employeeId'), Body()]);

Dependencies(SalaryAssignmentsService)(SalaryAssignmentsController);
Controller('salary-assignments')(SalaryAssignmentsController);

module.exports = { SalaryAssignmentsController };
