import styled from "styled-components";
import Logo from "../assets/icons/dimigoin.svg?react";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
`;

const Title = styled.div`
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  gap: 10px;

  font-size: ${({ theme }) => theme.Font.Title.size};
  font-weight: ${({ theme }) => theme.Font.Display.weight.strong};
  
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  
  > svg {
    height: 28px;
    width: 28px;
  }
`;

function EmptyPage() {
  return (
    <Wrapper>
      <Title>
        <Logo />
        <p>디미고인</p>
      </Title>
    </Wrapper>
  );
}

export default EmptyPage;
