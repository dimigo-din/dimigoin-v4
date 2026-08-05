import { useEffect, useState } from "react";
import styled from "styled-components";
import { deleteStay, getStay, getStayList, type StayListItem } from "../../api/stay.ts";
import { Text, UIButton } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Button } from "../../styles/components/button.ts";
import { FillContainer, Segment } from "../../layouts/MainLayout.tsx";
import { getErrorMessage } from "../../utils/error.ts";
import { type StayStatus, getStayStatus, formatDateRange } from "../../utils/stayStatus.ts";

const ScheduleButton = styled.div<{ $selected?: boolean }>`
  min-height: 56px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  padding: 8px 20px;
  border-radius: 12px;

  background-color: ${({ theme, $selected }) => ($selected ? theme.Colors.Components.Interaction.Focussed : theme.Colors.Components.Translucent.Interactive)};

  &:hover {
    cursor: ${({ $selected }) => ($selected ? "auto" : "pointer")};
  }
`;

type StayListItemWithStatus = StayListItem & { status: StayStatus };

type StayListProps = {
  onSelect: (id: string | null) => void;
};

export function StayList({ onSelect }: StayListProps) {
  const { showToast } = useToast();
  const [stayList, setStayList] = useState<StayListItemWithStatus[]>([]);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);

  const updateScreen = async () => {
    try {
      const list = (await getStayList()).sort(
        (a, b) => new Date(a.stay_from).getTime() - new Date(b.stay_from).getTime(),
      );
      const stays = await Promise.all(list.map((item) => getStay(item.id)));
      const nextStayList = list.map((item, i) => ({ ...item, status: getStayStatus(stays[i]) }));
      setStayList(nextStayList);
      let isStayDeleted = false;
      setSelectedStayId((previous) => {
        if (!previous) return null;
        if (nextStayList.some((stay) => stay.id === previous)) return previous;
        isStayDeleted = true;
        return null;
      });
      if (isStayDeleted) {
        onSelect(null);
        showToast("선택된 잔류 일정이 존재하지 않습니다.", "danger");
      }
    } catch (e) {
      showToast(getErrorMessage(e, "잔류 일정 목록을 불러오지 못했습니다."), "danger");
    }
  };

  useEffect(() => {
    updateScreen();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedStayId(id);
    onSelect(id);
  };

  const handleDeleteStay = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteStay(id);
      showToast("삭제했습니다.", "info");
      await updateScreen();
    } catch (e) {
      showToast(getErrorMessage(e, "잔류 일정을 삭제하지 못했습니다."), "danger");
    }
  };

  return (
    <FillContainer padding="0">
      <FillContainer>
        <Text weight="strong">잔류 일정 목록</Text>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
          {stayList.length === 0 ? (
            <Text color="secondary">등록된 잔류 일정이 없습니다.</Text>
          ) : (
            stayList.map((stay) => {
              const selected = stay.id === selectedStayId;
              return (
                <ScheduleButton key={stay.id} $selected={selected} onClick={() => handleSelect(stay.id)}>
                  <Text weight={selected ? "strong" : "regular"}>
                    {stay.name} ({formatDateRange(stay.stay_from, stay.stay_to)})
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Segment color={stay.status.color}>{stay.status.label}</Segment>
                    <Button
                      style={{ width: "80px", height: "40px", padding: 0 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteStay(stay.id);
                      }}
                    >
                      <Text weight="strong" style={{ color: "#f4f4f5" }}>
                        삭제
                      </Text>
                    </Button>
                  </div>
                </ScheduleButton>
              );
            })
          )}
        </div>
      </FillContainer>

      <UIButton
        variant={{ size: "Large" }}
        style={{ margin: "24px" }}
        onClick={() => showToast("잔류 일정 추가 기능은 아직 연결되지 않았습니다.", "warning")}
      >
        잔류 일정 추가하기
      </UIButton>
    </FillContainer>
  );
}
