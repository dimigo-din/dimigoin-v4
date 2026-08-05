import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "../components/Loading.tsx";
import StudentInfoPage from "../pages/studentinfo/StudentInfo.tsx";

const LoginPage = lazy(() => import("../pages/login/LoginPage.tsx"));
const LoginPwPage = lazy(() => import("../pages/login/LoginPw.tsx"));
const EmptyPage = lazy(() => import("../pages/EmptyPage.tsx"));
const ApplyStayPage = lazy(() => import("../pages/applystay/ApplyStayPage.tsx"));
const StayPage = lazy(() => import("../pages/stay/StayPage.tsx"));
const ViewStaySeatPage = lazy(() => import("../pages/viewstayseat/ViewStaySeatPage.tsx"));
const WakeupPage = lazy(() => import("../pages/wakeup/WakeupPage.tsx"));
const FrigoPage = lazy(() => import("../pages/frigo/FrigoPage.tsx"));
const OpenWakeup = lazy(() => import("../pages/wakeup/OpenWakeup.tsx"));
const LaundryTimelinePage = lazy(() => import("../pages/laundry/LaundryTimelinePage.tsx"));
const LaundryApplyPage = lazy(() => import("../pages/laundry/LaundryApplyPage.tsx"));
const UiKitPage = lazy(() => import("../pages/uikit/UiKitPage.tsx"));
const DienenTimePage = lazy(() => import("../pages/dienen/DienenTimePage.tsx"));
const DienenManageTimePage = lazy(() => import("../pages/dienen/DienenManageTimePage.tsx"));
const DienenDelayTimePage = lazy(() => import("../pages/dienen/DienenDelayTimePage.tsx"));
const FacilityPage = lazy(() => import("../pages/facility/FacilityPage.tsx"));

const AppRouter = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/pw" element={<LoginPwPage />} />
        <Route path="/stay" element={<StayPage />} />
        <Route path="/applystay" element={<ApplyStayPage />} />
        <Route path="/viewstayseat" element={<ViewStaySeatPage />} />
        <Route path="/wakeup" element={<WakeupPage />} />
        <Route path="/applyfrigo" element={<FrigoPage />} />
        <Route path="/openwakeup" element={<OpenWakeup />} />
        <Route path="/laundrytimeline" element={<LaundryTimelinePage />} />
        <Route path="/applylaundry" element={<LaundryApplyPage />} />
        <Route path="/dienen_time" element={<DienenTimePage />} />
        <Route path="/dienen_edittime" element={<DienenManageTimePage />} />
        <Route path="/dienen_delaytime" element={<DienenDelayTimePage />} />
        <Route path="/facility" element={<FacilityPage />} />
        <Route path="/studentinfo" element={<StudentInfoPage />} />
        {import.meta.env.DEV && <Route path="/uikit" element={<UiKitPage />} />}
        <Route path="*" element={<EmptyPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
