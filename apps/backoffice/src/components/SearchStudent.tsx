import { useEffect, useState } from "react";
import styled from "styled-components";
import { getPersonalInformation, type PersonalInformation } from "../api/auth.ts";
import { searchUser, type User } from "../api/user.ts";
import { Input } from "../styles/components/input.ts";

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SuggestBox = styled.div`
  width: 100%;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 30dvh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.18);
  z-index: 20;
  max-width: 80dvw;
`;

const SuggestItem = styled.div`
  width: 100%;
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.Font.Paragraph_Large.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 120ms ease;

  &:hover { background-color: ${({ theme }) => theme.Colors.Components.Interaction.Hover}; }
  &:active { background-color: ${({ theme }) => theme.Colors.Components.Interaction.Pressed}; }

  .meta { color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary}; font-size: ${({ theme }) => theme.Font.Footnote.size}; }
`;

interface SearchStudentProps {
  setNewUser: (user: User) => void;
  nameResults: (User & PersonalInformation)[];
  setNameResults: (users: (User & PersonalInformation)[]) => void;
  nameLoading: boolean;
  setNameLoading: (loading: boolean) => void;
  nameSearch?: string;
  setNameSearch?: (name: string) => void;
}

function SearchStudent({
  setNewUser,
  nameResults,
  setNameResults,
  nameLoading,
  setNameLoading,
  nameSearch,
  setNameSearch,
}: SearchStudentProps) {
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

  useEffect(() => {
    setIsSuggestOpen(!!nameSearch);
  }, [nameSearch]);

  useEffect(() => {
    if (!nameSearch) {
      setNameResults([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        setNameLoading(true);
        const res = await searchUser(nameSearch);
        if (!alive) return;
        if (res) {
          getPersonalInformation(res.map((r) => r.email)).then((u) => {
            setNameResults(
              res.map((r, i) => {
                return u[i] ? { ...r, ...u[i] } : null;
              }) as (User & PersonalInformation)[],
            );
          });
        } else {
          setNameResults([]);
        }
      } catch (e) {
        console.error(e);
        setNameResults([]);
      } finally {
        setNameLoading(false);
      }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [nameSearch]);

  return (
    <InputWrapper>
      <Input
        type={"search"}
        placeholder={"학생 이름을 입력해주세요."}
        onFocus={() => setIsSuggestOpen(!!nameSearch)}
        onBlur={() => setTimeout(() => setIsSuggestOpen(false), 120)}
        onInput={(e) => setNameSearch?.((e.target as HTMLInputElement).value)}
        value={nameSearch}
        style={{ height: "5dvh", width: "100%" }}
      />
      {isSuggestOpen && (
        <SuggestBox>
          {nameLoading && (
            <SuggestItem key="loading" onMouseDown={(e) => e.preventDefault()}>
              <span>검색 중…</span>
              <span className="meta">잠시만요</span>
            </SuggestItem>
          )}
          {!nameLoading &&
            nameResults
              .slice(0, 12)
              .filter(Boolean)
              .map((u) => (
                <SuggestItem
                  key={u.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setNewUser(u);
                    setNameSearch?.(`${u.grade}${u.class}${("0" + u.number).slice(-2)} ${u.name}`);
                    setIsSuggestOpen(false);
                  }}
                >
                  <span>
                    {u.grade}
                    {u.class}
                    {("0" + u.number).slice(-2)} {u.name}
                  </span>
                </SuggestItem>
              ))}
          {!nameLoading && nameResults.length === 0 && nameSearch && (
            <SuggestItem key="empty" onMouseDown={(e) => e.preventDefault()}>
              <span>검색 결과가 없습니다</span>
              <span className="meta">다른 키워드를 입력해 보세요</span>
            </SuggestItem>
          )}
        </SuggestBox>
      )}
    </InputWrapper>
  );
}

export default SearchStudent;
