const { Module } = require('@nestjs/common');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');
const { EmployeesModule } = require('./employees/employees.module');
const { SalaryAssignmentsModule } = require('./salary-assignments/salary-assignments.module');
const { SalaryComponentsModule } = require('./salary-components/salary-components.module');
const { SalaryRatesModule } = require('./salary-rates/salary-rates.module');

class AppModule {}

Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    EmployeesModule,
    SalaryAssignmentsModule,
    SalaryComponentsModule,
    SalaryRatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})(AppModule);

module.exports = { AppModule };
