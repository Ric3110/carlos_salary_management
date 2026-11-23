const {
  Injectable,
  Dependencies,
  NotFoundException,
} = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { Employee } = require('./employee.entity');
const { validateEmployeeInput, parseEmployeeId } = require('./employees.validation');

class EmployeesService {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async create(payload) {
    const values = validateEmployeeInput(payload);
    const employee = this.employeeRepository.create(values);
    return this.employeeRepository.save(employee);
  }

  findAll() {
    return this.employeeRepository.find({ order: { employee_id: 'ASC' } });
  }

  async findOne(id) {
    const employeeId = parseEmployeeId(id);
    const employee = await this.employeeRepository.findOneBy({ employee_id: employeeId });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} was not found.`);
    }
    return employee;
  }

  async update(id, payload) {
    const values = validateEmployeeInput(payload, true);
    const employee = await this.findOne(id);
    Object.assign(employee, values, { updated_at: new Date() });
    return this.employeeRepository.save(employee);
  }
}

Dependencies(getRepositoryToken(Employee))(EmployeesService);
Injectable()(EmployeesService);

module.exports = { EmployeesService };
