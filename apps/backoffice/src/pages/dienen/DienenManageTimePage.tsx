import styled from "styled-components";

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
  max-width: 680px;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Title.size};
`;

const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  font-size: ${({ theme }) => theme.Font.Body.size};
`;

const Badge = styled.div`
  width: fit-content;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  background: ${({ theme }) => theme.Colors.Components.Translucent.Secondary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  font-weight: ${({ theme }) => theme.Font.Footnote.weight.strong};
`;

export default function DienenManageTimePage() {
  return (
    <Wrapper>
      <Panel>
        <Title>급식 시간 관리</Title>
        <Badge>개발중</Badge>
        <Sub>
          급식 시간 관리 기능은 현재 개발중입니다. 우선은 조회/미루기 기능을 먼저 제공하고, 시간표
          등록/수정은 안정화 후 순차 적용할 예정입니다.
        </Sub>
      </Panel>
    </Wrapper>
  );
}
