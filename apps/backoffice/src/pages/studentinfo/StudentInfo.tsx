import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  deletePersonalInformationAll,
  getAllPersonalInformations,
  type PersonalInformation,
  setPersonalInformations,
} from "../../api/auth.ts";
import { useToast } from "../../providers/ToastProvider.tsx";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;

  @media (max-width: 900px) {
    padding: 12px;
  }
`;

const Card = styled.div`
  flex: 1;
  min-height: 0;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.Font.Headline.size};
    color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  }

  p {
    margin: 2px 0 0;
    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
    font-size: ${({ theme }) => theme.Font.Body.size};
  }
`;

const ActionButton = styled.button`
  height: 40px;
  min-width: 110px;
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  color: white;
  font-size: ${({ theme }) => theme.Font.Body.size};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary}cc;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.Colors.Line.Outline};
    cursor: not-allowed;
  }
`;

const GhostButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  &:hover {
    background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary}cc;
  }
`;

const DangerButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Red};
  color: ${({ theme }) => theme.Colors.Solid.Red};

  &:hover {
    background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Red}dd;
  }
`;

const TableWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  border-radius: 8px;
  overflow: auto;
  max-height: 80dvh;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};

  thead {
    background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
    padding: 10px;
    text-align: left;
    font-size: ${({ theme }) => theme.Font.Body.size};
    color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  tbody tr:hover {
    background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  }
`;

const SortButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Body.size};
  font-weight: ${({ theme }) => theme.Font.Body.weight.regular};
  cursor: pointer;
  padding: 0;
`;

const EditableInput = styled.input<{ $changed?: boolean }>`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  background-color: ${({ $changed, theme }) => ($changed ? theme.Colors.Components.Translucent.Primary : theme.Colors.Background.Standard.Primary)};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  border-radius: 6px;
  padding: 8px;
  font-size: ${({ theme }) => theme.Font.Body.size};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  }
`;

const EditableSelect = styled.select<{ $changed?: boolean }>`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  background-color: ${({ $changed, theme }) => ($changed ? theme.Colors.Components.Translucent.Primary : theme.Colors.Background.Standard.Primary)};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  border-radius: 6px;
  padding: 8px;
  font-size: ${({ theme }) => theme.Font.Body.size};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  font-size: ${({ theme }) => theme.Font.Body.size};
`;

const templateFallbackHeaders = ["이메일", "학번", "성별(남/여)", "이름"];

type SortKey = "mail" | "grade" | "class" | "number" | "gender" | "name";
type SortDirection = "asc" | "desc";
type EditableField = keyof PersonalInformation;

const parseStudentNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return { grade: 0, class: 0, number: 0 };
  }

  return {
    grade: Number.parseInt(digits.substring(0, 1), 10),
    class: Number.parseInt(digits.substring(1, 2), 10),
    number: Number.parseInt(digits.substring(2, 4), 10),
  };
};

const formatStudentNumber = (info: PersonalInformation) => {
  return `${info.grade}${info.class}${String(info.number).padStart(2, "0")}`;
};

const sanitizeInfo = (info: PersonalInformation): PersonalInformation => ({
  ...info,
  mail: info.mail.trim(),
  name: info.name.trim(),
  grade: Number.isFinite(info.grade) ? info.grade : 0,
  class: Number.isFinite(info.class) ? info.class : 0,
  number: Number.isFinite(info.number) ? info.number : 0,
  gender: info.gender === "female" ? "female" : "male",
});

const rowValue = (row: Record<string, string>, keys: string[], fallbackIndex: number) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  const values = Object.values(row).map((value) => String(value ?? "").trim());
  return values[fallbackIndex] ?? "";
};

function StudentInfoPage() {
  const { showToast } = useToast();
  const [currentInformations, setCurrentInformations] = useState<PersonalInformation[]>([]);
  const [draftInformations, setDraftInformations] = useState<PersonalInformation[]>([]);
  const [templateHeaders, setTemplateHeaders] = useState<string[]>(templateFallbackHeaders);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadCurrentInformations = async () => {
    const data = await getAllPersonalInformations();
    const sanitized = data.map(sanitizeInfo);
    setCurrentInformations(sanitized);
    if (!isEditMode) {
      setDraftInformations(sanitized);
    }
  };

  useEffect(() => {
    loadCurrentInformations();
  }, []);

  const loadTemplateHeaders = async () => {
    try {
      const response = await fetch("/디미고인_학생정보_양식.csv");
      const text = await response.text();
      const firstLine = text
        .split(/\r?\n/)[0]
        ?.replace(/^\uFEFF/, "")
        .trim();
      if (firstLine) {
        const parsed = Papa.parse<string[]>(firstLine, { delimiter: "," });
        const headers = (parsed.data?.[0] ?? [])
          .map((header) => String(header).trim())
          .filter(Boolean);
        if (headers.length >= 4) {
          setTemplateHeaders(headers);
          return headers;
        }
      }
    } catch {
      return templateFallbackHeaders;
    }

    return templateHeaders;
  };

  const uploadFileToDraft = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map((row) => {
            const email = rowValue(row, ["이메일", "email", "mail"], 0);
            const studentNumber = rowValue(row, ["학번", "studentNumber", "student_number"], 1);
            const genderText = rowValue(row, ["성별(남/여)", "성별", "gender"], 2);
            const name = rowValue(row, ["이름", "name"], 3);
            const student = parseStudentNumber(studentNumber);

            return sanitizeInfo({
              gender:
                genderText === "여" || genderText.toLowerCase() === "female" ? "female" : "male",
              mail: email,
              name,
              grade: student.grade,
              class: student.class,
              number: student.number,
            });
          })
          .filter(
            (row) => row.mail && row.name && row.grade > 0 && row.class > 0 && row.number > 0,
          );

        setDraftInformations(parsed);
        showToast(`${parsed.length}명의 학생 정보를 불러왔습니다.`, "info");
      },
      error: (err) => {
        console.error("파싱 실패:", err);
        showToast("CSV 파일 파싱에 실패했습니다.", "danger");
      },
    });
  };

  const updateDraftInformation = (index: number, key: keyof PersonalInformation, value: string) => {
    setDraftInformations((prev) =>
      prev.map((item, i) => {
        if (i !== index) {
          return item;
        }

        if (key === "grade" || key === "class" || key === "number") {
          return {
            ...item,
            [key]: Number.parseInt(value.replace(/\D/g, "") || "0", 10),
          };
        }

        if (key === "gender") {
          return {
            ...item,
            gender: value === "female" ? "female" : "male",
          };
        }

        return {
          ...item,
          [key]: value,
        };
      }),
    );
  };

  const addDraftRow = () => {
    setDraftInformations((prev) => [
      ...prev,
      {
        mail: "",
        name: "",
        gender: "male",
        grade: 0,
        class: 0,
        number: 0,
      },
    ]);
  };

  const removeDraftRow = (index: number) => {
    setDraftInformations((prev) => prev.filter((_, i) => i !== index));
  };

  const startEditMode = () => {
    setDraftInformations(currentInformations.map(sanitizeInfo));
    setIsEditMode(true);
  };

  const cancelEditMode = () => {
    setDraftInformations(currentInformations.map(sanitizeInfo));
    setIsEditMode(false);
  };

  const applyDraftInformations = async () => {
    const hasInvalidNumberField = draftInformations.some((row) => {
      return (
        !Number.isInteger(row.grade) ||
        !Number.isInteger(row.class) ||
        !Number.isInteger(row.number) ||
        row.grade <= 0 ||
        row.class <= 0 ||
        row.number <= 0
      );
    });

    if (hasInvalidNumberField) {
      showToast("학년, 반, 번호는 1 이상의 숫자로 입력해주세요.", "danger");
      return;
    }

    const validRows = draftInformations
      .map(sanitizeInfo)
      .filter((row) => row.mail && row.name && row.grade > 0 && row.class > 0 && row.number > 0);

    if (validRows.length === 0) {
      showToast("적용할 유효한 학생 정보가 없습니다.", "danger");
      return;
    }

    const shouldApply = window.confirm("현재 수정 내용을 학생정보에 적용할까요?");
    if (!shouldApply) {
      return;
    }

    try {
      await deletePersonalInformationAll();
      await setPersonalInformations(validRows);
      setCurrentInformations(validRows);
      setDraftInformations(validRows);
      setIsEditMode(false);
      showToast("학생 정보가 성공적으로 적용되었습니다.", "info");
    } catch (e) {
      console.error(e);
      showToast("학생 정보 적용에 실패했습니다. 다시 시도해주세요.", "danger");
    }
  };

  const downloadCurrentCsv = async () => {
    const headers = await loadTemplateHeaders();
    const [emailHeader, studentNoHeader, genderHeader, nameHeader] = headers;
    const csvRows = currentInformations.map((row) => ({
      [emailHeader]: row.mail,
      [studentNoHeader]: formatStudentNumber(row),
      [genderHeader]: row.gender === "male" ? "남" : "여",
      [nameHeader]: row.name,
    }));

    const csvContent = Papa.unparse(csvRows, {
      columns: [emailHeader, studentNoHeader, genderHeader, nameHeader],
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "디미고인_학생정보.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const rows = isEditMode ? draftInformations : currentInformations;

  const isCellChanged = (rowIndex: number, key: EditableField, row: PersonalInformation) => {
    const baseline = currentInformations[rowIndex];
    if (!baseline) {
      return true;
    }

    return String(baseline[key]) !== String(row[key]);
  };

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const sortedRows = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;

    return rows
      .map((info, index) => ({ info, index }))
      .sort((a, b) => {
        const left = a.info;
        const right = b.info;

        if (sortKey === "gender") {
          const lv = left.gender === "male" ? 0 : 1;
          const rv = right.gender === "male" ? 0 : 1;
          return (lv - rv) * direction || a.index - b.index;
        }

        if (sortKey === "grade" || sortKey === "class" || sortKey === "number") {
          return (
            ((left[sortKey] as number) - (right[sortKey] as number)) * direction ||
            a.index - b.index
          );
        }

        return (
          String(left[sortKey]).localeCompare(String(right[sortKey]), "ko") * direction ||
          a.index - b.index
        );
      });
  }, [rows, sortDirection, sortKey]);

  const sortLabel = (key: SortKey, label: string) => {
    if (sortKey !== key) {
      return label;
    }

    return `${label} ${sortDirection === "asc" ? "▲" : "▼"}`;
  };

  return (
    <Wrapper>
      <Card>
        <CardHead>
          <div>
            <h3>학생정보 등록</h3>
            <p>
              {isEditMode
                ? "수정 모드입니다. 수정 후 적용해주세요."
                : "수정하기를 누르면 편집할 수 있습니다."}
            </p>
          </div>
        </CardHead>

        <ActionRow>
          <GhostButton onClick={downloadCurrentCsv} disabled={currentInformations.length === 0}>
            CSV 다운로드
          </GhostButton>

          {isEditMode ? (
            <>
              <input
                type="file"
                id="file-upload"
                style={{ display: "none" }}
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadFileToDraft(file);
                  }
                }}
              />
              <GhostButton
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "/디미고인_학생정보_양식.csv";
                  link.download = "디미고인_학생정보_양식.csv";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                양식 다운로드
              </GhostButton>
              <GhostButton
                onClick={() => {
                  document.getElementById("file-upload")?.click();
                }}
              >
                양식 업로드
              </GhostButton>
              <GhostButton onClick={addDraftRow}>행 추가</GhostButton>
              <DangerButton onClick={cancelEditMode}>취소</DangerButton>
              <ActionButton
                onClick={applyDraftInformations}
                disabled={draftInformations.length === 0}
              >
                적용
              </ActionButton>
            </>
          ) : (
            <ActionButton onClick={startEditMode}>수정하기</ActionButton>
          )}
        </ActionRow>

        {rows.length === 0 ? (
          <EmptyText>등록된 학생정보가 없습니다.</EmptyText>
        ) : (
          <TableWrapper>
            <StyledTable>
              <colgroup>
                <col style={{ width: "36%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "21%" }} />
                {isEditMode && <col style={{ width: "12%" }} />}
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <SortButton onClick={() => onSort("mail")}>
                      {sortLabel("mail", "이메일")}
                    </SortButton>
                  </th>
                  <th>
                    <SortButton onClick={() => onSort("grade")}>
                      {sortLabel("grade", "학년")}
                    </SortButton>
                  </th>
                  <th>
                    <SortButton onClick={() => onSort("class")}>
                      {sortLabel("class", "반")}
                    </SortButton>
                  </th>
                  <th>
                    <SortButton onClick={() => onSort("number")}>
                      {sortLabel("number", "번호")}
                    </SortButton>
                  </th>
                  <th>
                    <SortButton onClick={() => onSort("gender")}>
                      {sortLabel("gender", "성별")}
                    </SortButton>
                  </th>
                  <th>
                    <SortButton onClick={() => onSort("name")}>
                      {sortLabel("name", "이름")}
                    </SortButton>
                  </th>
                  {isEditMode && <th>삭제</th>}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map(({ info, index }) => (
                  <tr key={`${info.mail}-${index}`}>
                    <td title={info.mail}>
                      {isEditMode ? (
                        <EditableInput
                          $changed={isCellChanged(index, "mail", info)}
                          value={info.mail}
                          onChange={(e) => updateDraftInformation(index, "mail", e.target.value)}
                        />
                      ) : (
                        info.mail
                      )}
                    </td>
                    <td>
                      {isEditMode ? (
                        <EditableInput
                          $changed={isCellChanged(index, "grade", info)}
                          inputMode="numeric"
                          value={info.grade || ""}
                          onChange={(e) => updateDraftInformation(index, "grade", e.target.value)}
                        />
                      ) : (
                        info.grade
                      )}
                    </td>
                    <td>
                      {isEditMode ? (
                        <EditableInput
                          $changed={isCellChanged(index, "class", info)}
                          inputMode="numeric"
                          value={info.class || ""}
                          onChange={(e) => updateDraftInformation(index, "class", e.target.value)}
                        />
                      ) : (
                        info.class
                      )}
                    </td>
                    <td>
                      {isEditMode ? (
                        <EditableInput
                          $changed={isCellChanged(index, "number", info)}
                          inputMode="numeric"
                          value={info.number || ""}
                          onChange={(e) => updateDraftInformation(index, "number", e.target.value)}
                        />
                      ) : (
                        info.number
                      )}
                    </td>
                    <td>
                      {isEditMode ? (
                        <EditableSelect
                          $changed={isCellChanged(index, "gender", info)}
                          value={info.gender}
                          onChange={(e) => updateDraftInformation(index, "gender", e.target.value)}
                        >
                          <option value="male">남</option>
                          <option value="female">여</option>
                        </EditableSelect>
                      ) : info.gender === "male" ? (
                        "남"
                      ) : (
                        "여"
                      )}
                    </td>
                    <td title={info.name}>
                      {isEditMode ? (
                        <EditableInput
                          $changed={isCellChanged(index, "name", info)}
                          value={info.name}
                          onChange={(e) => updateDraftInformation(index, "name", e.target.value)}
                        />
                      ) : (
                        info.name
                      )}
                    </td>
                    {isEditMode && (
                      <td>
                        <GhostButton onClick={() => removeDraftRow(index)}>삭제</GhostButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>
        )}
      </Card>
    </Wrapper>
  );
}

export default StudentInfoPage;
