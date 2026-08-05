import { format } from "date-fns";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import {
  changeFacilityReportStatus,
  deleteFacilityComment,
  deleteFacilityImg,
  deleteFacilityReport,
  getFacilityImgObjectUrl,
  getFacilityReport,
  getFacilityReportList,
  postFacilityComment,
  type FacilityReport,
  type FacilityReportListItem,
  type FacilityReportStatus,
  type FacilityReportType,
} from "../../api/facility.ts";
import Loading from "../../components/Loading.tsx";
import SelectionDialog from "../../components/SelectionDialog.tsx";
import { UIButton, UIInputField, UISegmentedControl, UISelectField } from "../../components/ui";
import { useToast } from "../../providers/ToastProvider.tsx";

// ─── Layout ──────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;

  @media (max-width: 1200px) {
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
    height: auto;
    min-height: 100%;
    flex-direction: column;
    padding: 12px;
  }
`;

const ReportListContainer = styled.div`
  height: 100%;
  width: 65%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  border-radius: 12px;
  overflow-y: auto;

  @media (max-width: 900px) {
    width: 100%;
    height: auto;
    min-height: 340px;
  }
`;

const ControllerContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  @media (max-width: 900px) {
    height: auto;
    overflow: visible;
  }
`;

const FitContainer = styled.div`
  height: fit-content;
  width: 100%;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Text = styled.p`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  margin-bottom: 2px;
`;

const NoReport = styled.div`
  height: 100%;
  width: 100%;
  text-align: center;
  align-content: center;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Title.size};
`;

// ─── Report Card ─────────────────────────────────────────────────────────────

const ReportCard = styled.div<{ $selected: boolean }>`
  height: 6dvh;
  width: 100%;
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Tertiary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  border-left: 3px solid transparent;

  ${({ $selected, theme }) =>
    $selected &&
    css`
      border-left-color: ${theme.Colors.Core.Brand.Primary};
      background-color: ${theme.Colors.Solid.Translucent.Blue};
    `}
`;

const CardLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const CardRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ReportSubject = styled.span`
  font-size: ${({ theme }) => theme.Font.Body.size};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const ReportMeta = styled.span`
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  white-space: nowrap;
`;

// ─── Badges ──────────────────────────────────────────────────────────────────

const TypeBadge = styled.span<{ $type: FacilityReportType }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: ${({ theme }) => theme.Font.Caption.size};
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;

  ${({ $type, theme }) =>
    $type === "suggest"
      ? css`
          background-color: ${theme.Colors.Solid.Translucent.Green};
          border: 1px solid ${theme.Colors.Solid.Green};
          color: ${theme.Colors.Solid.Green};
        `
      : $type === "broken"
        ? css`
            background-color: ${theme.Colors.Solid.Translucent.Yellow};
            border: 1px solid ${theme.Colors.Solid.Yellow};
            color: ${theme.Colors.Solid.Yellow};
          `
        : css`
            background-color: ${theme.Colors.Solid.Translucent.Red};
            border: 1px solid ${theme.Colors.Solid.Red};
            color: ${theme.Colors.Solid.Red};
          `}
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: ${({ theme }) => theme.Font.Caption.size};
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;

  ${({ $status, theme }) => {
    const s = $status.toLowerCase();
    if (s === "done")
      return css`
        background-color: ${theme.Colors.Solid.Translucent.Green};
        border: 1px solid ${theme.Colors.Solid.Green};
        color: ${theme.Colors.Solid.Green};
      `;
    if (s === "under_review" || s === "working")
      return css`
        background-color: ${theme.Colors.Solid.Translucent.Blue};
        border: 1px solid ${theme.Colors.Solid.Blue};
        color: ${theme.Colors.Solid.Blue};
      `;
    if (s === "failed")
      return css`
        background-color: ${theme.Colors.Solid.Translucent.Red};
        border: 1px solid ${theme.Colors.Solid.Red};
        color: ${theme.Colors.Solid.Red};
      `;
    return css`
      background-color: ${theme.Colors.Background.Standard.Tertiary};
      border: 1px solid ${theme.Colors.Line.Outline};
      color: ${theme.Colors.Content.Standard.Secondary};
    `;
  }}
`;

// ─── Pagination ───────────────────────────────────────────────────────────────

const PageNav = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 5dvh;
`;

const PageNum = styled.span`
  flex: 1;
  text-align: center;
  font-size: ${({ theme }) => theme.Font.Body.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
`;

// ─── Dialog ───────────────────────────────────────────────────────────────────

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
`;

const DialogHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const DialogSubject = styled.h2`
  font-size: ${({ theme }) => theme.Font.Title.size};
  font-weight: ${({ theme }) => theme.Font.Title.weight};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  margin: 0;
  word-break: break-word;
`;

const DialogMeta = styled.span`
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.Colors.Line.Divider};
  margin: 0;
  flex-shrink: 0;
`;

const DialogSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  margin: 0;
`;

const BodyText = styled.p`
  font-size: ${({ theme }) => theme.Font.Body.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
`;

// ─── Images ───────────────────────────────────────────────────────────────────

const ImageRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const ImageWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.Font.Caption.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
`;

const ImageDeleteBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Red};
  border: 1px solid ${({ theme }) => theme.Colors.Solid.Red};
  color: ${({ theme }) => theme.Colors.Solid.Red};
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
`;

// ─── Comments ─────────────────────────────────────────────────────────────────

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 20dvh;
  overflow-y: auto;
`;

const NoComment = styled.p`
  font-size: ${({ theme }) => theme.Font.Body.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  text-align: center;
  padding: 8px 0;
  margin: 0;
`;

const CommentItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Secondary};
`;

const CommentHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const CommentAuthor = styled.span`
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  font-weight: 600;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
`;

const CommentDate = styled.span`
  font-size: ${({ theme }) => theme.Font.Caption.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  flex: 1;
`;

const CommentDeleteBtn = styled.button`
  font-size: ${({ theme }) => theme.Font.Caption.size};
  color: ${({ theme }) => theme.Colors.Solid.Red};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const CommentText = styled.p`
  font-size: ${({ theme }) => theme.Font.Body.size};
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  margin: 0;
  word-break: break-word;
`;

const CommentInputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(t: FacilityReportType): string {
  return { suggest: "제안", broken: "파손", danger: "위험" }[t] ?? t;
}

function statusLabel(s: string): string {
  return (
    {
      waiting: "대기",
      under_review: "검토중",
      working: "처리중",
      done: "완료",
      ignored: "무시됨",
      failed: "수리실패",
    }[s.toLowerCase()] ?? "대기"
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function FacilityPage() {
  const { showToast } = useToast();

  const [reports, setReports] = useState<FacilityReportListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState<FacilityReportType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [selectedReport, setSelectedReport] = useState<FacilityReport | null>(null);
  const [imgUrls, setImgUrls] = useState<{ id: string; url: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const loadPage = async (p: number) => {
    setReports(null);
    try {
      const data = await getFacilityReportList(p);
      setReports(data);
      setPage(p);
      setHasMore(data.length === 10);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "목록을 불러올 수 없습니다."
          : "목록을 불러올 수 없습니다.",
        "danger",
      );
    }
  };

  const openReport = async (id: string) => {
    try {
      const detail = await getFacilityReport(id);
      setSelectedReport(detail);
      if (detail.file.length > 0) {
        const urls = await Promise.all(
          detail.file.map(async (img) => ({
            id: img.id,
            url: await getFacilityImgObjectUrl(img.id),
          })),
        );
        setImgUrls(urls);
      } else {
        setImgUrls([]);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "제보를 불러올 수 없습니다."
          : "제보를 불러올 수 없습니다.",
        "danger",
      );
    }
  };

  const handleClose = () => setSelectedReport(null);

  const handleCloseEnd = () => {
    imgUrls.forEach((u) => URL.revokeObjectURL(u.url));
    setImgUrls([]);
    setNewComment("");
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedReport) return;
    try {
      await changeFacilityReportStatus(selectedReport.id, status as FacilityReportStatus);
      setSelectedReport((p) => (p ? { ...p, status } : null));
      setReports((prev) => prev?.map((r) => (r.id === selectedReport.id ? { ...r, status } : r)) ?? null);
      showToast("상태가 변경되었습니다.", "info");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "상태 변경에 실패했습니다."
          : "상태 변경에 실패했습니다.",
        "danger",
      );
    }
  };

  const handlePostComment = async () => {
    if (!selectedReport || !newComment.trim()) return;
    setCommentLoading(true);
    try {
      const comment = await postFacilityComment(selectedReport.id, newComment.trim());
      setSelectedReport((p) => (p ? { ...p, comment: [comment, ...p.comment] } : null));
      setNewComment("");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "댓글 작성에 실패했습니다."
          : "댓글 작성에 실패했습니다.",
        "danger",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteFacilityComment(id);
      setSelectedReport((p) => (p ? { ...p, comment: p.comment.filter((c) => c.id !== id) } : null));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "댓글 삭제에 실패했습니다."
          : "댓글 삭제에 실패했습니다.",
        "danger",
      );
    }
  };

  const handleDeleteImg = async (id: string) => {
    try {
      await deleteFacilityImg(id);
      const entry = imgUrls.find((u) => u.id === id);
      if (entry) URL.revokeObjectURL(entry.url);
      setImgUrls((p) => p.filter((u) => u.id !== id));
      setSelectedReport((p) => (p ? { ...p, file: p.file.filter((f) => f.id !== id) } : null));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "이미지 삭제에 실패했습니다."
          : "이미지 삭제에 실패했습니다.",
        "danger",
      );
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport || !confirm("정말 삭제하시겠습니까?")) return;
    const id = selectedReport.id;
    try {
      await deleteFacilityReport(id);
      setReports((p) => p?.filter((r) => r.id !== id) ?? null);
      handleClose();
      showToast("제보가 삭제되었습니다.", "info");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } | string } } };
      showToast(
        err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : err.response.data.error.message ?? "제보 삭제에 실패했습니다."
          : "제보 삭제에 실패했습니다.",
        "danger",
      );
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const filtered = (reports ?? []).filter((r) => {
    const typeMatch = filterType === "all" || r.report_type === filterType;
    const statusMatch = filterStatus === "all" || r.status.toLowerCase() === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <Wrapper>
      <ReportListContainer>
        {reports === null ? (
          Loading()
        ) : filtered.length === 0 ? (
          <NoReport>접수된 제보가 없습니다.</NoReport>
        ) : (
          filtered.map((report) => (
            <ReportCard
              key={report.id}
              $selected={selectedReport?.id === report.id}
              onClick={() => {
                if (selectedReport?.id === report.id) {
                  handleClose();
                } else {
                  openReport(report.id);
                }
              }}
            >
              <CardLeft>
                <TypeBadge $type={report.report_type}>{typeLabel(report.report_type)}</TypeBadge>
                <ReportSubject>{report.subject}</ReportSubject>
              </CardLeft>
              <CardRight>
                <ReportMeta>
                  {report.user.name} · {format(new Date(report.created_at), "yyyy-MM-dd")}
                </ReportMeta>
                <StatusBadge $status={report.status}>{statusLabel(report.status)}</StatusBadge>
              </CardRight>
            </ReportCard>
          ))
        )}
      </ReportListContainer>

      <ControllerContainer>
        <FitContainer>
          <Text>제보 필터</Text>
          <UISegmentedControl
            items={[
              { label: "모두", value: "all" },
              { label: "제안", value: "suggest" },
              { label: "파손", value: "broken" },
              { label: "위험", value: "danger" },
            ]}
            value={filterType}
            onChange={(v) => setFilterType(v as FacilityReportType | "all")}
          />
          <UISelectField
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { label: "모든 상태", value: "all" },
              { label: "대기", value: "waiting" },
              { label: "검토중", value: "under_review" },
              { label: "처리중", value: "working" },
              { label: "완료", value: "done" },
              { label: "무시됨", value: "ignored" },
              { label: "수리실패", value: "failed" },
            ]}
          />
        </FitContainer>
        <FitContainer>
          <Text>페이지 이동</Text>
          <PageNav>
            <UIButton
              disabled={page === 1}
              variant={{ size: "Medium", theme: "Grayscale", stretchWidth: true }}
              onClick={() => loadPage(page - 1)}
            >
              이전
            </UIButton>
            <PageNum>{page} 페이지</PageNum>
            <UIButton
              disabled={!hasMore}
              variant={{ size: "Medium", theme: "Grayscale", stretchWidth: true }}
              onClick={() => loadPage(page + 1)}
            >
              다음
            </UIButton>
          </PageNav>
        </FitContainer>
      </ControllerContainer>

      <SelectionDialog
        isOpen={selectedReport !== null}
        closeAction={handleClose}
        onCloseEnd={handleCloseEnd}
      >
        {selectedReport && (
          <DialogContent>
            <DialogHeader>
              <BadgeRow>
                <TypeBadge $type={selectedReport.report_type}>
                  {typeLabel(selectedReport.report_type)}
                </TypeBadge>
                <StatusBadge $status={selectedReport.status}>
                  {statusLabel(selectedReport.status)}
                </StatusBadge>
              </BadgeRow>
              <DialogSubject>{selectedReport.subject}</DialogSubject>
              <DialogMeta>
                {selectedReport.user.name} ·{" "}
                {format(new Date(selectedReport.created_at), "yyyy-MM-dd")}
              </DialogMeta>
            </DialogHeader>

            <Divider />

            <DialogSection>
              <SectionLabel>상태 변경</SectionLabel>
              <UISelectField
                value={selectedReport.status.toLowerCase()}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={[
                  { label: "대기", value: "waiting" },
                  { label: "검토중", value: "under_review" },
                  { label: "처리중", value: "working" },
                  { label: "완료", value: "done" },
                  { label: "무시됨", value: "ignored" },
                  { label: "수리실패", value: "failed" },
                ]}
              />
            </DialogSection>

            <Divider />

            <DialogSection>
              <SectionLabel>본문</SectionLabel>
              <BodyText>{selectedReport.body}</BodyText>
            </DialogSection>

            {selectedReport.file.length > 0 && (
              <>
                <Divider />
                <DialogSection>
                  <SectionLabel>첨부 이미지 ({selectedReport.file.length}장)</SectionLabel>
                  <ImageRow>
                    {selectedReport.file.map((img) => {
                      const url = imgUrls.find((u) => u.id === img.id)?.url;
                      return (
                        <ImageWrapper key={img.id}>
                          {url ? (
                            <img src={url} alt={img.name} />
                          ) : (
                            <ImagePlaceholder>로딩중...</ImagePlaceholder>
                          )}
                          <ImageDeleteBtn onClick={() => handleDeleteImg(img.id)}>×</ImageDeleteBtn>
                        </ImageWrapper>
                      );
                    })}
                  </ImageRow>
                </DialogSection>
              </>
            )}

            <Divider />

            <DialogSection>
              <SectionLabel>댓글 ({selectedReport.comment.length}건)</SectionLabel>
              <CommentList>
                {selectedReport.comment.length === 0 ? (
                  <NoComment>댓글이 없습니다.</NoComment>
                ) : (
                  selectedReport.comment.map((c) => (
                    <CommentItem key={c.id}>
                      <CommentHeader>
                        <CommentAuthor>선생님</CommentAuthor>
                        <CommentDate>
                          {format(new Date(c.created_at), "yyyy-MM-dd HH:mm")}
                        </CommentDate>
                        <CommentDeleteBtn onClick={() => handleDeleteComment(c.id)}>
                          삭제
                        </CommentDeleteBtn>
                      </CommentHeader>
                      <CommentText>{c.text}</CommentText>
                    </CommentItem>
                  ))
                )}
              </CommentList>
              <CommentInputRow>
                <UIInputField
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <UIButton
                  disabled={!newComment.trim() || commentLoading}
                  variant={{ size: "Medium", theme: "Accent", stretchWidth: true }}
                  onClick={handlePostComment}
                >
                  댓글 작성
                </UIButton>
              </CommentInputRow>
            </DialogSection>

            <Divider />

            <UIButton
              variant={{ size: "Medium", theme: "Negative", stretchWidth: true }}
              onClick={handleDeleteReport}
            >
              제보 삭제
            </UIButton>
          </DialogContent>
        )}
      </SelectionDialog>
    </Wrapper>
  );
}

export default FacilityPage;
