import { generateKeyPairSync, randomUUID } from "node:crypto";
import { NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { vi } from "vitest";
import type { Session, User } from "#/db/schema";
import { JWTResponse } from "#auth/auth.dto";
import { AuthService } from "#auth/auth.service";
import { TestApp } from "#test/helpers/app.helper";
import { RequestHelper } from "#test/helpers/request.helper";
import { PermissionEnum } from "$mapper/permissions";
import { numberPermission } from "$utils/permission.util";
import { FacilityManageService, FacilityStudentService } from "~facility/providers";
import { FrigoManageService, FrigoStudentService } from "~frigo/providers";
import { LaundryManageService, LaundryStudentService } from "~laundry/providers";
import { PushManageService, PushStudentService } from "~push/providers";
import { StayManageService, StayStudentService } from "~stay/providers";
import { UserManageService, UserStudentService } from "~user/providers";
import { WakeupManageService, WakeupService, WakeupStudentService } from "~wakeup/providers";

type AuthTokens = {
  student: JWTResponse;
  teacher: JWTResponse;
};

interface AuthSetupResult {
  tokens: AuthTokens;
  sessionStore: Session[];
}

export interface E2EContext {
  testApp: TestApp;
  app: NestFastifyApplication;
  request: RequestHelper;
  tokens: AuthTokens;
  sessionStore: Session[];
}

const ensureJwtKeys = () => {
  if (!process.env.JWT_PRIVATE || !process.env.JWT_PUBLIC) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    process.env.JWT_PRIVATE = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    process.env.JWT_PUBLIC = publicKey.export({ type: "spki", format: "pem" }).toString();
  }
};

const createUsers = () => {
  const studentUser: User = {
    id: "student-1",
    email: "student$test.com",
    name: "Student User",
    picture: "pic",
    permission: "0",
  } as User;

  const teacherUser: User = {
    id: "teacher-1",
    email: "teacher$test.com",
    name: "Teacher User",
    picture: "pic",
    permission: numberPermission(
      PermissionEnum.TEACHER,
      PermissionEnum.MANAGE_PERMISSION,
    ).toString(),
  } as User;

  return { studentUser, teacherUser };
};

const setupAuthMocks = async (
  app: NestFastifyApplication,
  request: RequestHelper,
): Promise<AuthSetupResult> => {
  const { studentUser, teacherUser } = createUsers();
  const authService = app.get(AuthService);
  const jwtService = app.get(JwtService);
  const sessionStore: Session[] = [];

  authService.loginByIdPassword = vi.fn(async (id: string, _password: string) => {
    const user =
      id === studentUser.email ? studentUser : id === teacherUser.email ? teacherUser : null;
    if (!user) {
      throw new Error("User not found");
    }

    const sessionIdentifier = randomUUID();
    const keyPair = {
      accessToken: await jwtService.signAsync({ sessionIdentifier, ...user }, { expiresIn: "30m" }),
      refreshToken: randomUUID(),
    };
    sessionStore.push({
      id: randomUUID(),
      refreshToken: keyPair.refreshToken,
      sessionIdentifier,
      userId: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    } as Session);
    return keyPair;
  }) as typeof authService.loginByIdPassword;

  authService.refresh = vi.fn(async (refreshToken: string) => {
    const sessionRecord = sessionStore.find((s) => s.refreshToken === refreshToken);
    if (!sessionRecord) {
      throw new NotFoundException("Session not found");
    }

    const user =
      sessionRecord.userId === studentUser.id
        ? studentUser
        : sessionRecord.userId === teacherUser.id
          ? teacherUser
          : null;
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const sessionIdentifier = randomUUID();
    const keyPair = {
      accessToken: await jwtService.signAsync({ sessionIdentifier, ...user }, { expiresIn: "30m" }),
      refreshToken: randomUUID(),
    };

    sessionRecord.refreshToken = keyPair.refreshToken;
    sessionRecord.sessionIdentifier = sessionIdentifier;
    sessionRecord.updated_at = new Date();

    return keyPair;
  }) as typeof authService.refresh;

  authService.logout = vi.fn(async (userJwt: { sessionIdentifier: string }) => {
    const idx = sessionStore.findIndex((s) => s.sessionIdentifier === userJwt.sessionIdentifier);
    if (idx < 0) {
      throw new Error("Session not found");
    }
    const [removed] = sessionStore.splice(idx, 1);
    return removed;
  }) as typeof authService.logout;

  const studentLoginResponse = await request.post("/auth/login/password", {
    email: studentUser.email,
    password: "test-password",
  });
  const teacherLoginResponse = await request.post("/auth/login/password", {
    email: teacherUser.email,
    password: "test-password",
  });

  const studentBody = request.parseBody<{ data: JWTResponse }>(studentLoginResponse);
  const teacherBody = request.parseBody<{ data: JWTResponse }>(teacherLoginResponse);

  return {
    tokens: { student: studentBody.data, teacher: teacherBody.data },
    sessionStore,
  };
};

const stubMethod = <T extends object, K extends keyof T>(target: T | null, key: K, impl: T[K]) => {
  if (!target) {
    return;
  }
  (target as Record<K, T[K]>)[key] = impl;
};

const stubProtoMethod = <T extends object, K extends keyof T>(
  target: T | null,
  key: K,
  impl: T[K],
) => {
  if (!target) {
    return;
  }
  const proto = Object.getPrototypeOf(target) as Record<K, T[K]>;
  proto[key] = impl;
};

const stubDomainServices = (app: NestFastifyApplication) => {
  const stayStudentService = app.get(StayStudentService);
  const stayManageService = app.get(StayManageService);
  const frigoManageService = app.get(FrigoManageService);
  const frigoStudentService = app.get(FrigoStudentService);
  const facilityStudentService = app.get(FacilityStudentService);
  const facilityManageService = app.get(FacilityManageService);
  const laundryStudentService = app.get(LaundryStudentService);
  const laundryManageService = app.get(LaundryManageService);
  const pushStudentService = app.get(PushStudentService);
  const pushManageService = app.get(PushManageService);
  const wakeupService = app.get(WakeupService);
  const wakeupStudentService = app.get(WakeupStudentService);
  const wakeupManageService = app.get(WakeupManageService);
  const userManageService = app.get(UserManageService);
  const userStudentService = app.get(UserStudentService);

  stubMethod(
    stayStudentService,
    "getStayList",
    vi.fn(async () => []) as unknown as (typeof stayStudentService)["getStayList"],
  );
  stubMethod(
    stayStudentService,
    "getStayApplies",
    vi.fn(async () => []) as unknown as (typeof stayStudentService)["getStayApplies"],
  );
  stubMethod(
    stayStudentService,
    "createStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["createStayApply"],
  );
  stubMethod(
    stayStudentService,
    "updateStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["updateStayApply"],
  );
  stubMethod(
    stayStudentService,
    "deleteStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayStudentService)["deleteStayApply"],
  );
  stubMethod(
    stayStudentService,
    "getStayOuting",
    vi.fn(async () => []) as unknown as (typeof stayStudentService)["getStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "addStayOuting",
    vi.fn(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["addStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "editStayOuting",
    vi.fn(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["editStayOuting"],
  );
  stubMethod(
    stayStudentService,
    "removeStayOuting",
    vi.fn(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayStudentService)["removeStayOuting"],
  );
  stubMethod(
    stayManageService,
    "getStayList",
    vi.fn(async () => []) as unknown as (typeof stayManageService)["getStayList"],
  );
  stubMethod(
    stayManageService,
    "createStay",
    vi.fn(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["createStay"],
  );
  stubMethod(
    stayManageService,
    "getStay",
    vi.fn(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["getStay"],
  );
  stubMethod(
    stayManageService,
    "getStaySeatPresetList",
    vi.fn(async () => []) as unknown as (typeof stayManageService)["getStaySeatPresetList"],
  );
  stubMethod(
    stayManageService,
    "getStaySeatPreset",
    vi.fn(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["getStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "createStaySeatPreset",
    vi.fn(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["createStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "updateStaySeatPreset",
    vi.fn(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["updateStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "deleteStaySeatPreset",
    vi.fn(async () => ({
      id: "preset-1",
    })) as unknown as (typeof stayManageService)["deleteStaySeatPreset"],
  );
  stubMethod(
    stayManageService,
    "getStayScheduleList",
    vi.fn(async () => []) as unknown as (typeof stayManageService)["getStayScheduleList"],
  );
  stubMethod(
    stayManageService,
    "getStaySchedule",
    vi.fn(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["getStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "createStaySchedule",
    vi.fn(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["createStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "updateStaySchedule",
    vi.fn(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["updateStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "deleteStaySchedule",
    vi.fn(async () => ({
      id: "schedule-1",
    })) as unknown as (typeof stayManageService)["deleteStaySchedule"],
  );
  stubMethod(
    stayManageService,
    "updateStay",
    vi.fn(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["updateStay"],
  );
  stubMethod(
    stayManageService,
    "deleteStay",
    vi.fn(async () => ({ id: "stay-1" })) as unknown as (typeof stayManageService)["deleteStay"],
  );
  stubMethod(
    stayManageService,
    "getStayApply",
    vi.fn(async () => []) as unknown as (typeof stayManageService)["getStayApply"],
  );
  stubMethod(
    stayManageService,
    "createStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["createStayApply"],
  );
  stubMethod(
    stayManageService,
    "updateStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["updateStayApply"],
  );
  stubMethod(
    stayManageService,
    "deleteStayApply",
    vi.fn(async () => ({
      id: "stay-apply-1",
    })) as unknown as (typeof stayManageService)["deleteStayApply"],
  );
  stubMethod(
    stayManageService,
    "auditOuting",
    vi.fn(async () => ({ id: "outing-1" })) as unknown as (typeof stayManageService)["auditOuting"],
  );
  stubMethod(
    stayManageService,
    "updateOutingMealCancel",
    vi.fn(async () => ({
      id: "outing-1",
    })) as unknown as (typeof stayManageService)["updateOutingMealCancel"],
  );
  stubMethod(
    stayManageService,
    "moveToSomewhere",
    vi.fn(async () => []) as unknown as (typeof stayManageService)["moveToSomewhere"],
  );

  stubMethod(
    frigoManageService,
    "getApplyPeriod",
    vi.fn(async () => []) as unknown as (typeof frigoManageService)["getApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "getApplyList",
    vi.fn(async () => []) as unknown as (typeof frigoManageService)["getApplyList"],
  );
  stubMethod(
    frigoManageService,
    "setApplyPeriod",
    vi.fn(async () => ({
      id: "period-1",
    })) as unknown as (typeof frigoManageService)["setApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "removeApplyPeriod",
    vi.fn(async () => ({
      id: "period-1",
    })) as unknown as (typeof frigoManageService)["removeApplyPeriod"],
  );
  stubMethod(
    frigoManageService,
    "apply",
    vi.fn(async () => ({ id: "frigo-apply-1" })) as unknown as (typeof frigoManageService)["apply"],
  );
  stubMethod(
    frigoManageService,
    "removeApply",
    vi.fn(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoManageService)["removeApply"],
  );
  stubMethod(
    frigoManageService,
    "auditApply",
    vi.fn(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoManageService)["auditApply"],
  );
  stubMethod(
    frigoStudentService,
    "getApply",
    vi.fn(async () => ({})) as unknown as (typeof frigoStudentService)["getApply"],
  );
  stubMethod(
    frigoStudentService,
    "frigoApply",
    vi.fn(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoStudentService)["frigoApply"],
  );
  stubMethod(
    frigoStudentService,
    "cancelApply",
    vi.fn(async () => ({
      id: "frigo-apply-1",
    })) as unknown as (typeof frigoStudentService)["cancelApply"],
  );

  stubMethod(
    facilityStudentService,
    "reportList",
    vi.fn(async () => []) as unknown as (typeof facilityStudentService)["reportList"],
  );
  stubMethod(
    facilityStudentService,
    "getReport",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityStudentService)["getReport"],
  );
  stubMethod(
    facilityStudentService,
    "getImg",
    vi.fn(async () => ({
      filename: "facility.jpg",
      stream: "binary",
    })) as unknown as (typeof facilityStudentService)["getImg"],
  );
  stubMethod(
    facilityStudentService,
    "createReport",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityStudentService)["createReport"],
  );
  stubMethod(
    facilityStudentService,
    "writeComment",
    vi.fn(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityStudentService)["writeComment"],
  );
  stubMethod(
    facilityManageService,
    "getImg",
    vi.fn(async () => ({
      filename: "facility.jpg",
      stream: "binary",
    })) as unknown as (typeof facilityManageService)["getImg"],
  );
  stubMethod(
    facilityManageService,
    "deleteImg",
    vi.fn(async () => ({ id: "img-1" })) as unknown as (typeof facilityManageService)["deleteImg"],
  );
  stubMethod(
    facilityManageService,
    "reportList",
    vi.fn(async () => []) as unknown as (typeof facilityManageService)["reportList"],
  );
  stubMethod(
    facilityManageService,
    "getReport",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["getReport"],
  );
  stubMethod(
    facilityManageService,
    "createReport",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["createReport"],
  );
  stubMethod(
    facilityManageService,
    "deleteReport",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["deleteReport"],
  );
  stubMethod(
    facilityManageService,
    "writeComment",
    vi.fn(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityManageService)["writeComment"],
  );
  stubMethod(
    facilityManageService,
    "deleteComment",
    vi.fn(async () => ({
      id: "comment-1",
    })) as unknown as (typeof facilityManageService)["deleteComment"],
  );
  stubMethod(
    facilityManageService,
    "changeType",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["changeType"],
  );
  stubMethod(
    facilityManageService,
    "changeStatus",
    vi.fn(async () => ({
      id: "facility-1",
    })) as unknown as (typeof facilityManageService)["changeStatus"],
  );

  stubMethod(
    laundryStudentService,
    "getTimeline",
    vi.fn(async () => []) as unknown as (typeof laundryStudentService)["getTimeline"],
  );
  stubMethod(
    laundryStudentService,
    "getApplies",
    vi.fn(async () => []) as unknown as (typeof laundryStudentService)["getApplies"],
  );
  stubMethod(
    laundryStudentService,
    "createApply",
    vi.fn(async () => ({
      id: "laundry-apply-1",
    })) as unknown as (typeof laundryStudentService)["createApply"],
  );
  stubMethod(
    laundryStudentService,
    "deleteApply",
    vi.fn(async () => ({
      id: "laundry-apply-1",
    })) as unknown as (typeof laundryStudentService)["deleteApply"],
  );
  stubMethod(
    laundryManageService,
    "getLaundryMachineList",
    vi.fn(async () => []) as unknown as (typeof laundryManageService)["getLaundryMachineList"],
  );
  stubMethod(
    laundryManageService,
    "createLaundryMachine",
    vi.fn(async () => ({
      id: "machine-1",
    })) as unknown as (typeof laundryManageService)["createLaundryMachine"],
  );

  stubMethod(
    pushStudentService,
    "getSubjects",
    vi.fn(async () => [
      { identifier: "notice", name: "Notice" },
    ]) as unknown as (typeof pushStudentService)["getSubjects"],
  );
  stubMethod(
    pushStudentService,
    "removeToken",
    vi.fn(async () => ({ removed: true })) as unknown as (typeof pushStudentService)["removeToken"],
  );
  stubMethod(
    pushStudentService,
    "removeAllByUser",
    vi.fn(async () => []) as unknown as (typeof pushStudentService)["removeAllByUser"],
  );
  stubMethod(
    pushStudentService,
    "getSubscribedSubject",
    vi.fn(async () => []) as unknown as (typeof pushStudentService)["getSubscribedSubject"],
  );
  stubMethod(
    pushStudentService,
    "setSubscribeSubject",
    vi.fn(async () => []) as unknown as (typeof pushStudentService)["setSubscribeSubject"],
  );
  stubMethod(
    pushStudentService,
    "upsertToken",
    vi.fn(async () => ({
      token: "test-fcm-token",
    })) as unknown as (typeof pushStudentService)["upsertToken"],
  );
  stubMethod(
    pushManageService,
    "sendToAll",
    vi.fn(async () => ({
      sent: 0,
      failed: 0,
    })) as unknown as (typeof pushManageService)["sendToAll"],
  );
  stubMethod(
    pushManageService,
    "sendToSpecificUsers",
    vi.fn(async () => ({
      sent: 0,
      failed: 0,
    })) as unknown as (typeof pushManageService)["sendToSpecificUsers"],
  );
  stubMethod(
    pushManageService,
    "getSubscriptionsByUser",
    vi.fn(async () => []) as unknown as (typeof pushManageService)["getSubscriptionsByUser"],
  );

  stubMethod(
    wakeupService,
    "getDateSong",
    vi.fn(async () => ({
      title: "Test Song",
      channel: "Test Channel",
      url: "https://youtube.com/watch?v=test",
      id: "test",
    })) as unknown as (typeof wakeupService)["getDateSong"],
  );
  stubMethod(
    wakeupStudentService,
    "search",
    vi.fn(async () => ({ items: [] })) as unknown as (typeof wakeupStudentService)["search"],
  );
  stubMethod(
    wakeupStudentService,
    "getApplications",
    vi.fn(async () => []) as unknown as (typeof wakeupStudentService)["getApplications"],
  );
  stubMethod(
    wakeupStudentService,
    "registerVideo",
    vi.fn(async () => ({
      id: "wakeup-apply-1",
    })) as unknown as (typeof wakeupStudentService)["registerVideo"],
  );
  stubMethod(
    wakeupStudentService,
    "getMyVotes",
    vi.fn(async () => []) as unknown as (typeof wakeupStudentService)["getMyVotes"],
  );
  stubMethod(
    wakeupStudentService,
    "vote",
    vi.fn(async () => ({ id: "vote-1" })) as unknown as (typeof wakeupStudentService)["vote"],
  );
  stubMethod(
    wakeupStudentService,
    "unVote",
    vi.fn(async () => ({ id: "vote-1" })) as unknown as (typeof wakeupStudentService)["unVote"],
  );
  stubMethod(
    wakeupManageService,
    "getList",
    vi.fn(async () => []) as unknown as (typeof wakeupManageService)["getList"],
  );
  stubMethod(
    wakeupManageService,
    "selectApply",
    vi.fn(async () => ({
      id: "wakeup-1",
    })) as unknown as (typeof wakeupManageService)["selectApply"],
  );
  stubMethod(
    wakeupManageService,
    "deleteApply",
    vi.fn(async () => ({
      id: "wakeup-1",
    })) as unknown as (typeof wakeupManageService)["deleteApply"],
  );

  stubProtoMethod(
    userManageService,
    "searchUser",
    vi.fn(async () => []) as unknown as (typeof userManageService)["searchUser"],
  );
  stubProtoMethod(
    userManageService,
    "addPasswordLogin",
    vi.fn(async () => ({ ok: true })) as unknown as (typeof userManageService)["addPasswordLogin"],
  );
  stubProtoMethod(
    userManageService,
    "setPermission",
    vi.fn(async () => ({ id: "user-1" })) as unknown as (typeof userManageService)["setPermission"],
  );
  stubProtoMethod(
    userManageService,
    "addPermission",
    vi.fn(async () => ({ id: "user-1" })) as unknown as (typeof userManageService)["addPermission"],
  );
  stubProtoMethod(
    userManageService,
    "removePermission",
    vi.fn(async () => ({
      id: "user-1",
    })) as unknown as (typeof userManageService)["removePermission"],
  );
  stubProtoMethod(
    userManageService,
    "getUserDetail",
    vi.fn(async () => ({
      grade: 1,
      class: 1,
      gender: "male",
    })) as unknown as (typeof userManageService)["getUserDetail"],
  );
  stubProtoMethod(
    userManageService,
    "getRequiredUserDetail",
    vi.fn(async () => ({
      grade: 1,
      class: 1,
      gender: "male",
    })) as unknown as (typeof userManageService)["getRequiredUserDetail"],
  );
  stubProtoMethod(
    userStudentService,
    "getTimeTable",
    vi.fn(async () => []) as unknown as (typeof userStudentService)["getTimeTable"],
  );
  stubProtoMethod(
    userStudentService,
    "getMyApplies",
    vi.fn(async () => ({
      stayApply: null,
      laundryApply: null,
    })) as unknown as (typeof userStudentService)["getMyApplies"],
  );
};

export const setupE2EContext = async (): Promise<E2EContext> => {
  ensureJwtKeys();

  const testApp = new TestApp();
  const app = await testApp.initialize();
  const request = new RequestHelper(app);

  const { tokens, sessionStore } = await setupAuthMocks(app, request);
  stubDomainServices(app);

  return { testApp, app, request, tokens, sessionStore };
};
