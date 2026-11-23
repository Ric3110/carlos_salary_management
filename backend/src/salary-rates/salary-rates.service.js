const {
  Injectable,
  Dependencies,
  NotFoundException,
  ConflictException,
} = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { In } = require('typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryAssignment } = require('../salary-assignments/salary-assignment.entity');
const { SalaryComponent } = require('../salary-components/salary-component.entity');
const { EmployeeSalaryComponent } = require('../salary-components/employee-salary-component.entity');
const { parseEmployeeId } = require('../employees/employees.validation');
const { toCentavos, rateBreakdown } = require('./salary-rates.calculation');

function describeEmployee(employee) {
  return {
    employee_id: employee.employee_id,
    first_name: employee.first_name,
    middle_name: employee.middle_name,
    last_name: employee.last_name,
    date_hired: employee.date_hired,
  };
}

class SalaryRatesService {
  constructor(employeeRepository, salaryRepository, componentRepository, assignmentRepository) {
    this.employeeRepository = employeeRepository;
    this.salaryRepository = salaryRepository;
    this.componentRepository = componentRepository;
    this.assignmentRepository = assignmentRepository;
  }

  async findAll() {
    const [employees, salaries] = await Promise.all([
      this.employeeRepository.find({ order: { employee_id: 'ASC' } }),
      this.salaryRepository.find(),
    ]);
    const byEmployeeId = new Map(salaries.map((salary) => [salary.employee_id, salary]));
    return employees.map((employee) => {
      const salary = byEmployeeId.get(employee.employee_id);
      return {
        ...describeEmployee(employee),
        has_salary_assignment: Boolean(salary),
        monthly_basic_salary: salary?.monthly_basic_salary ?? null,
      };
    });
  }

  async findOne(employeeIdText) {
    const employeeId = parseEmployeeId(employeeIdText);
    const employee = await this.employeeRepository.findOneBy({ employee_id: employeeId });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} was not found.`);
    }

    const salary = await this.salaryRepository.findOneBy({ employee_id: employeeId });
    if (!salary) {
      throw new ConflictException(
        `Employee ${employeeId} has no basic salary assigned. Assign one before calculating rates.`,
      );
    }

    const assignments = await this.assignmentRepository.find({
      where: { employee_id: employeeId, is_deleted: false },
      order: { employee_salary_component_id: 'ASC' },
    });

    let componentLines = [];
    if (assignments.length) {
      const ids = [...new Set(assignments.map((row) => row.salary_component_id))];
      const activeComponents = await this.componentRepository.findBy({
        salary_component_id: In(ids),
        is_deleted: false,
      });
      const names = new Map(activeComponents.map((c) => [c.salary_component_id, c.name]));
      componentLines = assignments
        .filter((row) => names.has(row.salary_component_id))
        .map((row) => ({
          salary_component_id: row.salary_component_id,
          name: names.get(row.salary_component_id),
          monthlyCentavos: toCentavos(row.amount),
        }));
    }

    const basicMonthly = toCentavos(salary.monthly_basic_salary);
    const componentsMonthly = componentLines.reduce((sum, row) => sum + row.monthlyCentavos, 0n);

    return {
      employee: describeEmployee(employee),
      currency: 'PHP',
      calculation_basis: {
        months_per_year: 12,
        annual_working_days: 314,
        hours_per_day: 8,
        minutes_per_hour: 60,
      },
      breakdown: {
        basic_salary: rateBreakdown(basicMonthly),
        components: componentLines.map((row) => ({
          salary_component_id: row.salary_component_id,
          name: row.name,
          ...rateBreakdown(row.monthlyCentavos),
        })),
        components_total: rateBreakdown(componentsMonthly),
        total: rateBreakdown(basicMonthly + componentsMonthly),
      },
    };
  }
}

Dependencies(
  getRepositoryToken(Employee),
  getRepositoryToken(SalaryAssignment),
  getRepositoryToken(SalaryComponent),
  getRepositoryToken(EmployeeSalaryComponent),
)(SalaryRatesService);
Injectable()(SalaryRatesService);

module.exports = { SalaryRatesService };
