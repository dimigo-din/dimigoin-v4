import { useState } from "react";
import styled from "styled-components";
import {
  Text,
  UIBadge,
  UIButton,
  UIControl,
  UIDivider,
  UIInputField,
  UISelectField,
  UITextAreaField,
  UIToggleRow,
} from "../../components/ui";
import { mobile } from "../../styles/media.ts";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: ${({ theme }) => theme.Component.Spacing[600]};
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: ${({ theme }) => theme.Component.Spacing[550]};

  ${mobile} {
    padding: ${({ theme }) => theme.Component.Spacing[300]};
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  border-radius: ${({ theme }) => theme.Component.Radius[600]};
  padding: ${({ theme }) => theme.Component.Spacing[500]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.Component.Spacing[300]};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.Component.Spacing[200]};
  align-items: center;
`;

export default function UiKitPage() {
  const [agree, setAgree] = useState(false);

  return (
    <Wrapper>
      <Section>
        <Text as="h1" variant="title" weight="strong">
          Factory UI Components
        </Text>
        <Text variant="paragraphSmall" color="secondary">
          Figma Atom/Molecule 기준으로 정리한 공통 컴포넌트입니다.
        </Text>
        <UIDivider size="Small" />

        <Text variant="callout" weight="strong">
          Buttons
        </Text>
        <Row>
          <UIButton>Primary</UIButton>
        </Row>

        <Text variant="callout" weight="strong">
          Badges & Controls
        </Text>
        <Row>
          <UIBadge tone="grayscale" label="공지" />
          <UIBadge tone="accent" label="신규" />
          <UIBadge tone="negative" label="긴급" />
          <UIBadge type="circularText" tone="accent" label="9" />
        </Row>
        <Row>
          <UIControl controlType="heart" checked/>
          <UIControl controlType="star" checked />
          <UIControl controlType="check" checked />
          <UIControl controlType="checkFill" checked />
          <UIControl controlType="radio" checked />
        </Row>

        <Text variant="callout" weight="strong">
          Inputs
        </Text>
        <UIInputField
          title="외출 사유"
          placeholder="외출 사유를 입력해주세요"
          subLabel="최대 100자"
        />
        <UIInputField
          title="태그 입력"
          fieldType="double"
          placeholder="입력 후 엔터"
          tags={["병원", "학원", "자기계발"]}
        />
        <UISelectField
          title="학년"
          options={[
            { label: "1학년", value: "1" },
            { label: "2학년", value: "2" },
            { label: "3학년", value: "3" },
          ]}
        />
        <UITextAreaField title="비고" placeholder="추가 설명을 입력해주세요" />
        <UIToggleRow
          label="이용 약관 동의"
          checked={agree}
          onChange={() => setAgree((prev) => !prev)}
        />
      </Section>

      {/* <Section>
        <Text as="h2" variant="callout" weight="strong">
          Mobile Composition
        </Text>
        <PhoneFrame>
          <UINavBar title="잔류 신청" left="‹" right="⋯" />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <UISegmentedControl
              items={[
                { label: "잔류", value: "stay" },
                { label: "금귀", value: "frigo" },
                { label: "세탁", value: "laundry" },
              ]}
              value={segment}
              onChange={setSegment}
            />
            <UIOptionPicker
              items={[
                { label: "자기계발", value: "self" },
                { label: "병원", value: "hospital" },
                { label: "학원", value: "academy" },
                { label: "기타", value: "etc" },
              ]}
              value={picker}
              onChange={setPicker}
              columns={2}
            />
            <UIButton variant={{ stretchWidth: true }}>신청하기</UIButton>
          </div>
        </PhoneFrame>
      </Section> */}
    </Wrapper>
  );
}
