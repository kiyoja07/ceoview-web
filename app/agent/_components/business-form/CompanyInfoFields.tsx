import { INPUT_BASE } from "./shared";
import DateInput from "@/app/_components/DateInput";

interface CompanyInfoFieldsProps {
  businessName: string;
  onBusinessNameChange: (value: string) => void;
  representativeName: string;
  onRepresentativeNameChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  openingDate: string;
  onOpeningDateChange: (value: string) => void;
}

export default function CompanyInfoFields({
  businessName,
  onBusinessNameChange,
  representativeName,
  onRepresentativeNameChange,
  address,
  onAddressChange,
  openingDate,
  onOpeningDateChange,
}: CompanyInfoFieldsProps) {
  return (
    <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <legend className="px-2 text-sm font-semibold text-gray-700">
        추가 정보{" "}
        <span className="text-xs font-normal text-gray-400">(선택)</span>
      </legend>
      <div className="space-y-5">
        {/* 상호명 & 대표자명 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              상호명
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => onBusinessNameChange(e.target.value)}
              placeholder="상호명을 입력하세요"
              className={INPUT_BASE}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              대표자명
            </label>
            <input
              type="text"
              value={representativeName}
              onChange={(e) => onRepresentativeNameChange(e.target.value)}
              placeholder="대표자 이름을 입력하세요"
              className={INPUT_BASE}
            />
          </div>
        </div>

        {/* 주소 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            주소
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="사업장 주소를 입력하세요"
            className={INPUT_BASE}
          />
        </div>

        {/* 개업일 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            개업일
          </label>
          <DateInput
            value={openingDate}
            onChange={onOpeningDateChange}
            theme="blue"
          />
        </div>
      </div>
    </fieldset>
  );
}
