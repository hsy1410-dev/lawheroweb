import { BrowserRouter, Routes, Route, Navigate  } from "react-router-dom";

import BottomNavLayout from "../layouts/BottomNavLayout";
import AuthGuard from "../components/AuthGuard";
import TierGuide from "../pages/TierGuide";
/* 메인 */
import TabHome from "../pages/TabHome";
import EmailLogin from "../auth/EmailLogin";
/* 커뮤니티 */
import Community from "../pages/Community";
import PostDetail from "../pages/CommunityDetail";
import WritePost from "../pages/WritePost";
import Support from "../pages/support";
/* 커뮤니티 활동 */
import SavedPosts from "../pages/SavedPosts";
import RecentPosts from "../pages/RecentPosts";
import LikedPosts from "../pages/LikedPosts";

/* 마이페이지 */
import MyPage from "../pages/mypage";
import MyPosts from "../pages/MyPosts";
import MyComments from "../pages/MyComments";
import PrivacyPolicy from "../pages/PrivacyPolicy";
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
import KakaoCallback from "../auth/KakaoCallback";
export default function Router() {

  return (

    <BrowserRouter>

      <Routes>

        {/* 공개 페이지 */}

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/install" element={<Install />} />

        {/* 인증 */}
<Route
  path="/auth/kakao/callback"
  element={<KakaoCallback />}
/>
        <Route path="/auth" element={<AuthLanding />} />
        <Route path="/auth/nickname" element={<Nickname />} />
        <Route path="/auth/phone" element={<PhoneInfo />} />
        <Route path="/auth/verify" element={<VerifyScreen />} />
<Route path="/auth/email" element={<EmailLogin />} />
        {/* 로그인 필요 + BottomNav */}

        <Route
          element={
              <BottomNavLayout />
            
          }
        >

          <Route path="/home" element={<TabHome />} />
          <Route path="/community" element={<Community />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/mypage" element={<MyPage />} />

        </Route>

        {/* 로그인 필요 (BottomNav 없음) */}

        <Route
          element={<AuthGuard />}
        >
<Route
  path="/support"
  element={
      <Support />
   
  }
/><Route path="/community/tier" element={<TierGuide />} />
          <Route path="/community/:id" element={<PostDetail />} />
          <Route path="/community/write" element={<WritePost />} />
          <Route path="/community/saved" element={<SavedPosts />} />
          <Route path="/mypage/recent" element={<RecentPosts />} />
          <Route path="/mypage/likes" element={<LikedPosts />} />

          <Route path="/mypage/posts" element={<MyPosts />} />
          <Route path="/mypage/comments" element={<MyComments />} />

          <Route path="/consult/general" element={<GeneralConsult />} />
          <Route path="/consult/quick" element={<QuickStart />} />
          <Route path="/waiting" element={<WaitingScreen />} />

          <Route path="/chat/:id" element={<ChatRoom />} />
<Route path="/policy" element={<PrivacyPolicy />} />
        </Route>

      </Routes>

    </BrowserRouter>

  );

}