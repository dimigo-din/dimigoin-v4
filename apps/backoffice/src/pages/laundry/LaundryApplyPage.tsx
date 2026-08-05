import { useEffect, useState } from "react";
import styled from "styled-components";
import { type PersonalInformation } from "../../api/auth.ts";
import {
  type CreateLaundryApplyPayload,
  createLaundryApply,
  deleteLaundryApply,
  getLaundryApplyList,
  getLaundryMachineList,
  getLaundryTimeline,
  getLaundryTimelineList,
  type LaundryApply,
  type LaundryMachine,
  type LaundryTimeline,
} from "../../api/laundry.ts";
import { type User } from "../../api/user.ts";
import Loading from "../../components/Loading.tsx";
import SearchStudent from "../../components/SearchStudent.tsx";
import { UISegmentedControl, UISelectField } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Button } from "../../styles/components/button.ts";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: stretch;

  padding: 24px;

  gap: 24px;

  @media (max-width: 1200px) {
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    padding: 12px;
  }
`;

const ControllerBox = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  
  display: flex;
  flex-direction: column;
  
  gap: 16px;
`;

const BodyBox = styled.div`
  height: 100%;
  width: 65%;
  min-width: 0;
  
  display: flex;
  flex-direction: row;
  align-items: center;
  
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  @media (max-width: 900px) {
    width: 100%;
    min-height: 360px;
  }
  
  > hr {
    width: 0.7px;
    height: 85%; 
    border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  }
`;

const LaundryListContainer = styled.div`
  flex: 1;
  height: 100%;

  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 10px;
  overflow-y: auto;
`;

const FitController = styled.div`
  height: fit-content;
  width: 100%;
  
  display: flex;
  flex-direction: column;

  border-radius: 12px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  padding: 16px;
  gap: 8px;
`;

const Text = styled.p`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  font-weight: 600;
`;

const LaundryApply = styled.div<{ selected?: boolean }>`
  flex: 0 0 auto;
  
  height: 5dvh;
  width: 100%;
  
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  font-size: ${({ theme }) => theme.Font.Headline.size};
  
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  padding: 1dvh 1dvw;

  ${({ selected, theme }) => selected && `background-color: ${theme.Colors.Core.Brand.Primary};`}
`;

function LaundryApplyPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [machines, setMachines] = useState<LaundryMachine[]>([]);
  const [applies, setApplies] = useState<LaundryApply[]>([]);
  const [currentTimeline, setCurrentTimeline] = useState<LaundryTimeline | null>(null);

  const [filterGrade, setFilterGrade] = useState<1 | 2 | 3 | null>(null);
  const [filterGender, setFilterGender] = useState<"male" | "female" | null>(null);

  const gradeSegmentValue = filterGrade ? String(filterGrade) : "all";
  const genderSegmentValue = filterGender || "all";

  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);

  const [nameResults, setNameResults] = useState<(User & PersonalInformation)[]>([]);
  const [nameLoading, setNameLoading] = useState<boolean>(false);
  const [nameSearch, setNameSearch] = useState<string>("");
  const [newUser, setNewUser] = useState<User | null>(null);
  const [applyMachineId, setApplyMachineId] = useState<string | null>(null);
  const [applyTimeId, setApplyTimeId] = useState<string | null>(null);

  const [cancleMachineId, setCancleMachineId] = useState<string | null>(null);
  const [cancleTimeId, setCancleTimeId] = useState<string | null>(null);

  const updateScreen = () => {
    setIsLoading(true);

    getLaundryMachineList()
      .then((res) => {
        setMachines(
          res.sort((a, b) => {
            if (a.gender !== b.gender) {
              return a.gender === "male" ? -1 : 1;
            }

            if (a.type !== b.type) {
              return a.type === "washer" ? -1 : 1;
            }

            const aGrade =
              currentTimeline?.times.find((t) =>
                t.assigns.find((assign) => assign.laundry_machine.id === a.id),
              )?.grade || 0;
            const bGrade =
              currentTimeline?.times.find((t) =>
                t.assigns.find((assign) => assign.laundry_machine.id === b.id),
              )?.grade || 0;
            if (aGrade !== bGrade) {
              return parseInt(aGrade.toString()) - parseInt(bGrade.toString());
            }

            return a.name.localeCompare(b.name);
          }),
        );

        if (res.length > 0) setSelectedMachine(0);
      })
      .catch((err) => {
        console.error(err);
        showToast("세탁기 목록을 불러오는데 실패했습니다.", "warning");
      });

    getLaundryTimelineList()
      .then((res) => {
        const currentTimelineId = res.find((timeline) => timeline.enabled);
        if (currentTimelineId) {
          getLaundryTimeline(currentTimelineId.id)
            .then((timeline) => {
              setCurrentTimeline(timeline);
            })
            .catch((err) => {
              console.error(err);
              showToast("세탁 타임라인을 불러오는데 실패했습니다.", "warning");
            });
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("세탁 타임라인을 불러오는데 실패했습니다.", "warning");
      });

    getLaundryApplyList()
      .then((res) => {
        setApplies(res);

        console.log(res);
      })
      .catch((err) => {
        console.error(err);
        showToast("세탁 신청 목록을 불러오는데 실패했습니다.", "warning");
      })
      .finally(() => {
        setIsLoading(false);

        console.log(applies);
      });
  };

  useEffect(() => {
    updateScreen();
  }, []);

  const applyLaundry = () => {
    if (newUser === null || applyMachineId === null || applyTimeId === null) {
      showToast("학생, 세탁기, 시간을 모두 선택해주세요.", "warning");
      return;
    }

    const dto: CreateLaundryApplyPayload = {
      user: newUser.id,
      machine: applyMachineId,
      laundryTime: applyTimeId,
    };

    createLaundryApply(dto)
      .then(() => {
        showToast("세탁 신청이 완료되었습니다.", "info");
        setNewUser(null);
        setNameSearch("");
        setApplyMachineId(null);
        setApplyTimeId(null);
        updateScreen();
      })
      .catch((e: any) => {
        showToast(
          e.response.data.error.message || e.response.data.error || "세탁 신청에 실패했습니다.",
          "danger",
        );
      });
  };

  const deleteLaundry = () => {
    if (cancleMachineId === null || cancleTimeId === null) {
      showToast("세탁기, 시간을 모두 선택해주세요.", "warning");
      return;
    }

    const apply = applies.find(
      (a) => a.laundry_machine.id === cancleMachineId && a.laundry_time.id === cancleTimeId,
    );
    if (!apply) {
      showToast("해당 세탁 신청을 찾을 수 없습니다.", "warning");
      return;
    }

    deleteLaundryApply(apply.id)
      .then(() => {
        showToast("세탁 신청이 취소되었습니다.", "info");
        updateScreen();
      })
      .catch((e: any) => {
        showToast(
          e.response.data.error.message ||
            e.response.data.error ||
            "세탁 신청 취소에 실패했습니다.",
          "danger",
        );
      });
  };

  return (
    <Wrapper>
      <BodyBox>
        <LaundryListContainer>
          {isLoading ? (
            <Loading />
          ) : (
            machines
              .filter((m) => {
                const timelineGrade = currentTimeline?.times.find((t) =>
                  t.assigns.find((a) => a.laundry_machine.id === m.id),
                )?.grade;
                const gradeFilter = filterGrade === null || timelineGrade?.includes(filterGrade);
                const genderFilter = filterGender === null || m.gender === filterGender;
                return gradeFilter && genderFilter;
              })
              .map((m) => {
                const timelineGrade = currentTimeline?.times.find((t) =>
                  t.assigns.find((a) => a.laundry_machine.id === m.id),
                )?.grade;

                return (
                  <LaundryApply
                    key={m.id}
                    selected={selectedMachine === machines.indexOf(m)}
                    onClick={() => setSelectedMachine(machines.indexOf(m))}
                  >
                    <span>{`[${m.type === "washer" ? "세탁기" : "건조기"}] ${m.name}`}</span>
                    <span>{`(${timelineGrade}학년 ${m.gender === "male" ? "남자" : "여자"})`}</span>
                  </LaundryApply>
                );
              })
          )}
        </LaundryListContainer>
        <hr />
        <LaundryListContainer>
          {isLoading ? (
            <Loading />
          ) : (
            selectedMachine !== null &&
            machines[selectedMachine] &&
            currentTimeline?.times
              .filter((t) =>
                t.assigns.find((a) => a.laundry_machine.id === machines[selectedMachine].id),
              )
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((time) => (
                <LaundryApply key={time.id}>
                  <span>{time.time}</span>
                  {(() => {
                    const user = applies.find(
                      (a) =>
                        a.laundry_machine.id === machines[selectedMachine].id &&
                        a.laundry_time.id === time.id,
                    )?.user;
                    return (
                      user && (
                        <span>{`${user.grade}${user.class}${("0" + user.number).slice(-2)} ${user.name}`}</span>
                      )
                    );
                  })()}
                </LaundryApply>
              ))
          )}
        </LaundryListContainer>
      </BodyBox>
      <ControllerBox>
        <FitController>
          <Text>분류</Text>
          <UISegmentedControl
            items={[
              { label: "1학년", value: "1" },
              { label: "2학년", value: "2" },
              { label: "3학년", value: "3" },
              { label: "모두", value: "all" },
            ]}
            value={gradeSegmentValue}
            onChange={(value) => {
              setFilterGrade(value === "all" ? null : (parseInt(value) as 1 | 2 | 3));
              setSelectedMachine(null);
            }}
          />
          <UISegmentedControl
            items={[
              { label: "남자", value: "male" },
              { label: "여자", value: "female" },
              { label: "모두", value: "all" },
            ]}
            value={genderSegmentValue}
            onChange={(value) => {
              setFilterGender(value === "all" ? null : (value as "male" | "female"));
              setSelectedMachine(null);
            }}
          />
        </FitController>
        <FitController>
          <Text>세탁/건조 신청</Text>
          <SearchStudent
            setNewUser={setNewUser}
            nameResults={nameResults}
            setNameResults={setNameResults}
            nameLoading={nameLoading}
            setNameLoading={setNameLoading}
            nameSearch={nameSearch}
            setNameSearch={setNameSearch}
          />
          <UISelectField
            value={applyMachineId || ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setApplyMachineId(null);
                setApplyTimeId(null);
                return;
              }

              setApplyMachineId(e.target.value);
              setApplyTimeId(null);
            }}
            options={[
              { value: "", label: "세탁/건조기 선택" },
              ...(selectedMachine !== null
                ? machines.map((m) => {
                    const timelineGrade = currentTimeline?.times.find((t) =>
                      t.assigns.find((a) => a.laundry_machine.id === m.id),
                    )?.grade;
                    return {
                      value: m.id,
                      label: `[${m.type === "washer" ? "세탁기" : "건조기"}] ${m.name} (${timelineGrade}학년)`,
                    };
                  })
                : []),
            ]}
          />
          <UISelectField
            value={applyTimeId || ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setApplyTimeId(null);
                return;
              }

              setApplyTimeId(e.target.value);
            }}
            options={[
              { value: "", label: "세탁/건조 시간 선택" },
              ...(selectedMachine !== null && applyMachineId !== null
                ? currentTimeline?.times
                    .filter((t) => t.assigns.find((a) => a.laundry_machine.id === applyMachineId))
                    .filter(
                      (time) =>
                        !applies.find(
                          (a) =>
                            a.laundry_machine.id === applyMachineId &&
                            a.laundry_time.id === time.id,
                        ),
                    )
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((time) => ({ value: time.id, label: time.time })) || []
                : []),
            ]}
          />
          <Button
            type={"primary"}
            style={{ height: "5dvh", padding: 0 }}
            disabled={newUser === null || applyMachineId === null || applyTimeId === null}
            onClick={applyLaundry}
          >
            세탁/건조 신청
          </Button>
        </FitController>
        <StretchController>
          <Text>세탁/건조 신청 취소</Text>
          <UISelectField
            value={cancleMachineId || ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setCancleMachineId(null);
                setCancleTimeId(null);
                return;
              }

              setCancleMachineId(e.target.value);
              setCancleTimeId(null);
            }}
            options={[
              { value: "", label: "세탁/건조기 선택" },
              ...(selectedMachine !== null
                ? machines.map((m) => {
                    const timelineGrade = currentTimeline?.times.find((t) =>
                      t.assigns.find((a) => a.laundry_machine.id === m.id),
                    )?.grade;
                    return {
                      value: m.id,
                      label: `[${m.type === "washer" ? "세탁기" : "건조기"}] ${m.name} (${timelineGrade}학년)`,
                    };
                  })
                : []),
            ]}
          />
          <UISelectField
            value={cancleTimeId || ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setCancleTimeId(null);
                return;
              }

              setCancleTimeId(e.target.value);
            }}
            options={[
              { value: "", label: "세탁/건조 시간 선택" },
              ...(selectedMachine !== null && cancleMachineId !== null
                ? currentTimeline?.times
                    .filter((t) => t.assigns.find((a) => a.laundry_machine.id === cancleMachineId))
                    .filter((time) =>
                      applies.find(
                        (a) =>
                          a.laundry_machine.id === cancleMachineId && a.laundry_time.id === time.id,
                      ),
                    )
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((time) => {
                      const user = applies.find(
                        (a) =>
                          a.laundry_machine.id === cancleMachineId && a.laundry_time.id === time.id,
                      )?.user;
                      return {
                        value: time.id,
                        label: `${time.time} ${user?.number ? ` (${user.grade}${user.class}${("0" + user.number).slice(-2)} ${user.name})` : user?.name || ""}`,
                      };
                    }) || []
                : []),
            ]}
          />
          <Button
            type={"primary"}
            style={{ height: "5dvh", padding: 0 }}
            disabled={cancleMachineId === null || cancleTimeId === null}
            onClick={deleteLaundry}
          >
            세탁/건조 신청 취소
          </Button>
        </StretchController>
      </ControllerBox>
    </Wrapper>
  );
}

export default LaundryApplyPage;
