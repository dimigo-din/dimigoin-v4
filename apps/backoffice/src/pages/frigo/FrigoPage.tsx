import { useEffect, useState } from "react";
import styled from "styled-components";
import { getPersonalInformation, type PersonalInformation } from "../../api/auth.ts";
import {
  auditFrigo,
  createFrigoApply,
  type FrigoApply,
  type FrigoApplyPayload,
  type FrigoTiming,
  getFrigoApplies,
} from "../../api/frigo.ts";
import { searchUser, type User } from "../../api/user.ts";
import Loading from "../../components/Loading.tsx";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Button } from "../../styles/components/button.ts";
import { Input } from "../../styles/components/input.ts";
import { ExportFrigoAppliesToExcel } from "../../utils/frigo2excel.ts";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: stretch;

  gap: 24px;
  padding: 24px;
  overflow-y: auto;

  @media (max-width: 1200px) {
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
    height: auto;
    min-height: 100%;
    flex-direction: column;
    padding: 12px;
  }
`;

const ApplyList = styled.div`
  width: 65%;
  min-width: 0;
  height: 100%;

  display: flex;
  flex-direction: column;
  gap: 8px;

  border-radius: 12px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};

  padding: 10px;

  overflow-y: auto;

  @media (max-width: 900px) {
    width: 100%;
    height: auto;
    min-height: 340px;
  }
`;

const ControllerBox = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  
  display: flex;
  flex-direction: column;
  
  gap: 16px;

  @media (max-width: 900px) {
    height: auto;
  }
`;

const FitController = styled.div`
  height: fit-content;
  width: 100%;
  
  display: flex;
  flex-direction: column;

  border-radius: 12px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};

  padding: 16px;
  gap: 8px;
`;

const StretchController = styled.div`
  flex: 1;
  width: 100%;
  
  display: flex;
  flex-direction: column;

  border-radius: 12px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};

  padding: 16px;
  gap: 8px;
`;

const ExportButton = styled.div`
  height: 5dvh;
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SelectionRow = styled.div<{ height?: string; width?: string }>`
  margin-left: ${({ width }) => (width ? "none" : "2%")};
  
  height: ${({ height }) => height || "4dvh"};
  width: ${({ width }) => width || "18%"};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  font-size: ${({ theme }) => theme.Font.Callout.size};
  
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  border-radius: 12px;
  
  overflow: hidden;
`;

const SelectionItem = styled.div<{ border?: boolean; selected: boolean }>`
  flex: 1;
  
  height: 100%;
  
  text-align: center;
  align-content: center;
  
  color: ${({ theme, selected }) => (selected ? theme.Colors.Solid.White : theme.Colors.Content.Standard.Primary)};
  
  border-left: ${({ theme, border }) => (border ? `1px solid ${theme.Colors.Line.Outline}` : "none")};
  
  background-color: ${({ theme, selected }) => (selected ? theme.Colors.Core.Brand.Primary : "none")};
`;

const Apply = styled.div`
  flex: 0 0 auto;
  
  height: 6dvh;
  
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  
  border-radius: 8px;
  
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  padding: 0 2dvh;
  
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  
  > .left {
    display: flex;
    flex-direction: row;
    
    align-items: center;
    
    gap: 0.5vw;
    
    .name {
      font-size: ${({ theme }) => theme.Font.Title.size};
    }
    .detail {
      font-size: ${({ theme }) => theme.Font.Headline.size};
      color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
      
      > .when {
        font-size: ${({ theme }) => theme.Font.Headline.size};
        background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
        border: none;
        border-radius: 8px;
        
        padding: 2px;

        width: auto;
      }
    }
  }
  
  > .right {
    
  }
`;

const Text = styled.p`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SuggestBox = styled.div`
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
  width: 100%;
`;

const SuggestItem = styled.div`
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

function FrigoPage() {
  const { showToast } = useToast();

  // Type for student user suggestion results
  type StudentUser = User & PersonalInformation;

  const [nameSearch, setNameSearch] = useState<string>("");

  const [newUser, setNewUser] = useState<User | null>(null);
  const [newReason, setNewReason] = useState<string | null>(null);
  const [newTiming, setNewTiming] = useState<FrigoTiming | null>(null);

  const [filterName, setFilterName] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<1 | 2 | 3 | null>(null);
  const [filterGender, setFilterGender] = useState<"male" | "female" | null>(null);
  const [filterState, setFilterState] = useState<boolean | null | undefined>(undefined);

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [nameResults, setNameResults] = useState<StudentUser[]>([]);
  const [nameLoading, setNameLoading] = useState<boolean>(false);

  const [applies, setApplies] = useState<FrigoApply[] | null>(null);

  const canApply = !(newUser === null || newTiming === null || newReason === null);

  const updateScreen = () => {
    getFrigoApplies()
      .then((data) => {
        setApplies(data);
      })
      .catch((e) => {
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const apply = () => {
    if (newTiming === null || newUser === null || newReason === null) return;
    createFrigoApply({ timing: newTiming, user: newUser.id, reason: newReason })
      .then(() => {
        showToast("성공했습니다.", "info");
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const updateFrigo = (data: FrigoApplyPayload) => {
    createFrigoApply(data)
      .then(() => {
        showToast("성공했습니다.", "info");
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const updateState = (id: string, state: boolean | null) => {
    auditFrigo(id, state)
      .then(() => {
        showToast("성공했습니다.", "info");
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  useEffect(() => {
    updateScreen();
  }, []);

  useEffect(() => {
    setIsSuggestOpen(!!nameSearch);
  }, [nameSearch]);

  useEffect(() => {
    let alive = true;
    if (!nameSearch) {
      setNameResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setNameLoading(true);
      const res = await searchUser(nameSearch);
      if (!alive) return;
      if (res && res.length) {
        const emails = res.map((r) => r.email).filter(Boolean) as string[];
        try {
          const personals = emails.length ? await getPersonalInformation(emails) : [];
          const merged = res.map((r, i) =>
            personals[i] ? ({ ...r, ...personals[i] } as StudentUser) : (r as StudentUser),
          );
          setNameResults(merged);
        } catch {
          setNameResults(res as StudentUser[]);
        }
      } else {
        setNameResults([]);
      }
      setNameLoading(false);
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [nameSearch]);

  return (
    <Wrapper>
      <ApplyList>
        {applies !== null ? (
          applies
            .filter(
              (a) =>
                (filterGrade === null || filterGrade === a.user.grade) &&
                (filterGender === null || filterGender === a.user.gender) &&
                (filterState === undefined || filterState === a.approved) &&
                (filterName === "" || a.user.name.includes(filterName)),
            )
            .sort((a, b) => {
              if (a.user.grade !== b.user.grade) return a.user.grade - b.user.grade;
              if (a.user.class !== b.user.class) return a.user.class - b.user.class;
              return a.user.number - b.user.number;
            })
            .map((a) => {
              return (
                <Apply key={a.id}>
                  <div className={"left"}>
                    <div className="name">
                      {a.user.grade}
                      {a.user.class}
                      {("0" + a.user.number).slice(-2)} {a.user.name} (
                      {a.user.gender === "male" ? "남" : "여"})
                    </div>
                    <div className="detail">
                      {a.reason}/ &nbsp;
                      <select
                        className={"when"}
                        value={a.timing}
                        onInput={(e) => {
                          updateFrigo({
                            user: a.user.id,
                            timing: (e.target as HTMLInputElement).value as FrigoTiming,
                            reason: a.reason,
                          });
                        }}
                      >
                        {/*"afterschool" | "dinner" | "after_1st_study" | "after_2nd_study";*/}
                        <option value="afterschool">방과후</option>
                        <option value="dinner">저녁시간</option>
                        <option value="after_1st_study">야간자율학습 1타임 이후</option>
                        <option value="after_2nd_study">야간자율학습 2타임 이후</option>
                      </select>
                    </div>
                  </div>
                  <div className={"right"}>
                    <SelectionRow width={"10dvw"}>
                      <SelectionItem
                        selected={a.approved == true}
                        onClick={() => {
                          updateState(a.id, true);
                        }}
                      >
                        허가
                      </SelectionItem>
                      <SelectionItem
                        selected={a.approved == null}
                        border={true}
                        onClick={() => {
                          updateState(a.id, null);
                        }}
                      >
                        검토
                      </SelectionItem>
                      <SelectionItem
                        selected={a.approved == false}
                        border={true}
                        onClick={() => {
                          updateState(a.id, false);
                        }}
                      >
                        반려
                      </SelectionItem>
                    </SelectionRow>
                  </div>
                </Apply>
              );
            })
        ) : (
          <Loading />
        )}
      </ApplyList>
      <ControllerBox>
        <FitController>
          <Text>신청하기</Text>
          <InputWrapper>
            <Input
              type={"search"}
              placeholder={"학생 이름을 입력해주세요."}
              onFocus={() => setIsSuggestOpen(!!nameSearch)}
              onBlur={() => setTimeout(() => setIsSuggestOpen(false), 120)}
              onInput={(e) => setNameSearch((e.target as HTMLInputElement).value)}
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
                  nameResults.slice(0, 12).map((u) => (
                    <SuggestItem
                      key={u.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewUser(u);
                        setNameSearch(
                          `${u.grade}${u.class}${("0" + u.number).slice(-2)} ${u.name}`,
                        );
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
          <Input
            placeholder={"사유를 입력해주세요"}
            onInput={(e) => setNewReason((e.target as HTMLInputElement).value)}
            value={newReason!}
            style={{ height: "5dvh", width: "100%" }}
          />
          <SelectionRow width={"100%"}>
            <SelectionItem
              selected={newTiming === "afterschool"}
              onClick={() => setNewTiming("afterschool")}
            >
              종례 후
            </SelectionItem>
            <SelectionItem
              selected={newTiming === "dinner"}
              border={true}
              onClick={() => setNewTiming("dinner")}
            >
              저녁시간
            </SelectionItem>
            <SelectionItem
              selected={newTiming === "after_1st_study"}
              border={true}
              onClick={() => setNewTiming("after_1st_study")}
            >
              야자1T
            </SelectionItem>
            <SelectionItem
              selected={newTiming === "after_2nd_study"}
              border={true}
              onClick={() => setNewTiming("after_2nd_study")}
            >
              야자2T
            </SelectionItem>
          </SelectionRow>
          <Button
            disabled={!canApply}
            onClick={() => apply()}
            style={{ height: "5dvh", padding: 0 }}
          >
            신청하기
          </Button>
        </FitController>
        <StretchController>
          <Text>분류</Text>
          <Input
            value={filterName}
            onInput={(e) => setFilterName((e.target as HTMLInputElement).value)}
            placeholder={"이름을 입력해주세요."}
            style={{ height: "5dvh", paddingTop: 0, paddingBottom: 0 }}
          />
          <SelectionRow width={"100%"}>
            <SelectionItem selected={filterGrade === 1} onClick={() => setFilterGrade(1)}>
              1학년 ({applies && applies.filter((a) => a.user.grade === 1).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterGrade === 2}
              border={true}
              onClick={() => setFilterGrade(2)}
            >
              2학년 ({applies && applies.filter((a) => a.user.grade === 2).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterGrade === 3}
              border={true}
              onClick={() => setFilterGrade(3)}
            >
              3학년 ({applies && applies.filter((a) => a.user.grade === 3).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterGrade === null}
              border={true}
              onClick={() => setFilterGrade(null)}
            >
              모두 ({applies && applies.length}건)
            </SelectionItem>
          </SelectionRow>
          <SelectionRow width={"100%"}>
            <SelectionItem
              selected={filterGender === "male"}
              onClick={() => setFilterGender("male")}
            >
              남 ({applies && applies.filter((a) => a.user.gender === "male").length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterGender === "female"}
              border={true}
              onClick={() => setFilterGender("female")}
            >
              여 ({applies && applies.filter((a) => a.user.gender === "female").length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterGender === null}
              border={true}
              onClick={() => setFilterGender(null)}
            >
              모두 ({applies && applies.length}건)
            </SelectionItem>
          </SelectionRow>
          <SelectionRow width={"100%"}>
            <SelectionItem selected={filterState === true} onClick={() => setFilterState(true)}>
              허가 ({applies && applies.filter((a) => a.approved === true).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterState === null}
              border={true}
              onClick={() => setFilterState(null)}
            >
              검토 ({applies && applies.filter((a) => a.approved === null).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterState === false}
              border={true}
              onClick={() => setFilterState(false)}
            >
              불허 ({applies && applies.filter((a) => a.approved === false).length}건)
            </SelectionItem>
            <SelectionItem
              selected={filterState === undefined}
              border={true}
              onClick={() => setFilterState(undefined)}
            >
              모두 ({applies && applies.length}건)
            </SelectionItem>
          </SelectionRow>
        </StretchController>
        <FitController>
          <Text>파일 내보내기</Text>
          <ExportButton>
            <Button
              style={{ height: "100%", fontSize: "14px", padding: "0 8px" }}
              onClick={() => {
                ExportFrigoAppliesToExcel(applies?.filter((a) => a.approved === true) || [], {
                  filename: `금요귀가 신청 현황(${applies?.[0]?.week ? new Date(new Date(applies[0].week).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)})`,
                });
              }}
            >
              내보내기
            </Button>
          </ExportButton>
        </FitController>
      </ControllerBox>
    </Wrapper>
  );
}

export default FrigoPage;
