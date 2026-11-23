const {
  Controller,
  Dependencies,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Bind,
} = require('@nestjs/common');
const { SalaryComponentsService } = require('./salary-components.service');

class EmployeeSalaryComponentsController {
  constructor(service) {
    this.service = service;
  }

  findAll(employeeId) { return this.service.listEmployeeComponents(employeeId); }
  create(employeeId, body) { return this.service.assignToEmployee(employeeId, body); }
  update(employeeId, componentId, body) {
    return this.service.updateEmployeeComponent(employeeId, componentId, body);
  }
  remove(employeeId, componentId) {
    return this.service.removeEmployeeComponent(employeeId, componentId);
  }
}

function registerRoute(method, decorator, bindings = []) {
  const prototype = EmployeeSalaryComponentsController.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
  decorator(prototype, method, descriptor);
  if (bindings.length) Bind(...bindings)(prototype, method, descriptor);
}

registerRoute('findAll', Get(), [Param('employeeId')]);
registerRoute('create', Post(), [Param('employeeId'), Body()]);
registerRoute('update', Patch(':componentId'), [
  Param('employeeId'), Param('componentId'), Body(),
]);
registerRoute('remove', Delete(':componentId'), [
  Param('employeeId'), Param('componentId'),
]);

Dependencies(SalaryComponentsService)(EmployeeSalaryComponentsController);
Controller('employees/:employeeId/salary-components')(EmployeeSalaryComponentsController);

module.exports = { EmployeeSalaryComponentsController };
