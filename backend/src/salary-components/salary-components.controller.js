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

class SalaryComponentsController {
  constructor(service) {
    this.service = service;
  }

  create(body) { return this.service.createComponent(body); }
  findAll() { return this.service.listComponents(); }
  findOne(componentId) { return this.service.findComponent(componentId); }
  update(componentId, body) { return this.service.updateComponent(componentId, body); }
  remove(componentId) { return this.service.deleteComponent(componentId); }
}

function registerRoute(method, decorator, bindings = []) {
  const prototype = SalaryComponentsController.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
  decorator(prototype, method, descriptor);
  if (bindings.length) Bind(...bindings)(prototype, method, descriptor);
}

registerRoute('create', Post(), [Body()]);
registerRoute('findAll', Get());
registerRoute('findOne', Get(':componentId'), [Param('componentId')]);
registerRoute('update', Patch(':componentId'), [Param('componentId'), Body()]);
registerRoute('remove', Delete(':componentId'), [Param('componentId')]);

Dependencies(SalaryComponentsService)(SalaryComponentsController);
Controller('salary-components')(SalaryComponentsController);

module.exports = { SalaryComponentsController };
