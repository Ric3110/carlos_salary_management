const {
  Injectable,
  Dependencies,
  NotFoundException,
  ConflictException,
} = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { DataSource, Raw, In } = require('typeorm');
const { Employee } = require('../employees/employee.entity');
const { SalaryComponent } = require('./salary-component.entity');
const { EmployeeSalaryComponent } = require('./employee-salary-component.entity');
const {
  parseId,
  validateComponentNameInput,
  validateAssignmentInput,
} = require('./salary-components.validation');

function handleUniqueError(error, message) {
  if ((error?.driverError?.code ?? error?.code) === '23505') {
    throw new ConflictException(message);
  }
  throw error;
}

function formatAssignment(assignment, component) {
  return {
    employee_salary_component_id: assignment.employee_salary_component_id,
    employee_id: assignment.employee_id,
    salary_component_id: assignment.salary_component_id,
    name: component.name,
    amount: assignment.amount,
    created_at: assignment.created_at,
    updated_at: assignment.updated_at,
  };
}

class SalaryComponentsService {
  constructor(componentRepository, assignmentRepository, employeeRepository, dataSource) {
    this.componentRepository = componentRepository;
    this.assignmentRepository = assignmentRepository;
    this.employeeRepository = employeeRepository;
    this.dataSource = dataSource;
  }

  async assertEmployee(employeeId) {
    const employee = await this.employeeRepository.findOneBy({ employee_id: employeeId });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} was not found.`);
    }
    return employee;
  }

  async getActiveComponent(componentId) {
    const component = await this.componentRepository.findOneBy({
      salary_component_id: componentId,
      is_deleted: false,
    });
    if (!component) {
      throw new NotFoundException(`Active salary component ${componentId} was not found.`);
    }
    return component;
  }

  async assertUniqueActiveName(name, excludingId = null) {
    const existing = await this.componentRepository.findOne({
      where: {
        is_deleted: false,
        name: Raw((alias) => `LOWER(BTRIM(${alias})) = LOWER(BTRIM(:name))`, { name }),
      },
    });
    if (existing && existing.salary_component_id !== excludingId) {
      throw new ConflictException('An active salary component with this name already exists.');
    }
  }

  // Component catalog: reusable names shared by all employees.
  async createComponent(payload) {
    const { name } = validateComponentNameInput(payload);
    await this.assertUniqueActiveName(name);
    try {
      return await this.componentRepository.save(this.componentRepository.create({ name }));
    } catch (error) {
      handleUniqueError(error, 'An active salary component with this name already exists.');
    }
  }

  listComponents() {
    return this.componentRepository.find({
      where: { is_deleted: false },
      order: { name: 'ASC' },
    });
  }

  findComponent(componentIdText) {
    return this.getActiveComponent(parseId(componentIdText, 'salary_component_id'));
  }

  async updateComponent(componentIdText, payload) {
    const componentId = parseId(componentIdText, 'salary_component_id');
    const { name } = validateComponentNameInput(payload);
    const component = await this.getActiveComponent(componentId);
    await this.assertUniqueActiveName(name, componentId);
    component.name = name;
    component.updated_at = new Date();
    try {
      return await this.componentRepository.save(component);
    } catch (error) {
      handleUniqueError(error, 'An active salary component with this name already exists.');
    }
  }

  // A global delete hides the component and soft-deletes its active assignments.
  async deleteComponent(componentIdText) {
    const componentId = parseId(componentIdText, 'salary_component_id');
    return this.dataSource.transaction(async (manager) => {
      const components = manager.getRepository(SalaryComponent);
      const assignments = manager.getRepository(EmployeeSalaryComponent);
      const component = await components.findOneBy({
        salary_component_id: componentId,
        is_deleted: false,
      });
      if (!component) {
        throw new NotFoundException(`Active salary component ${componentId} was not found.`);
      }
      const now = new Date();
      const result = await assignments.update(
        { salary_component_id: componentId, is_deleted: false },
        { is_deleted: true, updated_at: now },
      );
      component.is_deleted = true;
      component.updated_at = now;
      await components.save(component);
      return {
        message: 'Salary component soft-deleted.',
        salary_component_id: componentId,
        affected_employee_assignments: result.affected ?? 0,
      };
    });
  }

  // Employee-specific assignments: each employee can use a component once while active.
  async listEmployeeComponents(employeeIdText) {
    const employeeId = parseId(employeeIdText, 'employee_id');
    await this.assertEmployee(employeeId);
    const assignments = await this.assignmentRepository.find({
      where: { employee_id: employeeId, is_deleted: false },
      order: { employee_salary_component_id: 'ASC' },
    });
    if (!assignments.length) return [];
    const components = await this.componentRepository.findBy({
      salary_component_id: In([...new Set(assignments.map((row) => row.salary_component_id))]),
      is_deleted: false,
    });
    const byId = new Map(components.map((item) => [item.salary_component_id, item]));
    return assignments
      .filter((row) => byId.has(row.salary_component_id))
      .map((row) => formatAssignment(row, byId.get(row.salary_component_id)));
  }

  async assignToEmployee(employeeIdText, payload) {
    const employeeId = parseId(employeeIdText, 'employee_id');
    const { salary_component_id, amount } = validateAssignmentInput(payload);
    await this.assertEmployee(employeeId);
    const component = await this.getActiveComponent(salary_component_id);
    const existing = await this.assignmentRepository.findOneBy({
      employee_id: employeeId,
      salary_component_id,
      is_deleted: false,
    });
    if (existing) {
      throw new ConflictException('Employee already has this active salary component.');
    }
    try {
      const created = this.assignmentRepository.create({
        employee_id: employeeId,
        salary_component_id,
        amount,
      });
      return formatAssignment(await this.assignmentRepository.save(created), component);
    } catch (error) {
      const code = error?.driverError?.code ?? error?.code;
      if (code === '23505') {
        throw new ConflictException('Employee already has this active salary component.');
      }
      if (code === '23503') {
        throw new NotFoundException('Employee or salary component was not found.');
      }
      throw error;
    }
  }

  async getActiveAssignment(employeeId, componentId) {
    const assignment = await this.assignmentRepository.findOneBy({
      employee_id: employeeId,
      salary_component_id: componentId,
      is_deleted: false,
    });
    if (!assignment) {
      throw new NotFoundException('This employee does not have the active salary component.');
    }
    return assignment;
  }

  async updateEmployeeComponent(employeeIdText, componentIdText, payload) {
    const employeeId = parseId(employeeIdText, 'employee_id');
    const componentId = parseId(componentIdText, 'salary_component_id');
    const { amount } = validateAssignmentInput(payload, true);
    await this.assertEmployee(employeeId);
    const component = await this.getActiveComponent(componentId);
    const assignment = await this.getActiveAssignment(employeeId, componentId);
    assignment.amount = amount;
    assignment.updated_at = new Date();
    return formatAssignment(await this.assignmentRepository.save(assignment), component);
  }

  async removeEmployeeComponent(employeeIdText, componentIdText) {
    const employeeId = parseId(employeeIdText, 'employee_id');
    const componentId = parseId(componentIdText, 'salary_component_id');
    await this.assertEmployee(employeeId);
    const assignment = await this.getActiveAssignment(employeeId, componentId);
    assignment.is_deleted = true;
    assignment.updated_at = new Date();
    await this.assignmentRepository.save(assignment);
    return {
      message: 'Salary component removed from employee (soft-deleted).',
      employee_id: employeeId,
      salary_component_id: componentId,
    };
  }
}

Dependencies(
  getRepositoryToken(SalaryComponent),
  getRepositoryToken(EmployeeSalaryComponent),
  getRepositoryToken(Employee),
  DataSource,
)(SalaryComponentsService);
Injectable()(SalaryComponentsService);

module.exports = { SalaryComponentsService };
