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
    businessEntityId,
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
    return saveEarnedIncome(businessEntityId, fileName, rows, overrides);
  }

  if (incomeType === "OTHER_INCOME_LABOR") {
    return saveOtherIncomeLabor(businessEntityId, fileName, rows);
  }

  const overrides: IncomeWithYmOverrides = {
    accrualYm: toYearMonth(accrualYm),
    paymentYm: toYearMonth(paymentYm),
  };

  if (incomeType === "BUSINESS_INCOME") {
    return saveBusinessIncome(businessEntityId, fileName, rows, overrides);
  }

  return saveOtherIncome(businessEntityId, fileName, rows, overrides);
}
