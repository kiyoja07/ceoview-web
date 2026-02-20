import type { BusinessEntity } from "../types";
import { formatBusinessNumber } from "../utils";

type Props = {
  entitiesLoading: boolean;
  entities: BusinessEntity[];
  businessEntityId: string;
  onChange: (value: string) => void;
  selectedEntity?: BusinessEntity;
};

export function BusinessEntitySelect({
  entitiesLoading,
  entities,
  businessEntityId,
  onChange,
  selectedEntity,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        사업자 선택 <span className="text-red-500">*</span>
      </label>
      {entitiesLoading ? (
        <p className="text-sm text-gray-500">로딩 중...</p>
      ) : entities.length === 0 ? (
        <p className="text-sm text-gray-500">
          등록된 사업자가 없습니다.{" "}
          <a href="/agent/business-entity/new" className="text-blue-500 underline">
            먼저 사업자를 등록
          </a>
          해주세요.
        </p>
      ) : (
        <select
          value={businessEntityId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- 사업자를 선택하세요 --</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {formatBusinessNumber(entity.businessNumber)}
              {entity.businessName ? ` / ${entity.businessName}` : ""}
              {entity.representativeName ? ` (${entity.representativeName})` : ""}
            </option>
          ))}
        </select>
      )}

      {selectedEntity && (
        <p className="mt-1 text-xs text-gray-500">
          {selectedEntity.businessType === "INDIVIDUAL" ? "개인" : "법인"}
          {selectedEntity.businessName ? ` · ${selectedEntity.businessName}` : ""}
          {selectedEntity.representativeName
            ? ` · 대표 ${selectedEntity.representativeName}`
            : ""}
        </p>
      )}
    </div>
  );
}
