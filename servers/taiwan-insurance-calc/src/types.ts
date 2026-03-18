export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface InsuranceBreakdown {
  investmentGrade: number;
  employeeShare: number;
  employerShare: number;
  governmentShare: number;
  totalPremium: number;
}

export interface HealthInsuranceBreakdown {
  investmentGrade: number;
  dependents: number;
  employeeShare: number;
  employerShare: number;
  governmentShare: number;
  totalPremium: number;
}

export interface PensionBreakdown {
  salary: number;
  employerContribution: number;
  voluntaryRate: number;
  voluntaryContribution: number;
  totalContribution: number;
}

export interface EmployerCostBreakdown {
  salary: number;
  investmentGrade: number;
  laborInsurance: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  occupationalAccident: number;
  totalCost: number;
  totalWithSalary: number;
}
