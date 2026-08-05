import { type ComponentType, type SVGProps, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { checkPermission, logout, ping } from "../api/auth.ts";
import ArtistIcon from "../assets/icons/artist.svg?react";
import Logo from "../assets/icons/dimigoin.svg?react";
import HomeWorkIcon from "../assets/icons/home_work.svg?react";
import LaundryIcon from "../assets/icons/laundry.svg?react";
import LogoutIcon from "../assets/icons/logout.svg?react";
import SchoolIcon from "../assets/icons/school.svg?react";
import { mobile } from "../styles/media.ts";

type MenuItemType = { key: string; label: string };
type SectionIcon = ComponentType<SVGProps<SVGSVGElement>>;

type MenuSection = {
  title: string;
  key: string;
  icon: SectionIcon;
  items: MenuItemType[];
};

const Wrapper = styled.aside<{ $mobileOpen: boolean }>`
  height: 100%;
  width: 100%;
  padding: ${({ theme }) => `${theme.Component.Spacing[750]} ${theme.Component.Spacing[550]}`};

  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.Component.Spacing[500]};

  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  border-radius: 12px;
  overflow: hidden;

  ${mobile} {
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: 78dvw;
    max-width: 320px;
    border-radius: 0;
    transform: translateX(${({ $mobileOpen }) => ($mobileOpen ? "0" : "-100%")});
    transition: transform 220ms ease;
    z-index: 9;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.Component.Spacing[300]};
`;

const Brand = styled.div`
  width: 253px;
  > svg {
    width: ${({ theme }) => theme.Component.Spacing[700]};
    height: ${({ theme }) => theme.Component.Spacing[700]};
  }
`;

const UserBox = styled.div`
  width: 100%;
  display: flex;
  align-items: start;
  justify-content: space-between;
  // 8 16 16 20
  padding: ${({ theme }) => `${theme.Component.Spacing[200]} ${theme.Component.Spacing[400]} ${theme.Component.Spacing[400]} ${theme.Component.Spacing[500]}`};
`;

const UserRow = styled.div`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  display: flex;
  flex-direction: column;
  gap: 2px;

  .role {
    font-size: ${({ theme }) => theme.Font.Body.size};
    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
    line-height: ${({ theme }) => theme.Font.Body.lineHeight};
  }

  .name {
    font-size: ${({ theme }) => theme.Font.Title.size};
    font-weight: ${({ theme }) => theme.Font.Headline.weight.strong};
    line-height: ${({ theme }) => theme.Font.Title.lineHeight};
  }
`;

const LogoutButton = styled.button`
  width: 24px;
  height: 24px;
  margin: auto 0px;
  > svg {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
  }

  path {
    fill: currentColor;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  background: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  display: none;

  ${mobile} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const MenuArea = styled.nav`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 36px;
`;

const MenuSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.Component.Spacing[300]};
  padding: 0 16px;
`;

const SectionTitle = styled.div<{ $selected: boolean }>`
  width: 100%;
  height: 40px;

  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: auto 16px;

  color: ${({ theme, $selected }) => ($selected ? theme.Colors.Core.Brand.Primary : theme.Colors.Content.Standard.Tertiary)};
  font-size: ${({ theme }) => theme.Font.Headline.size};
  font-weight: ${({ theme, $selected }) => ($selected ? theme.Font.Headline.weight.regular : theme.Font.Headline.weight.weak)};
  line-height: ${({ theme }) => theme.Font.Headline.lineHeight};

  > svg {
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
  }

  path {
    fill: currentColor;
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 ${({ theme }) => theme.Component.Spacing[700]};
`;

const ItemButton = styled.button<{ $selected: boolean }>`
  width: fit-content;
  height: 32px;
  border-radius: 8px;
  padding: auto 20px;
  text-align: left;
  color: ${({ theme, $selected }) => ($selected ? theme.Colors.Core.Brand.Primary : theme.Colors.Content.Standard.Quaternary)};
  font-size: ${({ theme }) => theme.Font.Headline.size};
  font-weight: ${({ theme, $selected }) => ($selected ? theme.Font.Headline.weight.regular : theme.Font.Headline.weight.weak)};
  line-height: ${({ theme }) => theme.Font.Headline.lineHeight};

  &:hover {
    color: ${({ theme, $selected }) => ($selected ? theme.Colors.Core.Brand.Primary : theme.Colors.Content.Standard.Tertiary)};
  }
`;

const UtilityArea = styled.div`
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.Colors.Line.Divider};
`;

const UtilityButton = styled.button<{ $selected?: boolean }>`
  width: 100%;
  height: 40px;
  border-radius: 10px;
  text-align: left;
  padding: 0 12px;
  color: ${({ theme, $selected }) => ($selected ? theme.Colors.Content.Standard.Primary : theme.Colors.Content.Standard.Secondary)};
  background: ${({ theme, $selected }) => ($selected ? theme.Colors.Background.Standard.Tertiary : "transparent")};
`;

const Footer = styled.p`
  margin: 10px 0 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Quaternary};
  text-align: center;
  font-size: ${({ theme }) => theme.Font.Caption.size};
`;

function getSections(): MenuSection[] {
  const sections_teacher: MenuSection[] = [
    {
      title: "잔류",
      key: "stay-section",
      icon: SchoolIcon,
      items: [
        { key: "stay", label: "잔류 관리" },
        { key: "applystay", label: "잔류 신청 관리" },
        { key: "viewstayseat", label: "열람실 좌석" },
      ],
    },
    {
      title: "금요귀가",
      key: "frigo-section",
      icon: HomeWorkIcon,
      items: [
        { key: "frigo", label: "금요귀가 관리" },
        { key: "applyfrigo", label: "금요귀가 신청 관리" },
      ],
    },
    {
      title: "세탁",
      key: "laundry-section",
      icon: LaundryIcon,
      items: [
        { key: "laundrytimeline", label: "세탁 시간표 관리" },
        { key: "laundrymachine", label: "세탁기 관리" },
        { key: "applylaundry", label: "세탁 신청 관리" },
      ],
    },
    {
      title: "기상곡",
      key: "wakeup-section",
      icon: ArtistIcon,
      items: [{ key: "wakeup", label: "기상송 열람 및 관리" }],
    },
    {
      title: "시설 관리",
      key: "facility-section",
      icon: SchoolIcon,
      items: [{ key: "facility", label: "시설 제보 관리" }],
    },
  ];

  const sections_dienen: MenuSection[] = [
    {
      title: "디넌",
      key: "dienen-section",
      icon: ArtistIcon,
      items: [
        { key: "dienen_time", label: "급식 시간 조회" },
        // { key: "dienen_edittime", label: "급식 시간 관리" },
        { key: "dienen_delaytime", label: "급식 시간 미루기" },
      ],
    },
  ];

  const hasManagePermission = checkPermission("teacher");
  const hasDienenPermission = checkPermission("dienen");

  const sections: MenuSection[] = [];
  if (hasManagePermission) sections.push(...sections_teacher);
  if (hasDienenPermission) sections.push(...sections_dienen);
  return sections;
}

export default function SideBar({
  mobileOpen = false,
  onClose,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;
  const isAuthFree = pathname.startsWith("/login") || pathname.startsWith("/openwakeup");

  const menuList = useMemo(() => getSections(), []);
  const name = window.localStorage.getItem("name");
  const hasManagePermission = checkPermission("teacher");
  const hasDienenPermission = checkPermission("dienen");

  useEffect(() => {
    if (!isAuthFree) {
      ping();
    }
  }, [isAuthFree]);

  useEffect(() => {
    if (!isAuthFree && !name) {
      navigate("/login", { replace: true });
    }
  }, [isAuthFree, name, navigate]);

  if (isAuthFree) return null;

  const teacherRole = hasManagePermission ? "선생님" : hasDienenPermission ? "디넌" : "선생님";

  return (
    <Wrapper $mobileOpen={mobileOpen}>
      <CloseButton aria-label="Close sidebar" onClick={() => onClose?.()}>
        ✕
      </CloseButton>

      <Header>
        <Brand>
          <Logo />
        </Brand>
        <UserBox>
          <UserRow>
            <span className="role">{teacherRole}</span>
            <span className="name">{name ?? "-"}</span>
          </UserRow>
          <LogoutButton
            type="button"
            aria-label="로그아웃"
            onClick={() => {
              logout();
              navigate("/login");
              onNavigate?.();
            }}
          >
            <LogoutIcon aria-hidden="true" focusable="false" />
          </LogoutButton>
        </UserBox>
      </Header>

      <MenuArea>
        {menuList.map((menu) => {
          const Icon = menu.icon;
          const sectionSelected = menu.items.some((item) => pathname.startsWith(`/${item.key}`));

          return (
            <MenuSection key={menu.key}>
              <SectionTitle $selected={sectionSelected}>
                <Icon aria-hidden="true" focusable="false" />
                {menu.title}
              </SectionTitle>
              <ItemList>
                {menu.items.map((item) => {
                  const selected = pathname.startsWith(`/${item.key}`);
                  return (
                    <ItemButton
                      key={item.key}
                      type="button"
                      $selected={selected}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => {
                        navigate(`/${item.key}`);
                        onNavigate?.();
                      }}
                    >
                      {item.label}
                    </ItemButton>
                  );
                })}
              </ItemList>
            </MenuSection>
          );
        })}
      </MenuArea>

      <UtilityArea>
        {hasManagePermission ? (
          <UtilityButton
            type="button"
            $selected={pathname.startsWith("/studentinfo")}
            onClick={() => {
              navigate("/studentinfo");
              onNavigate?.();
            }}
          >
            학생정보 등록
          </UtilityButton>
        ) : null}
        <Footer>© 2026 DIMIGOIN Backoffice</Footer>
      </UtilityArea>
    </Wrapper>
  );
}
