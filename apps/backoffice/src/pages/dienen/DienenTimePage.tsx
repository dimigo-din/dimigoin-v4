import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { getMealTimeline, type MealTimelineData } from "../../api/dienen.ts";
import { UIButton } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;

  @media (max-width: 900px) {
    padding: 12px;
  }
`;

const Panel = styled.section`
  background: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeaderRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Title.size};
`;

const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  font-size: ${({ theme }) => theme.Font.Footnote.size};
`;

const GradeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const GradeCard = styled.div`
  border-radius: 10px;
  background: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GradeTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Headline.size};
`;

const TimelineRow = styled.div`
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Body.size};
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
`;

const NativeDateInput = styled.input`
  width: 220px;
  height: 44px;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  border: 0;
  padding: 0 12px;
  background: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  @media (max-width: 900px) {
    width: 100%;
  }
`;

function getErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { error?: { message?: string } | string } } };
  if (typeof err?.response?.data?.error === "string") return err.response.data.error;
  return err?.response?.data?.error?.message || "급식 시간 조회에 실패했습니다.";
}

export default function DienenTimePage() {
  const { showToast } = useToast();
  const [date, setDate] = useState<string>(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [timeline, setTimeline] = useState<MealTimelineData | null>(null);

  const grades = useMemo(() => [1, 2, 3] as const, []);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await getMealTimeline(date);
      setTimeline(data);
    } catch (e) {
      console.error(e);
      showToast(getErrorMessage(e), "danger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <Wrapper>
      <Panel>
        <Title>급식 시간 조회</Title>
        <Sub>조회 날짜를 선택하면 해당 주 급식 시간표를 불러옵니다.</Sub>
        <HeaderRow>
          <NativeDateInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <UIButton variant={{ size: "Medium" }} onClick={fetchTimeline} disabled={isLoading}>
            조회
          </UIButton>
        </HeaderRow>
      </Panel>

      <GradeGrid>
        {grades.map((grade) => {
          const items = timeline?.[grade] || [];
          return (
            <GradeCard key={grade}>
              <GradeTitle>{grade}학년</GradeTitle>
              {items.length === 0 ? (
                <EmptyText>
                  {isLoading ? "불러오는 중..." : "등록된 급식 시간이 없습니다."}
                </EmptyText>
              ) : (
                items.map((item, index) => (
                  <TimelineRow key={`${item.time}-${index}`}>
                    <strong>
                      {item.delayed_time
                        ? `${item.delayed_time} (${item.time}에서 지연)`
                        : item.time}
                    </strong>
                    <span>{item.class.join(", ")}반</span>
                  </TimelineRow>
                ))
              )}
            </GradeCard>
          );
        })}
      </GradeGrid>
    </Wrapper>
  );
}
