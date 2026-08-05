import type { ButtonHTMLAttributes } from "react";
import styled, { css } from "styled-components";

type ControlType = "heart" | "star" | "toggle" | "check" | "checkFill" | "radio";

interface UIControlProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  controlType?: ControlType;
  checked?: boolean;
  disabled?: boolean;
}

const IconButton = styled.button<{ $checked: boolean; $disabled: boolean; $type: ControlType }>`
  border: 0;
  padding: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: ${({ $type }) => ($type === "toggle" ? "44px" : "24px")};
  height: 24px;

  color: ${({ theme, $checked, $disabled }) => {
    if ($disabled) return theme.Colors.Content.Standard.Quaternary;
    if ($checked) return theme.Colors.Core.Brand.Primary;
    return theme.Colors.Content.Standard.Tertiary;
  }};

  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;

const ToggleTrack = styled.span<{ $checked: boolean; $disabled: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 999px;
  position: relative;
  display: inline-block;

  background-color: ${({ theme, $checked, $disabled }) => {
    if ($disabled) return theme.Colors.Components.Fill.Standard.Secondary;
    if ($checked) return theme.Colors.Core.Brand.Primary;
    return theme.Colors.Components.Fill.Standard.Tertiary;
  }};

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${({ $checked }) => ($checked ? "22px" : "2px")};
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background-color: ${({ theme }) => theme.Colors.Solid.White};
    transition: left 180ms ease;
  }
`;

const Box = styled.span<{ $checked: boolean; $disabled: boolean; $fill: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.Component.Radius[200]};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  ${({ theme, $checked, $disabled, $fill }) => css`
    border: 1.5px solid ${$checked ? theme.Colors.Core.Brand.Primary : theme.Colors.Line.Outline};
    background-color: ${$fill && $checked ? theme.Colors.Core.Brand.Primary : "transparent"};
    color: ${$disabled ? theme.Colors.Content.Standard.Quaternary : $fill ? theme.Colors.Solid.White : theme.Colors.Core.Brand.Primary};
  `}
`;

const Dot = styled.span<{ $checked: boolean; $disabled: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1.5px solid ${({ theme, $checked }) => ($checked ? theme.Colors.Core.Brand.Primary : theme.Colors.Line.Outline)};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background-color: ${({ theme, $checked, $disabled }) => ($checked ? ($disabled ? theme.Colors.Content.Standard.Quaternary : theme.Colors.Core.Brand.Primary) : "transparent")};
  }
`;

export function UIControl({
  controlType = "check",
  checked = false,
  disabled = false,
  ...props
}: UIControlProps) {
  const isToggle = controlType === "toggle";
  return (
    <IconButton
      $checked={checked}
      $disabled={disabled}
      $type={controlType}
      disabled={disabled}
      aria-pressed={checked}
      {...props}
    >
      {isToggle ? <ToggleTrack $checked={checked} $disabled={disabled} /> : null}
      {controlType === "heart" ? (checked ? "♥" : "♡") : null}
      {controlType === "star" ? (checked ? "★" : "☆") : null}
      {controlType === "check" ? (
        <Box $checked={checked} $disabled={disabled} $fill={false}>
          {checked ? "✓" : ""}
        </Box>
      ) : null}
      {controlType === "checkFill" ? (
        <Box $checked={checked} $disabled={disabled} $fill={true}>
          {checked ? "✓" : ""}
        </Box>
      ) : null}
      {controlType === "radio" ? <Dot $checked={checked} $disabled={disabled} /> : null}
    </IconButton>
  );
}
