import { format } from "date-fns";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  getStay,
  getStayApply,
  getStayList,
  getSeatLayout,
  type SeatLayout,
  type Stay,
  type StayApply,
  type StayListItem,
} from "../../api/stay.ts";
import Loading from "../../components/Loading.tsx";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Button } from "../../styles/components/button.ts";
import { Select } from "../../styles/components/select.ts";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: stretch;

  gap: 24px;
  padding: 24px;

  @media (max-width: 1200px) {
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
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

  @media (max-width: 900px) {
    width: 100%;
    min-height: 360px;
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
`;

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

const SeatBox = styled.div`
  flex: 0 0 auto;

  height: 100%;
  width: 100%;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;

  overflow: scroll;
`;

const SeatRow = styled.div`
  white-space: nowrap;

  > div {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    white-space: pre-line;

    width: 4.5dvw;
    height: 3.5 dvw;

    padding: 4px;

    margin: 4px;

    background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
    border-radius: 8px;

    text-align: center;

    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  }

  > div.taken-1 {
    color: rgb(59, 130, 246);
    background-color: rgba(59, 130, 246, 0.15);
  }

  > div.taken-2 {
    color: rgb(139, 92, 246);
    background-color: rgba(139, 92, 246, 0.15);
  }

  > div.taken-3 {
    color: rgb(236, 72, 153);
    background-color: rgba(236, 72, 153, 0.15);
  }
`;

const Text = styled.p`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  margin-bottom: 2px;
`;

function ViewStaySeatPage() {
  const { showToast } = useToast();

  const seatBoxRef = useRef<HTMLDivElement | null>(null);

  const [stayList, setStayList] = useState<StayListItem[] | null>(null);
  const [currentStayIndex, setCurrentStayIndex] = useState<number>(0);
  const [currentStay, setCurrentStay] = useState<Stay | null>(null);
  const [stayApplies, setStayApplies] = useState<StayApply[] | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);

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

  const downloadImage = async () => {
    if (seatBoxRef.current === null) {
      showToast("좌석 배치도를 불러오는 중입니다...", "warning");
      return;
    }

    if (!seatBoxRef.current) return;

    const originalElement = seatBoxRef.current;

    try {
      const clonedElement = originalElement.cloneNode(true) as HTMLElement;

      clonedElement.style.position = "fixed";
      clonedElement.style.top = "-99999px";
      clonedElement.style.left = "-99999px";
      clonedElement.style.overflow = "visible";
      clonedElement.style.height = "auto";
      clonedElement.style.width = "auto";
      clonedElement.style.maxHeight = "none";
      clonedElement.style.maxWidth = "none";
      clonedElement.style.zIndex = "9999";

      document.body.appendChild(clonedElement);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clonedElement, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(clonedElement);

      const dataUrl = canvas.toDataURL("image/png", 1.0);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${currentStay?.name || "seat-layout"} (${format(new Date(currentStay?.stay_from || new Date()), "MM-dd")}~${format(new Date(currentStay?.stay_to || new Date()), "MM-dd")}).png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("좌석 배치도를 성공적으로 내보냈습니다!", "info");
    } catch (error) {
      console.error("이미지 내보내기 실패:", error);
      showToast("이미지 내보내기에 실패했습니다.", "danger");

      const clonedElements = document.querySelectorAll(
        '[style*="position: fixed"][style*="top: -99999px"]',
      );
      clonedElements.forEach((el) => {
        if (document.body.contains(el)) {
          document.body.removeChild(el);
        }
      });
    }
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

  return (
    <Wrapper>
      <StayApplyContainer>
        {currentStay && (
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
                        <SeatRow key={col.name}>
                          {row.map((seat, seatIdx) => {
                            const taken = stayApplies?.find((sapply) => sapply.stay_seat === seat);
                            return (
                              <div
                                id={seat}
                                className={taken ? `taken-${taken.user.grade}` : "notTaken"}
                                key={seat}
                                style={{
                                  marginRight:
                                    (seatIdx + 1) % 9 === 0 && seatIdx !== row.length - 1
                                      ? "20px"
                                      : undefined,
                                }}
                              >
                                {seat}
                                <br />
                                {taken
                                  ? `${taken.user.grade}${taken.user.class}${("0" + taken.user.number).slice(-2)}`
                                  : ""}
                                <br />
                                {taken ? `${taken.user.name.replace(/[0-9]/g, "")}` : ""}
                                <br />
                              </div>
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
        )}
      </StayApplyContainer>
      <ControllerContainer>
        <FitContainer>
          <Text>잔류 일정</Text>
          <Select
            style={{ height: "5dvh" }}
            value={currentStayIndex}
            onChange={(e) => {
              close();
              setCurrentStayIndex(parseInt(e.target.value));
            }}
          >
            {stayList !== null
              ? stayList.map((apply) => {
                  return (
                    <option key={apply.id} value={stayList.indexOf(apply)}>
                      <span>{`${apply.name}`}</span>{" "}
                      <span
                        style={{ color: "#888" }}
                      >{`(${apply.stay_from} ~ ${apply.stay_to})`}</span>
                    </option>
                  );
                })
              : Loading()}
          </Select>
        </FitContainer>
        <FitContainer>
          <Text>파일 내보내기</Text>
          <Button type={"primary"} style={{ height: "5dvh", padding: "0" }} onClick={downloadImage}>
            내보내기
          </Button>
        </FitContainer>
      </ControllerContainer>
    </Wrapper>
  );
}

export default ViewStaySeatPage;
