const { Controller, Dependencies, Get, Param, Bind } = require('@nestjs/common');
const { SalaryRatesService } = require('./salary-rates.service');

class SalaryRatesController {
  constructor(salaryRatesService) {
    this.salaryRatesService = salaryRatesService;
  }

  findAll() {
    return this.salaryRatesService.findAll();
  }

  findOne(employeeId) {
    return this.salaryRatesService.findOne(employeeId);
  }
}

const prototype = SalaryRatesController.prototype;
Get()(prototype, 'findAll', Object.getOwnPropertyDescriptor(prototype, 'findAll'));
const findOneDescriptor = Object.getOwnPropertyDescriptor(prototype, 'findOne');
Get(':employeeId')(prototype, 'findOne', findOneDescriptor);
Bind(Param('employeeId'))(prototype, 'findOne', findOneDescriptor);

Dependencies(SalaryRatesService)(SalaryRatesController);
Controller('salary-rates')(SalaryRatesController);

module.exports = { SalaryRatesController };
