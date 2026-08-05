import type { ReactNode } from "react";
import { useState } from "react";
import styled from "styled-components";
import SideBar from "../components/SideBar.tsx";
import { ToastProvider } from "../providers/ToastProvider.tsx";
import { mobile } from "../styles/media.ts";

const Wrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 58px;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};

  ${mobile} {
    padding: 0;
    gap: 0;
    justify-content: flex-start;
    align-items: stretch;
  }
`;

const ContentWrapper = styled.div`
  height: 100%;
  flex: 1;
  min-width: 0;

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  border-radius: 12px;

  overflow: hidden;
  display: flex;
  flex-direction: column;

  ${mobile} {
    width: 100dvw;
    height: 100dvh;
    border-radius: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const TopBar = styled.div`
  display: none;
  ${mobile} {
    display: flex;
    position: relative;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
    background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  }
`;

const HamburgerButton = styled.button`
  display: none;
  ${mobile} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
    color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
    z-index: 1;
  }
`;

const TopBarTitle = styled.span`
  display: none;
  ${mobile} {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 600;
    color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
    pointer-events: none;
  }
`;

const RightSpacer = styled.span`
  display: none;
  ${mobile} {
    display: inline-flex;
    width: 40px;
    height: 40px;
    z-index: 1;
  }
`;

const SideBarHost = styled.div`
  height: 100%;
  width: 341px;
  flex: 0 0 341px;

  ${mobile} {
    width: auto;
    flex: 0 0 auto;
  }
`;

const Backdrop = styled.div<{ $visible: boolean }>`
  display: none;
  ${mobile} {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
    transition: opacity 200ms ease;
    z-index: 8;
  }
`;

function PrimaryLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Wrapper>
      <ToastProvider>
        <SideBarHost>
          <SideBar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SideBarHost>

        <Backdrop $visible={mobileOpen} onClick={() => setMobileOpen(false)} />

        <ContentWrapper>
          <TopBar>
            <HamburgerButton aria-label="Open sidebar" onClick={() => setMobileOpen(true)}>
              ☰
            </HamburgerButton>
            <TopBarTitle>디미고인</TopBarTitle>
            <RightSpacer aria-hidden="true" />
          </TopBar>
          <MainContent>{children}</MainContent>
        </ContentWrapper>
      </ToastProvider>
    </Wrapper>
  );
}

export default PrimaryLayout;
