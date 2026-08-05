import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getPermission, logout, passwordLogin } from "../../api/auth.ts";
import Logo from "../../assets/icons/dimigoin.svg?react";
import Scenery from "../../assets/imgs/schoolscenery.svg?react";
import { useToast } from "../../providers/ToastProvider.tsx";
import { Input } from "../../styles/components/input.ts";
import { parseJwt } from "../../utils/jwt.ts";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
`;

const Brand = styled.div`
  width: min(360px, calc(100% - 32px));
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
`;

const Title = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 10px;
  margin-bottom: 16px;

  font-size: ${({ theme }) => theme.Font.Title.size};
  font-weight: ${({ theme }) => theme.Font.Title.weight.strong};

  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};

  > svg {
    width: 28px;
    height: 28px;
  }
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoginButton = styled.button`
  width: 100%;
  min-height: 56px;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  border: 0;

  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  color: ${({ theme }) => theme.Colors.Solid.White};

  p {
    margin: 0;
    color: inherit;
    font-size: ${({ theme }) => theme.Font.Body.size};
    line-height: ${({ theme }) => theme.Font.Body.lineHeight};
    font-weight: ${({ theme }) => theme.Font.Body.weight.regular};
  }

  &:active:not(:disabled) {
    background-color: ${({ theme }) => theme.Colors.Core.Brand.Secondary};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.Colors.Components.Fill.Standard.Tertiary};
    color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
    cursor: not-allowed;
  }
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  text-decoration: none;
  margin-top: 8px;
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  line-height: ${({ theme }) => theme.Font.Footnote.lineHeight};

  &:hover {
    text-decoration: underline;
  }
`;

const SceneryLayer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  pointer-events: none;

  > svg {
    width: 100%;
    height: auto;
  }
`;

function getErrorMessage(e: unknown) {
  const error = e as { response?: { data?: { error?: unknown } } };
  const apiError = error.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  if (
    apiError &&
    typeof apiError === "object" &&
    "message" in apiError &&
    typeof apiError.message === "string"
  ) {
    return apiError.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function LoginPw() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showToast("이메일과 비밀번호를 입력해주세요.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      showToast("로그인중입니다...", "info");
      const { accessToken } = await passwordLogin(email.trim(), password);
      const payload = parseJwt(accessToken);

      const permissions = await getPermission();
      if (permissions.length === 0) {
        showToast("권한이 없습니다.", "danger");
        await logout();
        return;
      }

      localStorage.setItem("id", payload.id);
      localStorage.setItem("name", payload.name);
      localStorage.setItem("picture", payload.picture);
      localStorage.setItem("permissions", JSON.stringify(permissions));

      showToast("로그인에 성공하였습니다.", "info");
      setTimeout(() => {
        location.href = "/";
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("로그인에 실패했습니다.", "danger");
      showToast(getErrorMessage(e), "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <Brand>
        <Title>
          <Logo />
          <p>디미고인</p>
        </Title>
        <Form onSubmit={onSubmit}>
          <Input
            type="email"
            value={email}
            placeholder="이메일"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            disabled={isLoading}
          />
          <Input
            type="password"
            value={password}
            placeholder="비밀번호"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isLoading}
          />
          <LoginButton type="submit" disabled={isLoading}>
            <p>{isLoading ? "로그인 중..." : "비밀번호로 로그인"}</p>
          </LoginButton>
        </Form>
        <BackLink to="/login">구글 로그인으로 돌아가기</BackLink>
      </Brand>
      <SceneryLayer>
        <Scenery />
      </SceneryLayer>
    </Wrapper>
  );
}

export default LoginPw;
