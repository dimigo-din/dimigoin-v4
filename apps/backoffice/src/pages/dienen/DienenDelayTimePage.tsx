import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { delayMealTimeline, getMealTimeline, type MealTimelineData } from "../../api/dienen.ts";
import { UIDivider } from "../../components/ui";
import { UIButton, UIInputField } from "../../components/ui";
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
    min-height: 100%;
  }
`;

const Panel = styled.section`
  background: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 900px) {
    flex: 1;
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

const FieldRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CounterBox = styled.div`
  width: 100%;
  max-width: 320px;
  height: 44px;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  background: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: stretch;
  overflow: hidden;

  @media (max-width: 900px) {
    max-width: none;
  }
`;

const CounterButton = styled.button`
  border: 0;
  background: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Headline.size};
  font-weight: ${({ theme }) => theme.Font.Headline.weight.strong};
`;

const CounterValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  font-weight: ${({ theme }) => theme.Font.Callout.weight.strong};
`;

const TimeList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TimeCard = styled.button<{ $selected: boolean }>`
  border: 0;
  background: ${({ theme, $selected }) => ($selected ? theme.Colors.Core.Brand.Tertiary : theme.Colors.Background.Standard.Tertiary)};
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TimeTitle = styled.strong`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
`;

const TimeMeta = styled.span`
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  font-size: ${({ theme }) => theme.Font.Footnote.size};
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
  font-size: ${({ theme }) => theme.Font.Body.size};
`;

const ActionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
`;

function getErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { error?: { message?: string } | string } } };
  if (typeof err?.response?.data?.error === "string") return err.response.data.error;
  return err?.response?.data?.error?.message || "급식 시간 미루기에 실패했습니다.";
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(normalized / 60);
  const nm = normalized % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

type FlatTimeOption = {
  time: string;
  meta: string;
};

function flattenTimeline(data: MealTimelineData): FlatTimeOption[] {
  const map = new Map<string, string[]>();

  ([1, 2, 3] as const).forEach((grade) => {
    (data[grade] || []).forEach((item) => {
      const current = map.get(item.time) || [];
      current.push(`${grade}학년(${item.class.join(",")}반)`);
      map.set(item.time, current);
    });
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, gradeMeta]) => ({ time, meta: gradeMeta.join(" / ") }));
}

export default function DienenDelayTimePage() {
  const { showToast } = useToast();
  const [timeline, setTimeline] = useState<MealTimelineData | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [delayReason, setDelayReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = useMemo(() => flattenTimeline(timeline || {}), [timeline]);

  const toggleSource = (time: string) => {
    setSelectedSources((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const updateMinutes = (delta: number) => {
    setDelayMinutes((prev) => Math.min(120, Math.max(1, prev + delta)));
  };

  const loadTodayTimeline = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Seoul",
      });
      const data = await getMealTimeline(today);
      setTimeline(data);
    } catch (e) {
      console.error(e);
      showToast(getErrorMessage(e), "danger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayTimeline();
  }, []);

  const submit = async () => {
    if (selectedSources.length === 0) {
      showToast("미룰 급식 시간을 선택해주세요.", "warning");
      return;
    }

    if (!delayMinutes || delayMinutes < 1) {
      showToast("미루기 분은 1분 이상이어야 합니다.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const source of selectedSources) {
        try {
          const dest = addMinutes(source, delayMinutes);
          await delayMealTimeline({
            source,
            dest,
            description: delayReason || "급식 시간이 미뤄졌습니다.",
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to delay ${source}:`, e);
          failCount++;
        }
      }

      if (successCount > 0) {
        showToast(
          `${successCount}개 급식 시간이 미뤄졌습니다.${failCount > 0 ? ` (${failCount}개 실패)` : ""}`,
          failCount > 0 ? "warning" : "info",
        );
      } else {
        showToast("급식 시간 미루기에 실패했습니다.", "danger");
      }

      setSelectedSources([]);
      await loadTodayTimeline();
    } catch (e) {
      console.error(e);
      showToast(getErrorMessage(e), "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <Panel>
        <Title>급식 시간 미루기</Title>
        <Sub>
          오늘 급식 시간표에서 시간을 선택하고, 몇 분 미룰지 지정합니다. 여러 시간대를 선택할 수
          있습니다.
        </Sub>

        <FieldRow>
          <UIButton
            variant={{ size: "Medium", theme: "Grayscale", style: "Secondary" }}
            onClick={loadTodayTimeline}
            disabled={isLoading}
          >
            오늘 시간표 다시 불러오기
          </UIButton>
        </FieldRow>

        {timeOptions.length === 0 ? (
          <EmptyText>
            {isLoading ? "오늘 시간표를 불러오는 중..." : "오늘 등록된 급식 시간이 없습니다."}
          </EmptyText>
        ) : (
          <TimeList>
            {timeOptions.map((item) => (
              <TimeCard
                key={item.time}
                $selected={selectedSources.includes(item.time)}
                onClick={() => toggleSource(item.time)}
              >
                <TimeTitle>{item.time}</TimeTitle>
                <TimeMeta>{item.meta}</TimeMeta>
              </TimeCard>
            ))}
          </TimeList>
        )}

        <ActionSection>
          <UIDivider />
          <FieldRow>
            <CounterBox>
              <CounterButton type="button" onClick={() => updateMinutes(-1)}>
                &lt;
              </CounterButton>
              <CounterValue>{delayMinutes}분</CounterValue>
              <CounterButton type="button" onClick={() => updateMinutes(1)}>
                &gt;
              </CounterButton>
            </CounterBox>
          </FieldRow>

          <FieldRow>
            <UIInputField
              placeholder="미루기 사유 (선택사항)"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              disabled={isLoading}
            />
          </FieldRow>

          <Sub>
            {selectedSources.length > 0
              ? selectedSources.map((s) => `${s} → ${addMinutes(s, delayMinutes)}`).join(", ") +
                ` (${selectedSources.length}개 시간대, ${delayMinutes}분 미루기)`
              : "시간을 먼저 선택해주세요."}
          </Sub>

          <UIButton
            variant={{ size: "Medium" }}
            onClick={submit}
            disabled={isLoading || selectedSources.length === 0}
          >
            미루기 적용
          </UIButton>
        </ActionSection>
      </Panel>
    </Wrapper>
  );
}
