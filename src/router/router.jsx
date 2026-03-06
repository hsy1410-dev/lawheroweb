import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNavLayout from "../layouts/BottomNavLayout";

/* 메인 */
import Home from "../pages/Home";
import TabHome from "../pages/TabHome";

/* 커뮤니티 */
import Community from "../pages/Community";
import PostDetail from "../pages/CommunityDetail";
import WritePost from "../pages/WritePost";

/* 커뮤니티 활동 */
import SavedPosts from "../pages/SavedPosts";
import RecentPosts from "../pages/RecentPosts";
import LikedPosts from "../pages/LikedPosts";

/* 마이페이지 */
import MyPage from "../pages/mypage";
import MyPosts from "../pages/MyPosts";
import MyComments from "../pages/MyComments";

/* 상담 */
import GeneralConsult from "../pages/GeneralConsult";
import QuickStart from "../pages/QuickStart";
import WaitingScreen from "../pages/WaitingScreen";

/* 채팅 */
import ChatList from "../pages/ChatList";
import ChatRoom from "../pages/chat";

/* 기타 */
import Install from "../pages/Install";

/* 인증 */
import AuthLanding from "../auth";
import Nickname from "../auth/signup";
import PhoneInfo from "../auth/phone-info";
import VerifyScreen from "../auth/verify";

/* 인증 가드 */
import AuthGuard from "../components/AuthGuard";

export default function Router() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ================= 공개 페이지 ================= */}

        <Route path="/" element={<Home />} />
        <Route path="/install" element={<Install />} />

        {/* ================= 인증 ================= */}

        <Route path="/auth" element={<AuthLanding />} />
        <Route path="/auth/nickname" element={<Nickname />} />
        <Route path="/auth/phone" element={<PhoneInfo />} />
        <Route path="/auth/verify" element={<VerifyScreen />} />

        {/* ================= BottomNav 포함 페이지 ================= */}

        <Route
          path="/home"
          element={
            <AuthGuard>
              <BottomNavLayout>
                <TabHome />
              </BottomNavLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/community"
          element={
            <AuthGuard>
              <BottomNavLayout>
                <Community />
              </BottomNavLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/chat"
          element={
            <AuthGuard>
              <BottomNavLayout>
                <ChatList />
              </BottomNavLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/mypage"
          element={
            <AuthGuard>
              <BottomNavLayout>
                <MyPage />
              </BottomNavLayout>
            </AuthGuard>
          }
        />

        {/* ================= BottomNav 없는 페이지 ================= */}

        {/* 커뮤니티 */}
        <Route
          path="/community/:id"
          element={
            <AuthGuard>
              <PostDetail />
            </AuthGuard>
          }
        />

        <Route
          path="/community/write"
          element={
            <AuthGuard>
              <WritePost />
            </AuthGuard>
          }
        />

        <Route
          path="/community/saved"
          element={
            <AuthGuard>
              <SavedPosts />
            </AuthGuard>
          }
        />

        <Route
          path="/community/recent"
          element={
            <AuthGuard>
              <RecentPosts />
            </AuthGuard>
          }
        />

        <Route
          path="/community/likes"
          element={
            <AuthGuard>
              <LikedPosts />
            </AuthGuard>
          }
        />

        {/* 마이페이지 */}
        <Route
          path="/mypage/posts"
          element={
            <AuthGuard>
              <MyPosts />
            </AuthGuard>
          }
        />

        <Route
          path="/mypage/comments"
          element={
            <AuthGuard>
              <MyComments />
            </AuthGuard>
          }
        />

        {/* 상담 */}
        <Route
          path="/consult/general"
          element={
            <AuthGuard>
              <GeneralConsult />
            </AuthGuard>
          }
        />

        <Route
          path="/consult/quick"
          element={
            <AuthGuard>
              <QuickStart />
            </AuthGuard>
          }
        />

        <Route
          path="/waiting"
          element={
            <AuthGuard>
              <WaitingScreen />
            </AuthGuard>
          }
        />

        {/* 채팅 */}
        <Route
          path="/chat/:id"
          element={
            <AuthGuard>
              <ChatRoom />
            </AuthGuard>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}