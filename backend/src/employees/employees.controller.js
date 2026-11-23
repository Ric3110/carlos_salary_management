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
const { EmployeesService } = require('./employees.service');

class EmployeesController {
  constructor(employeesService) {
    this.employeesService = employeesService;
  }

  create(body) {
    return this.employeesService.create(body);
  }

  findAll() {
    return this.employeesService.findAll();
  }

  findOne(id) {
    return this.employeesService.findOne(id);
  }

  update(id, body) {
    return this.employeesService.update(id, body);
  }
}


function registerRoute(name, decorator, bindings = []) {
  const prototype = EmployeesController.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
  decorator(prototype, name, descriptor);
  if (bindings.length) {
    Bind(...bindings)(prototype, name, descriptor);
  }
}

registerRoute('create', Post(), [Body()]);
registerRoute('findAll', Get());
registerRoute('findOne', Get(':id'), [Param('id')]);
registerRoute('update', Patch(':id'), [Param('id'), Body()]);

Dependencies(EmployeesService)(EmployeesController);
Controller('employees')(EmployeesController);

module.exports = { EmployeesController };
