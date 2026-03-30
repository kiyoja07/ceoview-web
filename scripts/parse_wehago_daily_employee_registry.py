from __future__ import annotations

import importlib.util
import json
import math
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

DEFAULT_FILE_PATH = (
    Path(__file__).resolve().parents[1]
    / "wehago"
    / "일용직사원명부_예시_컴포즈.xls"
)

TITLE_ROW_INDEX = 0
COMPANY_ROW_INDEX = 2
HEADER_ROW_1_INDEX = 4
HEADER_ROW_2_INDEX = 5
DATA_START_ROW_INDEX = 6


@dataclass
class ParsedDailyEmployee:
    employeeCode: str | None
    name: str
    residentNumber: str | None
    department: str | None
    positionTitle: str | None
    hireDate: str | None
    resignDate: str | None
    jobCategory: str | None
    payType: str | None
    paymentMethod: str | None
    overtimeType: str | None
    normalPay: float | int | None
    overtimePay: float | int | None
    address: str | None
    bankName: str | None
    accountNumber: str | None
    siteName: str | None


@dataclass
class ParsedWorkbook:
    title: str | None
    companyName: str | None
    scopeLabel: str | None
    columns: list[str]
    rows: list[dict[str, Any]]
    employees: list[ParsedDailyEmployee]


def clean_header(value: Any) -> str:
    if is_empty(value):
        return ""
    return " ".join(str(value).split())


def clean_value(value: Any) -> Any:
    if is_empty(value):
        return None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        text = value.strip()
        return text or None
    return value


def is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False


def normalize_date(value: Any) -> str | None:
    cleaned = clean_value(value)
    if cleaned is None:
        return None

    text = str(cleaned).strip().replace(".", "-").replace("/", "-")
    parts = [part for part in text.split("-") if part]
    if len(parts) == 3 and all(part.isdigit() for part in parts):
        year, month, day = parts
        return f"{year.zfill(4)}-{month.zfill(2)}-{day.zfill(2)}"

    return text


def find_last_text(cells: list[Any]) -> str | None:
    for value in reversed(cells):
        cleaned = clean_value(value)
        if cleaned is not None:
            return str(cleaned)
    return None


def read_sheet_values(file_path: Path) -> list[list[Any]]:
    if sys.version_info < (3, 14) and importlib.util.find_spec("xlrd"):
        return read_sheet_values_with_xlrd(file_path)
    return read_sheet_values_with_node(file_path)


def read_sheet_values_with_xlrd(file_path: Path) -> list[list[Any]]:
    import xlrd

    workbook = xlrd.open_workbook(file_path.as_posix())
    sheet = workbook.sheet_by_index(0)
    return [sheet.row_values(row_index) for row_index in range(sheet.nrows)]


def read_sheet_values_with_node(file_path: Path) -> list[list[Any]]:
    script = """
const XLSX = require('xlsx');
const workbook = XLSX.readFile(process.argv[1], { cellDates: false });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
process.stdout.write(JSON.stringify(rows));
""".strip()
    try:
        completed = subprocess.run(
            ["node", "-e", script, file_path.as_posix()],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:  # pragma: no cover
        raise SystemExit(
            "Unable to parse .xls: install `xlrd` for Python or make sure `node` is available."
        ) from exc
    except subprocess.CalledProcessError as exc:  # pragma: no cover
        raise SystemExit(exc.stderr.strip() or exc.stdout.strip() or str(exc)) from exc

    return json.loads(completed.stdout)


def get_row(rows: list[list[Any]], row_index: int) -> list[Any]:
    if row_index >= len(rows):
        return []
    return rows[row_index]


def get_cell(row: list[Any], col_index: int) -> Any:
    if col_index >= len(row):
        return None
    return row[col_index]


def build_column_mappings(rows: list[list[Any]]) -> tuple[list[str], list[dict[str, Any]]]:
    row1 = [clean_header(value) for value in get_row(rows, HEADER_ROW_1_INDEX)]
    row2 = [clean_header(value) for value in get_row(rows, HEADER_ROW_2_INDEX)]
    max_cols = max(len(row1), len(row2))

    raw_mappings: list[dict[str, Any]] = []

    for col_idx in range(max_cols):
        name1 = row1[col_idx] if col_idx < len(row1) else ""
        name2 = row2[col_idx] if col_idx < len(row2) else ""
        if name1:
            raw_mappings.append({"col_idx": col_idx, "name": name1, "from_row": 1})
        if name2:
            raw_mappings.append({"col_idx": col_idx, "name": name2, "from_row": 2})

    seen: dict[str, int] = {}
    deduped_columns: list[str] = []
    deduped_mappings: list[dict[str, Any]] = []

    for mapping in raw_mappings:
        name = mapping["name"]
        seen[name] = seen.get(name, 0) + 1
        deduped_name = name if seen[name] == 1 else f"{name}_{seen[name]}"
        deduped_columns.append(deduped_name)
        deduped_mappings.append({**mapping, "name": deduped_name})

    return deduped_columns, deduped_mappings


def parse_row_pair(
    rows: list[list[Any]],
    row_index: int,
    column_mappings: list[dict[str, Any]],
) -> dict[str, Any] | None:
    row1 = get_row(rows, row_index)
    row2_index = row_index + 1
    row2 = get_row(rows, row2_index)

    record: dict[str, Any] = {}
    has_data = False

    for mapping in column_mappings:
        source_row = row1 if mapping["from_row"] == 1 else row2
        value = clean_value(get_cell(source_row, mapping["col_idx"]))
        record[mapping["name"]] = value
        if value is not None:
            has_data = True

    return record if has_data else None


def to_employee(record: dict[str, Any]) -> ParsedDailyEmployee | None:
    name = clean_value(record.get("성 명"))
    if name is None:
        return None

    return ParsedDailyEmployee(
        employeeCode=string_or_none(record.get("코 드")),
        name=str(name),
        residentNumber=string_or_none(record.get("주민등록번호")),
        department=string_or_none(record.get("부 서")),
        positionTitle=string_or_none(record.get("직 급")),
        hireDate=normalize_date(record.get("입사일")),
        resignDate=normalize_date(record.get("퇴사일")),
        jobCategory=string_or_none(record.get("직 종")),
        payType=string_or_none(record.get("급여형태")),
        paymentMethod=string_or_none(record.get("지급방법")),
        overtimeType=string_or_none(record.get("연장형태")),
        normalPay=number_or_none(record.get("정상급여")),
        overtimePay=number_or_none(record.get("연장급여")),
        address=string_or_none(record.get("주 소")),
        bankName=string_or_none(record.get("은행")),
        accountNumber=string_or_none(record.get("계좌번호")),
        siteName=string_or_none(record.get("현 장")),
    )


def string_or_none(value: Any) -> str | None:
    cleaned = clean_value(value)
    if cleaned is None:
        return None
    return str(cleaned)


def number_or_none(value: Any) -> float | int | None:
    cleaned = clean_value(value)
    if cleaned is None:
        return None
    if isinstance(cleaned, (int, float)):
        return cleaned
    try:
        parsed = float(str(cleaned).replace(",", ""))
    except ValueError:
        return None
    return int(parsed) if parsed.is_integer() else parsed


def parse_wehago_daily_employee_registry(file_path: str | Path = DEFAULT_FILE_PATH) -> ParsedWorkbook:
    path = Path(file_path)
    rows_source = read_sheet_values(path)

    columns, column_mappings = build_column_mappings(rows_source)

    rows: list[dict[str, Any]] = []
    employees: list[ParsedDailyEmployee] = []

    for row_index in range(DATA_START_ROW_INDEX, len(rows_source), 2):
        record = parse_row_pair(rows_source, row_index, column_mappings)
        if record is None:
            continue

        rows.append(record)
        employee = to_employee(record)
        if employee is not None:
            employees.append(employee)

    company_row = get_row(rows_source, COMPANY_ROW_INDEX)
    title_row = get_row(rows_source, TITLE_ROW_INDEX)

    return ParsedWorkbook(
        title=find_last_text(title_row),
        companyName=string_or_none(company_row[1]) if len(company_row) > 1 else None,
        scopeLabel=find_last_text(company_row),
        columns=columns,
        rows=rows,
        employees=employees,
    )


if __name__ == "__main__":
    target_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_FILE_PATH
    parsed = parse_wehago_daily_employee_registry(target_path)
    print(
        json.dumps(
            {
                "filePath": str(target_path),
                "title": parsed.title,
                "companyName": parsed.companyName,
                "scopeLabel": parsed.scopeLabel,
                "columns": parsed.columns,
                "rowCount": len(parsed.rows),
                "rows": parsed.rows,
                "employees": [asdict(employee) for employee in parsed.employees],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
