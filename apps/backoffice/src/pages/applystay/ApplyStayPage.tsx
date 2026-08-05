import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import styled from "styled-components";
import { type PersonalInformation } from "../../api/auth.ts";
import {
  changeStaySeat,
  createStayApply,
  deleteStayApply,
  getStay,
  getStayApply,
  getStayList,
  getSeatLayout,
  type Outing,
  type SeatLayout,
  type Stay,
  type StayApply,
  type StayListItem,
  updateStayApply,
} from "../../api/stay.ts";
import { type User } from "../../api/user.ts";
import CheckBox from "../../components/CheckBox.tsx";
import Loading from "../../components/Loading.tsx";
import SearchStudent from "../../components/SearchStudent.tsx";
import SelectionDialog from "../../components/SelectionDialog.tsx";
import { UIButton, UIInputField, UISegmentedControl, UISelectField } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Button, LightButton } from "../../styles/components/button.ts";
import { Input } from "../../styles/components/input.ts";
import { makeid } from "../../utils/makeid.ts";
import { sha256 } from "../../utils/sha256.ts";
import { ExportStayAppliesToExcel } from "../../utils/stay2excel.ts";
import { stay2excel } from "../../utils/stay2format.ts";
import { stay2pdf } from "../../utils/stay2pdf.ts";
import { isInRange } from "../../utils/staySeatUtil.ts";

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

const StayApplyContainer = styled.div`
  height: 100%;
  width: 65%;
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 8px;
  padding: 10px;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;

  overflow-y: auto;

  @media (max-width: 900px) {
    width: 100%;
    height: auto;
    min-height: 340px;
  }
`;

const ControllerContainer = styled.div`
  flex: 1;
  min-width: 0;

  display: flex;
  flex-direction: column;

  overflow-y: auto;

  gap: 16px;

  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  @media (max-width: 900px) {
    height: auto;
    overflow: visible;
  }
`;

// const StretchContainer = styled.div`
//   flex: 1;
//   width: 100%;

//   display: flex;
//   flex-direction: column;
//   gap: 1dvh;

//   border-radius: 8px;

//   background-color: ${({theme}) => theme.Colors.Background.Standard.Secondary};
//   padding: 2dvh 2dvh;
// `;

const FitContainer = styled.div`
  height: fit-content;
  width: 100%;

  border-radius: 12px;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  padding: 16px;

  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoApply = styled.div`
  height: 100%;
  width: 100%;

  text-align: center;
  align-content: center;

  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Title.size};
`;

const StayApplyCard = styled.div<{ outingCount: number }>`
  height: auto;
  width: 100%;

  height: 6dvh;
  flex: 0 0 auto;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  border-radius: 6px;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0 1dvw 2dvh;
  overflow: hidden;
`;

const StayApplyCardSummary = styled.div`
  height: 6dvh;
  width: 100%;

  flex: 0 0 auto;

  display: flex;
  flex-direction: row;
  justify-content: space-between;

  > .left {
    align-content: center;

    font-size: ${({ theme }) => theme.Font.Title.size};
  }

  > .right {
    flex: 1;

    text-align: right;
    align-content: center;
    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  }
`;

const StayApplyDetail = styled.div`
  flex: 0 0 auto;

  height: fit-content;
  width: 100%;

  overflow-y: hidden;

  > button {
    display: block;
    flex: 0 0 auto;

    height: 3.5dvh;
    padding: 0;

    margin-top: 2dvh;
  }

  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
`;

const StayApplyHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  > p {
    font-size: ${({ theme }) => theme.Font.Title.size};
    font-weight: ${({ theme }) => theme.Font.Title.weight};
    margin-bottom: 2dvh;
  }
`;

const SeatBox = styled.div`
  flex: 0 0 auto;

  height: 35dvh;
  width: 100%;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 8px;

  overflow: scroll;
`;

const SeatRow = styled.div<{ seat: string | null }>`
  width: fit-content;

  white-space: nowrap;

  > span {
    display: inline-block;

    width: 4.5dvw;

    padding: 12px 0;
    margin: 4px;

    background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
    border-radius: 8px;

    text-align: center;
  }

  > span.inactive {
    filter: brightness(0.9);
    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  }

  > span.taken-1 {
    background-color: rgba(59, 130, 246, 0.15);
  }

  > span.taken-2 {
    background-color: rgba(139, 92, 246, 0.15);
  }ken

  > span.taken-3 {
    background-color: rgba(236, 72, 153, 0.15);
  }

  > span:active {
    background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  }

  > span#${({ seat }) => seat} {
    color: white;

    background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  }
`;

const OutingBox = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 8px;
  margin-top: 2dvh;

  overflow-y: scroll;

  > div {
    height: 15dvh;
    width: 100%;

    margin-top: 2dvh;

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;

    font-size: ${({ theme }) => theme.Font.Body.size};

    input {
      height: 4dvh;
      padding: 0;

      //border: none;
      font-size: ${({ theme }) => theme.Font.Callout.size};
      text-align: center;
      background-color: inherit;
    }

    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
      filter: ${window.matchMedia("(prefers-color-scheme: dark)").matches ? "invert(1)" : "none"};
    }

    &:not(:last-child)::after {
      content: "";
      display: block;
      width: 80%;
      height: 1px;
      background-color: ${({ theme }) => theme.Colors.Line.Outline};
      margin: 2dvh auto 0; /* 위쪽 간격, 가운데 정렬 */
    }
  }

`;

const ButtonBox = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 8px;
  margin-top: 2dvh;

  height: 5dvh;

  gap: 2dvh;

  > Button {
    padding: 0;
  }

`;

const InputRow = styled.div<{ width?: string }>`
  width: ${({ width }) => width || "100%"};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  > Input {
    padding: 0 8px;
  }
`;

const SpaceBetweenWrapper = styled.div`
  height: 5dvh;
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DeleteBtn = styled.div`
  height: 4dvh;
  width: 7%;

  text-align: center;
  align-content: center;

  font-size: ${({ theme }) => theme.Font.Callout.size};
  background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Red};

  border: 1px solid ${({ theme }) => theme.Colors.Solid.Red};
  border-radius: 12px;

  margin-left: 1%;
`;

const PresetBtn = styled.div`
  height: 4dvh;
  width: 20%;

  text-align: center;
  align-content: center;

  font-size: ${({ theme }) => theme.Font.Callout.size};
  background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Blue};

  border: 1px solid ${({ theme }) => theme.Colors.Solid.Blue};
  border-radius: 12px;

  margin-left: 3%;
`;

const NoOuting = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const Text = styled.p`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  margin-bottom: 2px;
`;

function ApplyStayPage() {
  const KST_TZ = "Asia/Seoul";
  // Convert an ISO UTC string (e.g., "2025-09-07T12:00:00Z") to a local input value for <input type="datetime-local">
  const toLocalInput = (isoUtc?: string | null) => {
    if (!isoUtc) return "";
    return format(new TZDate(isoUtc, KST_TZ), "yyyy-MM-dd'T'HH:mm");
  };
  // Convert a local datetime-local string (no timezone) entered in KST to an ISO UTC string
  const fromLocalInput = (local?: string | null) => {
    if (!local) return "";
    return new Date(new TZDate(local, KST_TZ)).toISOString(); // ISO 8601 UTC
  };

  const { showToast } = useToast();

  const seatRef = useRef<HTMLSpanElement | null>(null);
  const seatBoxRef = useRef<HTMLDivElement | null>(null);

  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>("");
  const [filterState, setFilterState] = useState<boolean | null | undefined>(undefined);
  const [filterGrade, setFilterGrade] = useState<boolean | null | undefined>(undefined);
  const [filterGender, setFilterGender] = useState<boolean | null | undefined>(undefined);
  const [nameResults, setNameResults] = useState<(User & PersonalInformation)[]>([]);
  const [nameLoading, setNameLoading] = useState<boolean>(false);
  const [nameSearch, setNameSearch] = useState<string>("");

  const [stayList, setStayList] = useState<StayListItem[] | null>(null);
  const [currentStayIndex, setCurrentStayIndex] = useState<number>(0);
  const [currentStay, setCurrentStay] = useState<Stay | null>(null);
  const [stayApplies, setStayApplies] = useState<StayApply[] | null>(null);

  const [selectedApply, setSelectedApply] = useState<StayApply | null>(null);
  const [selectedApplyChecksum, setSelectedApplyChecksum] = useState<string | null>(null);
  const [selectedApplySeat, setSelectedApplySeat] = useState<boolean | null>(null);

  const [currentSelectedFileOutput, setCurrentSelectedFileOutput] = useState<string>("");

  const [currentSeatChangeGrade, setCurrentSeatChangeGrade] = useState<number | undefined>(0);
  const [currentSeatChangeLocation, setCurrentSeatChangeLocation] = useState<string>("");
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);

  const gradeSegmentValue =
    filterGrade === true ? "1" : filterGrade === null ? "2" : filterGrade === false ? "3" : "all";

  const genderSegmentValue =
    filterGender === true ? "male" : filterGender === false ? "female" : "all";

  const stateSegmentValue =
    filterState === true
      ? "approved"
      : filterState === null
        ? "review"
        : filterState === false
          ? "rejected"
          : "all";

  const [newUser, setNewUser] = useState<User | null>(null);

  const updateScreen = async () => {
    getStayList()
      .then((res1) => {
        const now = new Date();
        setStayList(
          res1.sort((a, b) => {
            const dateA = new Date(a.stay_from);
            const dateB = new Date(b.stay_from);

            const isAfterA = dateA >= now;
            const isAfterB = dateB >= now;

            if (isAfterA && !isAfterB) return -1;
            if (!isAfterA && isAfterB) return 1;

            return dateA.getTime() - dateB.getTime();
          }),
        );

        if (res1.length > 0) {
          getStay(res1[currentStayIndex].id)
            .then((res3) => {
              setCurrentStay(res3);
            })
            .catch((e) => {
              showToast(e.response.data.error.message || e.response.data.error, "danger");
            });

          getStayApply(res1[currentStayIndex].id)
            .then((res2) => {
              setStayApplies(
                res2.sort((a, b) => {
                  return (
                    a.user.grade - b.user.grade ||
                    a.user.class - b.user.class ||
                    a.user.number - b.user.number
                  );
                }),
              );
            })
            .catch((e) => {
              showToast(e.response.data.error.message || e.response.data.error, "danger");
            });
        }
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const close = (callback?: () => void, bypass?: boolean) => {
    const closeAction = () => {
      setIsClosing(true);
      setTimeout(() => {
        flushSync(() => {
          setIsClosing(false);
          setSelectedApply(null);
          setSelectedApplyChecksum(null);
          setStayApplies((p) => p!.filter((a) => a.id !== "new"));
        });

        if (callback) {
          // 상태 변경이 완전히 반영될 때까지 충분히 기다린 후 콜백 실행
          setTimeout(() => callback(), 100);
        }
      }, 300);
    };

    if (!selectedApply) return;

    if (bypass) {
      closeAction();
      return;
    }

    const merged =
      selectedApply.stay_seat +
      selectedApply.outing
        .map((a) =>
          Object.keys(a)
            .map((k) => String(a[k as keyof typeof a]))
            .join(""),
        )
        .join("");
    sha256(merged).then((data) => {
      if (
        data !== selectedApplyChecksum &&
        !confirm("수정사항이 존재합니다. 정말로 닫으시겠습니까?")
      )
        return;
      else {
        closeAction();
      }
    });
  };

  const isSeatInLayout = (seat: string): boolean => {
    if (!seatLayout) return false;
    const letter = seat.charAt(0);
    const num = parseInt(seat.slice(1));
    return [...seatLayout.left_columns, ...seatLayout.right_columns].some(
      (col) => col.name === letter && num >= 1 && num <= col.max_row,
    );
  };

  const openEditor = (apply: StayApply) => {
    // 현재 선택된 에디터가 없으면 바로 열기
    if (selectedApply === null) {
      // 깊은 복사로 완전히 독립적인 객체 생성
      const applyCopy = JSON.parse(JSON.stringify(apply));

      const merged =
        applyCopy.stay_seat +
        applyCopy.outing
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          .map((a) =>
            Object.keys(a)
              .map((k) => String(a[k]))
              .join(""),
          )
          .join("");

      sha256(merged).then((data) => {
        setSelectedApplyChecksum(data);
        setSelectedApply(applyCopy);
        setSelectedApplySeat(
          applyCopy.id === "new" ? true : isSeatInLayout(applyCopy.stay_seat),
        );
      });
      return;
    }

    // 같은 탭을 다시 클릭한 경우
    if (selectedApply.id === apply.id) {
      close();
      return;
    }

    const merged =
      selectedApply.stay_seat +
      selectedApply.outing.map((a) => Object.values(a).map(String).join("")).join("");
    sha256(merged).then((data) => {
      if (data !== selectedApplyChecksum) {
        if (confirm("다른 열림 탭에 수정사항이 존재합니다. 정말로 닫으시겠습니까?")) {
          // 무한 반복 방지를 위해 새로운 함수로 에디터 열기
          const openNewEditor = (targetApply: StayApply) => {
            const newMerged =
              targetApply.stay_seat +
              targetApply.outing.map((a) => Object.values(a).map(String).join("")).join("");
            sha256(newMerged).then((newData) => {
              setSelectedApplyChecksum(newData);
              setSelectedApply(targetApply);
            });
          };
          close(() => openNewEditor(apply));
        }
      } else {
        close(() => openEditor(apply));
      }
    });
  };

  const edit = () => {
    if (!selectedApply) {
      showToast("선택된 신청이 없습니다.", "danger");
      return;
    }

    if (selectedApply.id === "new") {
      if (!currentStay) {
        showToast("현재 잔류 정보가 없습니다.", "danger");
        return;
      }
      showToast(currentStay.id, "info");

      if (selectedApply.stay_seat === "null") {
        showToast("좌석을 선택해주세요.", "danger");
        return;
      }

      createStayApply({
        stay: currentStay.id,
        user: selectedApply.user.id,
        outing: selectedApply.outing,
        stay_seat: selectedApply.stay_seat,
      })
        .then(() => {
          showToast("성공했습니다.", "info");
          setNameLoading(false);
          setNameResults([]);
          setSelectedApply(null);
          setSelectedApplyChecksum(null);
          updateScreen();
        })
        .catch((e) => {
          console.error(e);
          showToast(e.response.data.error.message || e.response.data.error, "danger");
        });
      return;
    }

    if (!selectedApply.stay_seat) {
      showToast("좌석을 선택해주세요.", "danger");
      return;
    }

    const userTarget = `${selectedApply.user.grade}_${selectedApply.user.gender}`;
    const validSeatRanges = currentStay?.stay_seat_preset.stay_seat_preset_range.filter(
      (target) => target.target === userTarget,
    );

    const isSeatInValidRange =
      validSeatRanges?.some((target) =>
        isInRange(target.range.split(":"), selectedApply.stay_seat),
      ) ?? false;

    const isSeatInAnyRange =
      currentStay?.stay_seat_preset.stay_seat_preset_range.some((target) =>
        isInRange(target.range.split(":"), selectedApply.stay_seat),
      ) ?? false;

    if (isSeatInAnyRange && !isSeatInValidRange) {
      if (!window.confirm("해당 학년의 좌석이 아닙니다. 정말로 저장하시겠습니까?")) {
        return;
      }
    }

    updateStayApply({
      ...selectedApply,
      stay: currentStay!.id,
      user: selectedApply!.user.id,
      stay_seat: selectedApply.stay_seat,
    })
      .then(() => {
        showToast("성공했습니다.", "info");
        close(undefined, true);
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const deleteApply = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    if (id === "new") {
      close(undefined, true);
      updateScreen();
      return;
    }

    deleteStayApply(id)
      .then(() => {
        showToast("성공했습니다.", "info");
        close(undefined, true);
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  useEffect(() => {
    getSeatLayout()
      .then(setSeatLayout)
      .catch((e) => {
        showToast(e.response?.data?.error?.message || e.response?.data?.error || "좌석 레이아웃을 불러오지 못했습니다.", "danger");
      });
  }, []);

  useEffect(() => {
    updateScreen();
  }, [currentStayIndex]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (seatBoxRef.current && seatRef.current) {
        const box = seatBoxRef.current;
        const seat = seatRef.current;

        box.scrollTo({
          top: seat.offsetTop - box.clientHeight / 2 + seat.clientHeight / 2 - box.offsetTop,
          left: seat.offsetLeft - box.clientWidth / 2 + seat.clientWidth / 2 - box.offsetLeft,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [selectedApply]);

  return (
    <Wrapper>
      <StayApplyContainer>
        {stayApplies ? (
          stayApplies.length > 0 ? (
            stayApplies
              .filter(
                (a) =>
                  `${a.user.grade}${a.user.class}${("0" + a.user.number).slice(-2)} ${a.user.name}`.indexOf(
                    filterText,
                  ) !== -1 &&
                  (filterState === undefined || a.outing.some((o) => o.approved === filterState)) &&
                  (filterGrade === undefined ||
                    (filterGrade === true && a.user.grade === 1) ||
                    (filterGrade === null && a.user.grade === 2) ||
                    (filterGrade === false && a.user.grade === 3)) &&
                  (filterGender === undefined ||
                    (filterGender === true && a.user.gender === "male") ||
                    (filterGender === false && a.user.gender === "female")),
              )
              .map((apply) => {
                return (
                  <StayApplyCard
                    key={apply.id}
                    outingCount={
                      (selectedApply ? selectedApply.outing.length : null) || apply.outing.length
                    }
                  >
                    <StayApplyCardSummary>
                      <div
                        className="left"
                        onClick={(e) => {
                          if (e.currentTarget === e.target) {
                            openEditor(apply);
                          }
                        }}
                      >
                        <>
                          {apply.user.grade}
                          {apply.user.class}
                          {("0" + apply.user.number).slice(-2)} {apply.user.name}
                        </>
                      </div>
                      <div
                        className="right"
                        onClick={(e) => {
                          if (e.currentTarget === e.target) {
                            openEditor(apply);
                          }
                        }}
                      >
                        {apply.stay_seat} | 외출 {apply.outing.length}건
                      </div>
                    </StayApplyCardSummary>
                  </StayApplyCard>
                );
              })
          ) : (
            <NoApply>신청자가 없습니다.</NoApply>
          )
        ) : (
          Loading()
        )}
      </StayApplyContainer>
      <ControllerContainer>
        <FitContainer>
          <Text>잔류 일정</Text>
          <UISelectField
            value={String(currentStayIndex)}
            onChange={(e) => {
              close();
              setCurrentStayIndex(parseInt(e.target.value));
            }}
            options={
              stayList !== null
                ? stayList.map((apply, index) => ({
                    value: String(index),
                    label: `${apply.name} (${apply.stay_from} ~ ${apply.stay_to})`,
                  }))
                : [{ value: "0", label: "불러오는 중..." }]
            }
          />
        </FitContainer>
        <FitContainer>
          <Text>잔류 신청 추가</Text>
          <SearchStudent
            setNewUser={setNewUser}
            nameResults={nameResults}
            setNameResults={setNameResults}
            nameLoading={nameLoading}
            setNameLoading={setNameLoading}
            nameSearch={nameSearch}
            setNameSearch={setNameSearch}
          />
          <UIButton
            disabled={newUser === null}
            variant={{ size: "Medium", theme: "Accent", stretchWidth: true }}
            onClick={() => {
              const newApply = {
                id: "new",
                stay_seat: "null",
                outing: [],
                user: newUser,
              } as unknown as StayApply;
              setSelectedApply(newApply);
            }}
          >
            잔류 신청 추가하기
          </UIButton>
        </FitContainer>
        <FitContainer>
          <Text>잔류자 검색</Text>
          <UIInputField
            placeholder="검색할 학생명을 입력하세요."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <UISegmentedControl
            items={[
              {
                label: `1학년 (${stayApplies?.filter((apply) => apply.user.grade === 1).length || 0}건)`,
                value: "1",
              },
              {
                label: `2학년 (${stayApplies?.filter((apply) => apply.user.grade === 2).length || 0}건)`,
                value: "2",
              },
              {
                label: `3학년 (${stayApplies?.filter((apply) => apply.user.grade === 3).length || 0}건)`,
                value: "3",
              },
              { label: `모두 (${stayApplies?.length || 0}건)`, value: "all" },
            ]}
            value={gradeSegmentValue}
            onChange={(value) => {
              setFilterGrade(
                value === "1" ? true : value === "2" ? null : value === "3" ? false : undefined,
              );
            }}
          />
          <UISegmentedControl
            items={[
              {
                label: `남자 (${stayApplies?.filter((apply) => apply.user.gender === "male").length || 0}건)`,
                value: "male",
              },
              {
                label: `여자 (${stayApplies?.filter((apply) => apply.user.gender === "female").length || 0}건)`,
                value: "female",
              },
              { label: `모두 (${stayApplies?.length || 0}건)`, value: "all" },
            ]}
            value={genderSegmentValue}
            onChange={(value) => {
              setFilterGender(value === "male" ? true : value === "female" ? false : undefined);
            }}
          />
        </FitContainer>
        <FitContainer>
          <Text>외출 검색</Text>
          <UISegmentedControl
            items={[
              {
                label: `허가 (${stayApplies?.reduce((count, apply) => count + apply.outing.filter((outing) => outing.approved === true).length, 0) || 0}건)`,
                value: "approved",
              },
              {
                label: `검토 (${stayApplies?.reduce((count, apply) => count + apply.outing.filter((outing) => outing.approved === null).length, 0) || 0}건)`,
                value: "review",
              },
              {
                label: `불허 (${stayApplies?.reduce((count, apply) => count + apply.outing.filter((outing) => outing.approved === false).length, 0) || 0}건)`,
                value: "rejected",
              },
              {
                label: `모두 (${stayApplies?.reduce((count, apply) => count + apply.outing.length, 0) || 0}건)`,
                value: "all",
              },
            ]}
            value={stateSegmentValue}
            onChange={(value) => {
              setFilterState(
                value === "approved"
                  ? true
                  : value === "review"
                    ? null
                    : value === "rejected"
                      ? false
                      : undefined,
              );
            }}
          />
        </FitContainer>
        <FitContainer>
          <Text>잔류장소 일괄 이동</Text>
          <SpaceBetweenWrapper>
            <div style={{ width: "40%" }}>
              <UISelectField
                value={currentSeatChangeGrade ? String(currentSeatChangeGrade) : ""}
                onChange={(e) => {
                  close();
                  setCurrentSeatChangeGrade(
                    e.target.value === "" ? undefined : parseInt(e.target.value),
                  );
                }}
                options={[
                  { value: "", label: "학년 선택" },
                  { value: "1", label: "1학년" },
                  { value: "2", label: "2학년" },
                  { value: "3", label: "3학년" },
                ]}
              />
            </div>
            <div style={{ width: "57%" }}>
              <UIInputField
                onChange={(e) => setCurrentSeatChangeLocation(e.target.value)}
                value={currentSeatChangeLocation}
                placeholder="장소 입력..."
              />
            </div>
          </SpaceBetweenWrapper>
          <Button
            disabled={currentSeatChangeGrade === undefined || currentSeatChangeLocation == ""}
            style={{ height: "5dvh", padding: 0 }}
            onClick={() => {
              const targets = stayApplies?.filter(
                (apply) => apply.user.grade === currentSeatChangeGrade,
              );
              if (!targets || targets.length === 0) {
                showToast("해당 학년의 잔류자가 없습니다.", "warning");
                return;
              }

              if (
                !confirm(
                  `정말로 ${currentSeatChangeGrade}학년 ${targets.length}명의 잔류장소를 '${currentSeatChangeLocation}'(으)로 일괄 변경하시겠습니까?`,
                )
              )
                return;

              const to = currentSeatChangeLocation;
              changeStaySeat(
                targets.map((apply) => apply.id),
                to,
              )
                .then(() => {
                  showToast("잔류장소 일괄 이동이 완료되었습니다.", "info");
                  setCurrentSeatChangeGrade(undefined);
                  setCurrentSeatChangeLocation("");
                })
                .catch((e) => {
                  showToast(e, "danger");
                });
            }}
          >
            잔류장소 일괄 이동
          </Button>
        </FitContainer>
        <FitContainer>
          <Text>파일 내보내기</Text>
          <SpaceBetweenWrapper>
            <div style={{ width: "70%" }}>
              <UISelectField
                value={currentSelectedFileOutput}
                onChange={(e) => setCurrentSelectedFileOutput(e.target.value)}
                options={[
                  { value: "", label: "선택하세요.." },
                  { value: "in", label: "내부용" },
                  { value: "out", label: "외부용 (엑셀)" },
                  { value: "out_pdf", label: "외부용 (PDF)" },
                  { value: "dorm", label: "생활관용" },
                ]}
              />
            </div>
            <Button
              style={{ width: "27%", height: "100%", fontSize: "14px", padding: "0 8px" }}
              onClick={async () => {
                if (currentSelectedFileOutput === "") {
                  showToast("내보내기 형식을 선택하세요.", "danger");
                } else if (currentSelectedFileOutput === "in") {
                  if (stayApplies?.filter((apply) => apply.id != "new") && currentStay) {
                    await updateScreen();
                    ExportStayAppliesToExcel(
                      currentStay,
                      stayApplies?.filter((apply) => apply.id != "new"),
                    );
                  } else showToast("내보낼 데이터가 없습니다.", "warning");
                } else if (currentSelectedFileOutput === "out") {
                  if (stayApplies?.filter((apply) => apply.id != "new") && currentStay) {
                    await updateScreen();
                    stay2excel(
                      stayApplies?.filter((apply) => apply.id != "new"),
                      currentStay,
                      { masking: true },
                    );
                  } else showToast("내보낼 데이터가 없습니다.", "warning");
                } else if (currentSelectedFileOutput === "out_pdf") {
                  if (stayApplies?.filter((apply) => apply.id != "new") && currentStay) {
                    await updateScreen();
                    stay2pdf(
                      stayApplies?.filter((apply) => apply.id != "new"),
                      currentStay,
                      { masking: true },
                      `외부용 잔류 현황 (${currentStay.stay_from} ~ ${currentStay.stay_to}).pdf`,
                    );
                  } else showToast("내보낼 데이터가 없습니다.", "warning");
                } else if (currentSelectedFileOutput === "dorm") {
                  if (stayApplies?.filter((apply) => apply.id != "new") && currentStay) {
                    await updateScreen();
                    stay2excel(
                      stayApplies?.filter((apply) => apply.id != "new"),
                      currentStay,
                      { masking: false },
                    );
                  } else showToast("내보낼 데이터가 없습니다.", "warning");
                }
              }}
            >
              내보내기
            </Button>
          </SpaceBetweenWrapper>
        </FitContainer>
      </ControllerContainer>

      <SelectionDialog
        isOpen={!!selectedApply && !isClosing}
        closeAction={() => close()}
        onOpen={() => {}}
      >
        {selectedApply && stayApplies ? (
          <>
            <StayApplyDetail>
              <StayApplyHeader>
                <p>
                  {selectedApply.user.grade}
                  {selectedApply.user.class}
                  {("0" + selectedApply.user.number).slice(-2)} {selectedApply?.user.name}
                </p>
                <div style={{ width: "25%", marginBottom: "2dvh" }}>
                  <UISegmentedControl
                    items={[
                      { label: "열람실", value: "seat" },
                      { label: "좌석 미선택", value: "none" },
                    ]}
                    value={selectedApplySeat === true ? "seat" : "none"}
                    onChange={(value) => setSelectedApplySeat(value === "seat")}
                  />
                </div>
              </StayApplyHeader>
              {selectedApplySeat ? (
                <SeatBox ref={seatBoxRef}>
                  {seatLayout ? (() => {
                    const renderSection = (columns: { name: string; max_row: number }[]) => {
                      const grouped: { name: string; max_row: number }[][] = [];
                      for (let i = 0; i < columns.length; i += 2) {
                        grouped.push(columns.slice(i, i + 2));
                      }
                      return grouped.map((group, idx) => (
                        <div key={idx} style={{ marginBottom: "16px" }}>
                          {group.map((col) => {
                            const row = Array.from(
                              { length: col.max_row },
                              (_, i) => `${col.name}${i + 1}`,
                            );
                            return (
                              <SeatRow seat={selectedApply.stay_seat} key={col.name}>
                                {row.map((seat: string, seatIdx) => {
                                  const isActive =
                                    currentStay?.stay_seat_preset.stay_seat_preset_range.some(
                                      (target) =>
                                        isInRange(target.range.split(":"), seat) &&
                                        target.target ===
                                          `${selectedApply.user.grade}_${selectedApply.user.gender}`,
                                    );
                                  const taken = stayApplies.find(
                                    (sapply) =>
                                      sapply.stay_seat === seat &&
                                      sapply.stay_seat !== selectedApply.stay_seat,
                                  );
                                  return (
                                    <span
                                      id={seat}
                                      ref={selectedApply.stay_seat === seat ? seatRef : null}
                                      className={[
                                        isActive || taken ? "active" : "inactive",
                                        taken ? `taken-${taken.user.grade}` : "notTaken",
                                      ].join(" ")}
                                      onClick={() =>
                                        setSelectedApply((p) => ({ ...p!, stay_seat: seat }))
                                      }
                                      key={seat}
                                      style={{
                                        marginRight:
                                          (seatIdx + 1) % 9 === 0 && seatIdx !== row.length - 1
                                            ? "20px"
                                            : undefined,
                                      }}
                                    >
                                      {taken ? taken.user.name.replace(/[0-9]/g, "") : seat}
                                    </span>
                                  );
                                })}
                              </SeatRow>
                            );
                          })}
                        </div>
                      ));
                    };
                    return (
                      <>
                        {renderSection(seatLayout.left_columns)}
                        <div style={{ height: "1px", background: "currentColor", opacity: 0.1, margin: "8px 0 16px" }} />
                        <div style={{ paddingLeft: "calc(9 * (4.5dvw + 8px) + 20px)" }}>
                          {renderSection(seatLayout.right_columns)}
                        </div>
                      </>
                    );
                  })() : <div style={{ padding: "16px", textAlign: "center" }}>좌석 정보를 불러오는 중...</div>}
                </SeatBox>
              ) : (
                <Input
                  type={"text"}
                  style={{ width: "100%", fontSize: "14px", height: "8dvh" }}
                  placeholder={"좌석 미선택 사유나 잔류 위치를 입력하세요."}
                  value={
                    currentStay?.stay_seat_preset.stay_seat_preset_range.some((target) =>
                      isInRange(target.range.split(":"), selectedApply.stay_seat),
                    )
                      ? ""
                      : selectedApply.stay_seat
                  }
                  onInput={(e) => {
                    selectedApply.stay_seat = (e.target as HTMLInputElement).value;
                    setSelectedApply({ ...selectedApply });
                  }}
                />
              )}
              <OutingBox style={{ height: selectedApplySeat === true ? "45dvh" : "72dvh" }}>
                {selectedApply.outing.map((outing) => {
                  const modify = (deleteTarget?: Outing) => {
                    setSelectedApply((p) => {
                      if (deleteTarget)
                        return {
                          ...p!,
                          outing: p!.outing.filter((p2) => p2.id !== deleteTarget.id),
                        };
                      else
                        return {
                          ...p!,
                          outing: p!.outing.map((o) => {
                            return o.id === outing.id
                              ? {
                                  ...outing,
                                }
                              : o;
                          }),
                        };
                    });
                  };

                  return (
                    <div key={outing.id}>
                      <InputRow>
                        <Input
                          type={"text"}
                          style={{ width: "62%" }}
                          onInput={(e) => {
                            outing.reason = (e.target as HTMLInputElement).value;
                            modify();
                          }}
                          value={outing.reason}
                          placeholder={"외출 사유를 입력하세요.."}
                        />
                        <div style={{ width: "18%" }}>
                          <UISegmentedControl
                            items={[
                              { label: "허가", value: "approved" },
                              { label: "검토", value: "review" },
                              { label: "불허", value: "rejected" },
                            ]}
                            value={
                              outing.approved === true
                                ? "approved"
                                : outing.approved === null
                                  ? "review"
                                  : "rejected"
                            }
                            onChange={(value) => {
                              outing.approved =
                                value === "approved" ? true : value === "review" ? null : false;
                              modify();
                            }}
                          />
                        </div>
                        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                        {/* @ts-ignore */}
                        <DeleteBtn
                          onClick={() => {
                            modify(outing);
                          }}
                        >
                          삭제
                        </DeleteBtn>
                      </InputRow>
                      <InputRow>
                        <Input
                          type={"datetime-local"}
                          onInput={(e) => {
                            outing.from = fromLocalInput((e.target as HTMLInputElement).value);
                            modify();
                          }}
                          onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={toLocalInput(outing.from)}
                          step={600}
                          min="2025-01-01T00:00"
                        />
                        <p>부터&nbsp;&nbsp;</p>
                        <Input
                          type={"datetime-local"}
                          onInput={(e) => {
                            outing.to = fromLocalInput((e.target as HTMLInputElement).value);
                            modify();
                          }}
                          onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          value={toLocalInput(outing.to)}
                          step={600}
                          min="2025-01-01T00:00"
                        />
                        <p>까지</p>

                        <PresetBtn
                          onClick={() => {
                            if (!currentStay) return;
                            const stayFromDate = new Date(currentStay.stay_from);
                            const stayToDate = new Date(currentStay.stay_to);

                            // Find the Sunday during the stay period
                            let sunday = new Date(stayFromDate);
                            while (sunday.getDay() !== 0) {
                              // 0 = Sunday
                              sunday.setDate(sunday.getDate() + 1);
                            }

                            // If Sunday is after the stay period, use the first Sunday before
                            if (sunday > stayToDate) {
                              sunday = new Date(stayFromDate);
                              while (sunday.getDay() !== 0) {
                                sunday.setDate(sunday.getDate() - 1);
                              }
                            }

                            // Set from time to Sunday 10:20
                            const fromTime = new Date(sunday);
                            fromTime.setHours(10, 20, 0, 0);

                            // Set to time to Sunday 14:00
                            const toTime = new Date(sunday);
                            toTime.setHours(14, 0, 0, 0);

                            outing.reason = "자기계발외출";
                            outing.from = fromTime.toISOString();
                            outing.to = toTime.toISOString();
                            modify();
                          }}
                        >
                          자기계발외출 입력
                        </PresetBtn>
                      </InputRow>
                      <InputRow>
                        <CheckBox
                          text="아침 취소"
                          canceled={outing.breakfast_cancel}
                          onClick={() => {
                            outing.breakfast_cancel = !outing.breakfast_cancel;
                            modify();
                          }}
                        ></CheckBox>
                        &nbsp;&nbsp;
                        <CheckBox
                          text="점심 취소"
                          canceled={outing.lunch_cancel}
                          onClick={() => {
                            outing.lunch_cancel = !outing.lunch_cancel;
                            modify();
                          }}
                        ></CheckBox>
                        &nbsp;&nbsp;
                        <CheckBox
                          text="저녁 취소"
                          canceled={outing.dinner_cancel}
                          onClick={() => {
                            outing.dinner_cancel = !outing.dinner_cancel;
                            modify();
                          }}
                        ></CheckBox>
                      </InputRow>
                    </div>
                  );
                })}
                {selectedApply.outing.length === 0 && <NoOuting>외출 신청이 없습니다.</NoOuting>}
              </OutingBox>
              <ButtonBox>
                <LightButton
                  type={"yellow"}
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    setSelectedApply((p) => {
                      return {
                        ...p!,
                        outing: [
                          ...p!.outing,
                          {
                            id: makeid(10),
                            reason: "",
                            breakfast_cancel: false,
                            lunch_cancel: false,
                            dinner_cancel: false,
                            from: "",
                            to: "",
                            approved: true,
                          },
                        ],
                      };
                    });
                  }}
                >
                  외출추가
                </LightButton>
                <LightButton type={"danger"} onClick={() => deleteApply(selectedApply!.id)}>
                  삭제하기
                </LightButton>
                <Button onClick={() => edit()}>
                  {selectedApply?.id == "new" ? "생성하기" : "수정하기"}
                </Button>
              </ButtonBox>
            </StayApplyDetail>
          </>
        ) : null}
      </SelectionDialog>
    </Wrapper>
  );
}

export default ApplyStayPage;
