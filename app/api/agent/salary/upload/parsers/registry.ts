import type { SalaryIncomeType } from "../types";
import type { SalaryParserVariant } from "./types";
import { businessIncomeVariants } from "./business-income";
import { earnedIncomeVariants } from "./earned-income";
import { otherIncomeVariants } from "./other-income";
import { otherIncomeLaborVariants } from "./other-income-labor";

export const parserRegistry: Record<SalaryIncomeType, SalaryParserVariant[]> = {
  EARNED_INCOME: earnedIncomeVariants,
  BUSINESS_INCOME: businessIncomeVariants,
  OTHER_INCOME: otherIncomeVariants,
  OTHER_INCOME_LABOR: otherIncomeLaborVariants,
};
