const {
  Injectable,
  Dependencies,
  NotFoundException,
  ConflictException,
} = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryAssignment } = require('./salary-assignment.entity');
const {
  parseEmployeeId,
  validateSalaryAssignmentInput,
} = require('./salary-assignments.validation');

function formatSalaryRecord(employee, salary) {
  return {
    employee_id: employee.employee_id,
    first_name: employee.first_name,
    middle_name: employee.middle_name,
    last_name: employee.last_name,
    salary_assignment_id: salary?.salary_assignment_id ?? null,
    monthly_basic_salary: salary?.monthly_basic_salary ?? null,
    created_at: salary?.created_at ?? null,
    updated_at: salary?.updated_at ?? null,
  };
}

class SalaryAssignmentsService {
  constructor(salaryRepository, employeeRepository) {
    this.salaryRepository = salaryRepository;
    this.employeeRepository = employeeRepository;
  }

  async getEmployee(employeeId) {
    const employee = await this.employeeRepository.findOneBy({ employee_id: employeeId });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} was not found.`);
    }
    return employee;
  }


  async create(payload) {
    const values = validateSalaryAssignmentInput(payload);
    const employee = await this.getEmployee(values.employee_id);

    const existing = await this.salaryRepository.findOneBy({ employee_id: values.employee_id });
    if (existing) {
      throw new ConflictException(
        `Employee ${values.employee_id} already has a salary. Use PATCH to update it.`,
      );
    }

    try {
      const created = this.salaryRepository.create(values);
      const saved = await this.salaryRepository.save(created);
      return formatSalaryRecord(employee, saved);
    } catch (error) {
      // Database UNIQUE constraint also protects concurrent requests.
      const code = error?.driverError?.code ?? error?.code;
      if (code === '23505') {
        throw new ConflictException('This employee already has a salary assignment.');
      }
      if (code === '23503') {
        throw new NotFoundException(`Employee ${values.employee_id} was not found.`);
      }
      throw error;
    }
  }

  async findAll() {
    const [employees, salaries] = await Promise.all([
      this.employeeRepository.find({ order: { employee_id: 'ASC' } }),
      this.salaryRepository.find(),
    ]);
    const byEmployee = new Map(salaries.map((salary) => [salary.employee_id, salary]));
    return employees.map((employee) =>
      formatSalaryRecord(employee, byEmployee.get(employee.employee_id)),
    );
  }


  async findOne(employeeIdText) {
    const employeeId = parseEmployeeId(employeeIdText);
    const employee = await this.getEmployee(employeeId);
    const salary = await this.salaryRepository.findOneBy({ employee_id: employeeId });
    return formatSalaryRecord(employee, salary);
  }


  async update(employeeIdText, payload) {
    const employeeId = parseEmployeeId(employeeIdText);
    const values = validateSalaryAssignmentInput(payload, true);
    const employee = await this.getEmployee(employeeId);
    const salary = await this.salaryRepository.findOneBy({ employee_id: employeeId });

    if (!salary) {
      throw new NotFoundException(
        `Employee ${employeeId} has no salary assignment. Use POST first.`,
      );
    }

    salary.monthly_basic_salary = values.monthly_basic_salary;
    salary.updated_at = new Date();
    const saved = await this.salaryRepository.save(salary);
    return formatSalaryRecord(employee, saved);
  }
}

Dependencies(
  getRepositoryToken(SalaryAssignment),
  getRepositoryToken(Employee),
)(SalaryAssignmentsService);
Injectable()(SalaryAssignmentsService);

module.exports = { SalaryAssignmentsService };
