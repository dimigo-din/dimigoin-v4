import type { ReactNode } from "react";
import styled from "styled-components";
import { mobile } from "../../styles/media.ts";

type SegmentedItem = { label: string; value: string };

interface UISegmentedControlProps {
  items: SegmentedItem[];
  value: string;
  onChange?: (value: string) => void;
  style?: object;
}

const SegmentRoot = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.Colors.Components.Translucent.Secondary};
  border-radius: ${({ theme }) => theme.Component.Radius[500]};
  padding: ${({ theme }) => theme.Component.Spacing[100]};
  display: grid;
  gap: ${({ theme }) => theme.Component.Spacing[100]};
`;

const SegmentItem = styled.button<{ $active: boolean }>`
  height: 52px;
  border: 0;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  color: ${({ theme, $active }) => ($active ? theme.Colors.Content.Standard.Primary : theme.Colors.Content.Standard.Secondary)};
  background: ${({ theme, $active }) => ($active ? theme.Colors.Background.Standard.Primary : "transparent")};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  font-weight: ${({ theme }) => theme.Font.Callout.weight.strong};
`;

export function UISegmentedControl({ items, value, onChange, style }: UISegmentedControlProps) {
  return (
    <SegmentRoot
      style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))`, ...style }}
    >
      {items.map((item) => (
        <SegmentItem
          key={item.value}
          $active={item.value === value}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </SegmentItem>
      ))}
    </SegmentRoot>
  );
}

interface UIOptionPickerProps {
  items: SegmentedItem[];
  value: string;
  onChange?: (value: string) => void;
  columns?: number;
}

const OptionRoot = styled.div<{ $columns: number }>`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: ${({ theme }) => theme.Component.Spacing[200]};

  ${mobile} {
    grid-template-columns: 1fr 1fr;
  }
`;

const OptionItem = styled.button<{ $active: boolean }>`
  min-height: 44px;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.Colors.Core.Brand.Primary : theme.Colors.Line.Outline)};
  background: ${({ theme, $active }) => ($active ? theme.Colors.Core.Brand.Tertiary : theme.Colors.Background.Standard.Primary)};
  color: ${({ theme, $active }) => ($active ? theme.Colors.Core.Brand.Primary : theme.Colors.Content.Standard.Secondary)};
  font-size: ${({ theme }) => theme.Font.Footnote.size};
`;

export function UIOptionPicker({ items, value, onChange, columns = 3 }: UIOptionPickerProps) {
  return (
    <OptionRoot $columns={columns}>
      {items.map((item) => (
        <OptionItem
          key={item.value}
          $active={item.value === value}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </OptionItem>
      ))}
    </OptionRoot>
  );
}

interface UINavBarProps {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
}

const NavRoot = styled.header`
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.Component.Spacing[300]};
  border-bottom: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
`;

const Slot = styled.div`
  min-width: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
`;

const NavTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  line-height: ${({ theme }) => theme.Font.Callout.lineHeight};
  font-weight: ${({ theme }) => theme.Font.Callout.weight.strong};
`;

export function UINavBar({ title, left, right }: UINavBarProps) {
  return (
    <NavRoot>
      <Slot>{left}</Slot>
      <NavTitle>{title}</NavTitle>
      <Slot>{right}</Slot>
    </NavRoot>
  );
}
