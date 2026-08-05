import styled from "styled-components";
import CheckBoxOn from "../assets/icons/checkbox/check_box_checked.svg?react";

const Element = styled.div<{ canceled: boolean }>`
  min-height: 28px;
  width: auto;
  min-width: fit-content;

  border-radius: 12px;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Paragraph_Large.size};
  line-height: 1;
  font-weight: ${({ theme, canceled }) => (canceled ? theme.Font.Paragraph_Large.weight.regular : theme.Font.Paragraph_Large.weight.weak)};
  transition: border-color 0.3s ease, font-weight 0.3s ease;

  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;

  padding: 2px 4px;
  white-space: nowrap;
  cursor: pointer;

  > svg {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
  }

  > p {
    margin: 0;
    white-space: nowrap;
    word-break: keep-all;
  }

  path {
    fill: ${({ theme, canceled }) => (canceled ? theme.Colors.Core.Brand.Primary : theme.Colors.Content.Standard.Quaternary)};
    transition: fill 0.3s ease;
  }
`;

function CheckBox({
  text,
  canceled,
  onClick,
}: {
  text: string;
  canceled: boolean;
  onClick: () => void;
}) {
  return (
    <Element canceled={canceled} onClick={onClick}>
      <CheckBoxOn />
      <p>{text}</p>
    </Element>
  );
}

export default CheckBox;
