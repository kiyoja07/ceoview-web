import {
  saveBusinessIncome,
  saveEarnedIncome,
  saveOtherIncome,
  saveOtherIncomeLabor,
} from "./save-services";
import type {
  EarnedIncomeOverrides,
  IncomeWithYmOverrides,
  SaveRowsByIncomeTypeParams,
  UploadSaveResult,
} from "./types";
import { toYearMonth } from "./utils";

export async function saveRowsByIncomeType(
  params: SaveRowsByIncomeTypeParams,
): Promise<UploadSaveResult> {
  const {
    incomeType,
    companyId,
    fileName,
    rows,
    accrualYm,
    paymentYm,
    payDateStr,
  } = params;

  if (incomeType === "EARNED_INCOME") {
    const overrides: EarnedIncomeOverrides = {
      accrualYm: toYearMonth(accrualYm),
      paymentYm: toYearMonth(paymentYm),
      payDate: payDateStr ? new Date(payDateStr) : new Date(),
    };
    return saveEarnedIncome(companyId, fileName, rows, overrides);
  }

  if (incomeType === "OTHER_INCOME_LABOR") {
    return saveOtherIncomeLabor(companyId, fileName, rows);
  }

  const overrides: IncomeWithYmOverrides = {
    accrualYm: toYearMonth(accrualYm),
    paymentYm: toYearMonth(paymentYm),
  };

  if (incomeType === "BUSINESS_INCOME") {
    return saveBusinessIncome(companyId, fileName, rows, overrides);
  }

  return saveOtherIncome(companyId, fileName, rows, overrides);
}
