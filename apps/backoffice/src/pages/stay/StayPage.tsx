import { useEffect, useState } from "react";
import styled from "styled-components";
import { getStay, type Stay } from "../../api/stay.ts";
import { Text, UIButton } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Wrapper, Section, FitContainer, FillContainer, Segment } from "../../layouts/MainLayout.tsx";
import { StayList } from "./StayList.tsx";
import { getErrorMessage } from "../../utils/error.ts";
import { getStayStatus, formatDateRange, formatDateTime, formatDate } from "../../utils/stayStatus.ts";

const HStack = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EmptyState = styled.div`
  height: 100%;
  min-height: 220px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const StayApplyPeriodWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
`;

const StayApplyPeriod = styled.div`
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.Component.Spacing[400]};

  @media (max-width: 1100px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

function StayPage() {
  const { showToast } = useToast();
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [currentStay, setCurrentStay] = useState<Stay | null>(null);
  const [isLoadingStay, setIsLoadingStay] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedStayId) {
      setCurrentStay(null);
      return;
    }

    const loadStay = async () => {
      setIsLoadingStay(true);
      try {
        const stay = await getStay(selectedStayId);
        setCurrentStay(stay);
      } catch (e) {
        showToast(getErrorMessage(e, "잔류 일정을 불러오지 못했습니다."), "danger");
      } finally {
        setIsLoadingStay(false);
      }
    };

    loadStay();
  }, [selectedStayId]);

  const selectedStatus = getStayStatus(currentStay);

  return (
    <Wrapper>
      <Section $width="60%">
        <FitContainer color="Secondary">
          <HStack>
            <Text>
              {(() => {
                if (currentStay) return `${currentStay.name} (${formatDateRange(currentStay.stay_from, currentStay.stay_to)})`;
                if (isLoadingStay) return "잔류 일정을 불러오는 중";
                return "잔류 일정을 선택해주세요";
              })()}
            </Text>
            {currentStay && <Segment color={selectedStatus.color}>{selectedStatus.label}</Segment>}
          </HStack>
        </FitContainer>

        {currentStay ? (
          <FillContainer>
            <FitContainer color="Primary" padding="20px 28px">
              <Text variant="body" weight="strong" as="span">
                신청기간
              </Text>
              <StayApplyPeriodWrapper>
                {[1, 2, 3].map((grade) => {
                  const period = currentStay.stay_apply_period_stay?.find((p) => p.grade === grade);
                  return (
                  <StayApplyPeriod key={grade}>
                    <Text>{grade}학년</Text>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <UIButton variant={{ theme: "Grayscale", style: "Secondary" }}>
                        {formatDateTime(period?.apply_start)}
                      </UIButton>
                      <Text>부터</Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <UIButton variant={{ theme: "Grayscale", style: "Secondary" }}>
                        {formatDateTime(period?.apply_end)}
                      </UIButton>
                      <Text>까지</Text>
                    </div>
                  </StayApplyPeriod>
                  );
                })}
              </StayApplyPeriodWrapper>
            </FitContainer>

            <FitContainer color="Primary" padding="20px 28px">
              <HStack>
                <Text variant="body" weight="strong" as="span">
                  잔류기간
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <UIButton variant={{ theme: "Grayscale", style: "Secondary" }}>
                      {formatDate(currentStay.stay_from)}
                    </UIButton>
                    <Text>부터</Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <UIButton variant={{ theme: "Grayscale", style: "Secondary" }}>
                      {formatDate(currentStay.stay_to)}
                    </UIButton>
                    <Text>까지</Text>
                  </div>
                </div>
              </HStack>
            </FitContainer>

            <FitContainer color="Primary" padding="20px 28px">
              <HStack>
                <Text variant="body" weight="strong" as="span">
                  열람실 좌석 (기능 준비중)
                </Text>
                {/* <UISegmentedControl
                  items={[
                    {
                      label: "평소",
                      value: "1",
                    },
                    {
                      label: "3학년 우선",
                      value: "2",
                    },
                  ]}
                  value={seatSegmentValue}
                  onChange={(value) => {
                    setSeatSegmentValue(value as "1" | "2");
                  }}
                  style={{ width: "50%" }}
                /> */}
              </HStack>
            </FitContainer>
          </FillContainer>
        ) : (
          <FillContainer>
            <EmptyState>
              <Text color="secondary">
                {isLoadingStay ? "불러오는 중입니다." : "잔류 일정을 선택해주세요"}
              </Text>
            </EmptyState>
          </FillContainer>
        )}
      </Section>

      <Section $width="40%">
        <StayList onSelect={setSelectedStayId} />
      </Section>
    </Wrapper>
  );
}

export default StayPage;
