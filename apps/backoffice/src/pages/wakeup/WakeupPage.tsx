import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  deleteWakeupSong,
  getWakeupSongList,
  selectWakeupSong,
  type WakeupApply,
} from "../../api/wakeup.ts";
import { UIButton } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;

  @media (max-width: 900px) {
    padding: 12px;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: space-between;

  gap: 12px;

  @media (max-width: 900px) {
    flex-direction: column;
    min-height: 0;
  }
`;

const Section = styled.div`
  flex: 1;
  min-height: 0;

  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.div`
  min-height: 32px;

  font-size: ${({ theme }) => theme.Font.Title.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  text-align: center;
  align-content: center;

  @media (max-width: 900px) {
    min-height: 0;
    font-size: ${({ theme }) => theme.Font.Headline.size};
    text-align: left;
    padding-left: 4px;
  }
`;

const WakeupList = styled.div`
  flex: 1;
  min-height: 0;
  
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;
  overflow-y: auto;
  
  padding: 10px;
`;

const WakeupItem = styled.div`
  flex: 0 0 auto;
  
  min-height: 110px;
  width: 100%;
  
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  border-radius: 8px;
  
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  
  overflow: hidden;

  @media (max-width: 900px) {
    min-height: 0;
    flex-direction: column;
  }
  
  > .left {
    height: 100%;
    width: 85%;
    
    display: flex;
    flex-direction: row;
    align-items: start;
    
    gap: 0.5dvw;
    padding: 1dvh 2dvh;
    
    img {
      height: 84px;
      width: 126px;
      object-fit: cover;
      
      cursor: pointer;
    }
    
    .info {
      flex: 1;
      min-width: 0;

      .title {
        font-size: ${({ theme }) => theme.Font.Headline.size};
        word-break: break-word;
      }
      .votes {
        color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
      }
    }

    @media (max-width: 900px) {
      width: 100%;
      padding: 12px;
      align-items: center;
      gap: 8px;

      img {
        width: 96px;
        height: 72px;
      }

      .info {
        .title {
          font-size: ${({ theme }) => theme.Font.Body.size};
          line-height: 1.25;
        }

        .votes {
          font-size: ${({ theme }) => theme.Font.Caption.size};
          line-height: 1.25;
        }
      }
    }
  }
  
  > .right {
    width: 22%;
    min-width: 168px;
    padding: 8px;

    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 8px;

    @media (max-width: 900px) {
      width: 100%;
      min-width: 0;
      padding: 0 12px 12px;
    }
  }
`;

const ActionButton = styled(UIButton)`
  min-width: 0;
  width: 100%;
`;

function WakeupPage() {
  const { showToast } = useToast();

  const [applies, setApplies] = useState<WakeupApply[] | null>();

  const updateScreen = () => {
    getWakeupSongList()
      .then((data) => {
        setApplies(
          data.sort(
            (a, b) =>
              b.wakeupSongVote.filter((v) => v.upvote).length -
              a.wakeupSongVote.filter((v) => v.upvote).length,
          ),
        );
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const selectSong = (id: string) => {
    if (!confirm("확정하시겠습니까?")) return;
    selectWakeupSong(id)
      .then(() => {
        showToast("성공했습니다.", "info");
        window.open(
          `https://www.youtube.com/watch?v=${applies?.find((a) => a.id === id)!.video_id}`,
          "_blank",
        );
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  const deleteSong = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    deleteWakeupSong(id)
      .then(() => {
        showToast("성공했습니다.", "info");
        updateScreen();
      })
      .catch((e) => {
        console.error(e);
        showToast(e.response.data.error.message || e.response.data.error, "danger");
      });
  };

  useEffect(() => {
    updateScreen();
  }, []);

  return (
    <Wrapper>
      <ContentWrapper>
        <Section>
          <SectionTitle>남학생 기상송 신청목록</SectionTitle>
          <WakeupList>
            {applies &&
              applies
                .filter((a) => a.gender === "male")
                .map((apply) => {
                  return (
                    <WakeupItem key={apply.id}>
                      <div className="left">
                        <img
                          src={apply.video_thumbnail}
                          alt={apply.video_title}
                          onClick={() => {
                            window.open(
                              `https://www.youtube.com/watch?v=${apply.video_id}`,
                              "_blank",
                            );
                          }}
                        />
                        <div className="info">
                          <div className="title">
                            {apply.video_title.substring(0, 20)}
                            {apply.video_title.length > 20 ? "..." : ""}
                          </div>
                          <div className="votes">
                            좋아요 {apply.wakeupSongVote.filter((v) => v.upvote).length}개 · 싫어요{" "}
                            {apply.wakeupSongVote.filter((v) => !v.upvote).length}개
                          </div>
                        </div>
                      </div>
                      <div className="right">
                        <ActionButton
                          variant={{
                            size: "Small",
                            theme: "Negative",
                            style: "Primary",
                            stretchWidth: true,
                          }}
                          onClick={() => deleteSong(apply.id)}
                        >
                          삭제
                        </ActionButton>
                        <ActionButton
                          variant={{ size: "Small", theme: "Accent", stretchWidth: true }}
                          onClick={() => selectSong(apply.id)}
                        >
                          확정
                        </ActionButton>
                      </div>
                    </WakeupItem>
                  );
                })}
          </WakeupList>
        </Section>
        <Section>
          <SectionTitle>여학생 기상송 신청목록</SectionTitle>
          <WakeupList>
            {applies &&
              applies
                .filter((a) => a.gender === "female")
                .map((apply) => {
                  return (
                    <WakeupItem key={apply.id}>
                      <div className="left">
                        <img
                          src={apply.video_thumbnail}
                          alt={apply.video_title}
                          onClick={() => {
                            window.open(
                              `https://www.youtube.com/watch?v=${apply.video_id}`,
                              "_blank",
                            );
                          }}
                        />
                        <div className="info">
                          <div className="title">
                            {apply.video_title.substring(0, 20)}
                            {apply.video_title.length > 20 ? "..." : ""}
                          </div>
                          <div className="votes">
                            좋아요 {apply.wakeupSongVote.filter((v) => v.upvote).length}개 · 싫어요{" "}
                            {apply.wakeupSongVote.filter((v) => !v.upvote).length}개
                          </div>
                        </div>
                      </div>
                      <div className="right">
                        <ActionButton
                          variant={{
                            size: "Small",
                            theme: "Negative",
                            style: "Primary",
                            stretchWidth: true,
                          }}
                          onClick={() => deleteSong(apply.id)}
                        >
                          삭제
                        </ActionButton>
                        <ActionButton
                          variant={{ size: "Small", theme: "Accent", stretchWidth: true }}
                          onClick={() => selectSong(apply.id)}
                        >
                          확정
                        </ActionButton>
                      </div>
                    </WakeupItem>
                  );
                })}
          </WakeupList>
        </Section>
      </ContentWrapper>
    </Wrapper>
  );
}

export default WakeupPage;
