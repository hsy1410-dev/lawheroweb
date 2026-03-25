import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteUser,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import {
  IoTimeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoHeadsetOutline
} from "react-icons/io5";
import { auth, db } from "../firebase/firebase";

import level1 from "../assets/1.png";
import level2 from "../assets/2.png";
import level3 from "../assets/3.png";
import level4 from "../assets/4.png";
import level5 from "../assets/5.png";
import lawyerImage from "../assets/lawyer.png";

const RECENT_LOGIN_WINDOW_MS = 5 * 60 * 1000;
const DELETED_NICKNAME = "탈퇴한 사용자";

function getProfileImage(level) {
  switch (level) {
    case 1:
      return level1;
    case 2:
      return level2;
    case 3:
      return level3;
    case 4:
      return level4;
    case 5:
      return level5;
    default:
      return null;
  }
}

async function deleteCollectionDocs(ref) {
  const snap = await getDocs(ref);
  await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
}

async function deleteQueryDocs(ref) {
  const snap = await getDocs(ref);
  await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
}

async function anonymizeCommunityActivity(uid) {
  const postsSnap = await getDocs(
    query(collection(db, "community_posts"), where("uid", "==", uid))
  );

  await Promise.all(
    postsSnap.docs.map((postDoc) =>
      updateDoc(postDoc.ref, {
        uid: null,
        nickname: DELETED_NICKNAME
      })
    )
  );

  const commentsSnap = await getDocs(
    query(collectionGroup(db, "comments"), where("uid", "==", uid))
  );

  await Promise.all(
    commentsSnap.docs.map((commentDoc) =>
      updateDoc(commentDoc.ref, {
        uid: null,
        nickname: DELETED_NICKNAME
      })
    )
  );

  const likesSnap = await getDocs(
    query(collectionGroup(db, "likes"), where("uid", "==", uid))
  );

  for (const likeDoc of likesSnap.docs) {
    const parentDocRef = likeDoc.ref.parent.parent;

    await deleteDoc(likeDoc.ref);

    if (parentDocRef) {
      await updateDoc(parentDocRef, {
        likeCount: increment(-1)
      }).catch(() => {});
    }
  }
}

async function cleanupChatRooms(uid) {
  const roomsSnap = await getDocs(
    query(collection(db, "chat_rooms"), where("clientId", "==", uid))
  );

  for (const roomDoc of roomsSnap.docs) {
    const messagesRef = collection(db, "chat_rooms", roomDoc.id, "messages");
    await deleteCollectionDocs(messagesRef);
    await deleteDoc(doc(db, "reviews", roomDoc.id)).catch(() => {});
    await deleteDoc(roomDoc.ref);
  }
}

function isRecentLogin(user) {
  const lastSignInTime = user?.metadata?.lastSignInTime;

  if (!lastSignInTime) return false;

  const lastSignedInAt = new Date(lastSignInTime).getTime();

  if (!Number.isFinite(lastSignedInAt)) return false;

  return Date.now() - lastSignedInAt <= RECENT_LOGIN_WINDOW_MS;
}

export default function MyPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const menus = [
    {
      icon: IoTimeOutline,
      label: "최근 본 글",
      route: "/mypage/recent"
    },
    {
      icon: IoHeartOutline,
      label: "관심글",
      route: "/mypage/likes"
    },
    {
      icon: IoChatbubbleOutline,
      label: "상담내역",
      route: "/chat"
    },
    {
      icon: IoHeadsetOutline,
      label: "고객센터",
      route: "/support"
    }
  ];

  useEffect(() => {
    let unsubUser;
    let unsubCoupons;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserData(null);
        setCoupons([]);
        return;
      }

      const userRef = doc(db, "app_users", currentUser.uid);

      unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
          return;
        }

        setUserData(null);
      });

      const couponRef = collection(db, "app_users", currentUser.uid, "coupons");

      unsubCoupons = onSnapshot(couponRef, (snap) => {
        const list = snap.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        setCoupons(list);
      });
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubCoupons) unsubCoupons();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    if (isDeletingAccount) return;

    const ok = window.confirm("정말 로그아웃 하시겠습니까?");

    if (!ok) return;

    localStorage.removeItem("guest");
    await signOut(auth);
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      navigate("/auth", { replace: true });
      return;
    }

    const firstConfirm = window.confirm(
      "계정을 탈퇴하면 프로필, 쿠폰, 저장/관심/최근 기록이 삭제되고 커뮤니티 글과 댓글은 익명 처리됩니다. 계속하시겠습니까?"
    );

    if (!firstConfirm) return;

    if (!isRecentLogin(currentUser)) {
      alert(
        "보안을 위해 다시 로그인한 직후에만 탈퇴할 수 있습니다. 다시 로그인한 뒤 다시 시도해주세요."
      );
      return;
    }

    const secondConfirm = window.confirm(
      "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );

    if (!secondConfirm) return;

    setIsDeletingAccount(true);

    const uid = currentUser.uid;
    const warnings = [];
    const nicknameKey =
      userData?.nicknameLower ||
      userData?.nickname?.trim()?.toLowerCase();

    try {
      await deleteCollectionDocs(collection(db, "app_users", uid, "coupons"));
      await deleteCollectionDocs(collection(db, "app_users", uid, "likedPosts"));
      await deleteCollectionDocs(collection(db, "app_users", uid, "savedPosts"));
      await deleteCollectionDocs(collection(db, "app_users", uid, "recentPosts"));

      if (nicknameKey) {
        try {
          await deleteDoc(doc(db, "nickname_map", nicknameKey));
        } catch (error) {
          console.log("닉네임 매핑 삭제 오류:", error);
          warnings.push("닉네임");
        }
      }

      const optionalTasks = [
        {
          label: "커뮤니티 활동",
          run: () => anonymizeCommunityActivity(uid)
        },
        {
          label: "채팅 내역",
          run: () => cleanupChatRooms(uid)
        },
        {
          label: "상담 요청",
          run: () =>
            deleteQueryDocs(
              query(collection(db, "consult_requests"), where("userId", "==", uid))
            )
        },
        {
          label: "상담 리뷰",
          run: () =>
            deleteQueryDocs(
              query(collection(db, "reviews"), where("clientId", "==", uid))
            )
        },
        {
          label: "문의 내역",
          run: () =>
            deleteQueryDocs(
              query(collection(db, "support_requests"), where("uid", "==", uid))
            )
        }
      ];

      for (const task of optionalTasks) {
        try {
          await task.run();
        } catch (error) {
          console.log(`${task.label} 정리 오류:`, error);
          warnings.push(task.label);
        }
      }

      await deleteDoc(doc(db, "app_users", uid));
      await deleteUser(currentUser);

      localStorage.removeItem("guest");

      if (warnings.length > 0) {
        alert(
          `계정 탈퇴가 완료되었습니다. 다만 ${warnings.join(", ")} 정리는 일부 남아 있을 수 있습니다.`
        );
      } else {
        alert("계정 탈퇴가 완료되었습니다.");
      }

      navigate("/auth", { replace: true });
    } catch (error) {
      console.log("계정 탈퇴 오류:", error);

      if (error?.code === "auth/requires-recent-login") {
        alert("보안을 위해 다시 로그인한 뒤 탈퇴를 다시 시도해주세요.");
      } else {
        alert("계정 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const renderProfileImage = () => {
    if (userData?.role === "lawyer") {
      return (
        <img
          src={lawyerImage}
          alt="lawyer profile"
          style={{ width: 64, height: 64, borderRadius: 32 }}
        />
      );
    }

    if (userData?.profileLevel > 0) {
      return (
        <img
          src={getProfileImage(userData.profileLevel)}
          alt="user level"
          style={{ width: 64, height: 64, borderRadius: 32 }}
        />
      );
    }

    return (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: "#E5E7EB"
        }}
      />
    );
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        background: "#F5F6F8",
        minHeight: "100vh"
      }}
    >
      <div
        style={{
          padding: 20,
          paddingTop: 60
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 24
          }}
        >
          내정보
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 28
          }}
        >
          <div
            style={{
              marginRight: 16
            }}
          >
            {renderProfileImage()}
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18
              }}
            >
              {userData?.nickname || "유저명"}
            </div>

            <div
              style={{
                color: "#9CA3AF",
                marginTop: 4
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 18,
            overflow: "hidden",
            marginBottom: 28
          }}
        >
          {menus.map((menu, index) => {
            const Icon = menu.icon;

            return (
              <div
                key={menu.route}
                onClick={() => navigate(menu.route)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom:
                    index === menus.length - 1 ? "none" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  gap: 14
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14
                  }}
                >
                  <Icon size={20} color="#6B7280" />
                  <div style={{ fontWeight: 600 }}>{menu.label}</div>
                </div>

                <div style={{ color: "#C7C7CC" }}>›</div>
              </div>
            );
          })}
        </div>

        <div style={{ color: "#9CA3AF", marginBottom: 10 }}>
          커뮤니티 활동
        </div>

        <Row label="내 커뮤니티 글" route="/mypage/my-posts" />
        <Row label="커뮤니티 관심 글" route="/mypage/likes" />
        <Row label="저장한 글" route="/mypage/saved" />
        <Row label="작성한 댓글" route="/mypage/comments" />

        <hr style={{ margin: "24px 0" }} />

        <div style={{ color: "#9CA3AF", marginBottom: 10 }}>
          고객지원
        </div>

        <Row label="약관 및 정책" route="/policy" />

        <div
          style={{
            color: "#9CA3AF",
            marginTop: 30,
            marginBottom: 10
          }}
        >
          🎫 보유 쿠폰
        </div>

        <div
          style={{
            background: "#F9FAFB",
            borderRadius: 14,
            padding: 16
          }}
        >
          {coupons.length === 0 && (
            <div style={{ color: "#9CA3AF" }}>
              보유한 쿠폰이 없습니다.
            </div>
          )}

          {coupons.map((coupon, index) => {
            const isExpired =
              coupon.expiredAt &&
              new Date(coupon.expiredAt.seconds * 1000) < new Date();

            return (
              <div
                key={coupon.id}
                style={{
                  padding: "12px 0",
                  borderBottom:
                    index === coupons.length - 1 ? "none" : "1px solid #E5E7EB",
                  opacity: coupon.used || isExpired ? 0.5 : 1
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {coupon.type === "consult_support" && "상담지원 쿠폰"}
                  {coupon.type === "lawyer_fee_30" && "선임료 30% 지원"}
                  {coupon.type === "lawyer_fee_50" && "선임료 50% 지원"}
                </div>

                {coupon.expiredAt && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 4
                    }}
                  >
                    유효기간{" "}
                    {new Date(coupon.expiredAt.seconds * 1000).toLocaleDateString()}
                  </div>
                )}

                {coupon.used && (
                  <div style={{ fontSize: 12, color: "#EF4444" }}>
                    사용 완료
                  </div>
                )}

                {isExpired && !coupon.used && (
                  <div style={{ fontSize: 12, color: "#EF4444" }}>
                    만료된 쿠폰
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          disabled={isDeletingAccount}
          style={{
            marginTop: 40,
            width: "100%",
            background: "#F3F4F6",
            border: "none",
            padding: 16,
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 16,
            cursor: isDeletingAccount ? "not-allowed" : "pointer",
            opacity: isDeletingAccount ? 0.6 : 1
          }}
        >
          로그아웃
        </button>

        <div
          style={{
            marginTop: 14,
            width: "100%",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            padding: 16,
            borderRadius: 14
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#B91C1C"
            }}
          >
            계정 탈퇴
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#7F1D1D"
            }}
          >
            탈퇴 시 프로필, 쿠폰, 저장/관심/최근 기록이 삭제되고 커뮤니티 글과 댓글은 익명 처리됩니다.
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            style={{
              marginTop: 14,
              width: "100%",
              background: isDeletingAccount ? "#FCA5A5" : "#DC2626",
              color: "white",
              border: "none",
              padding: 16,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: isDeletingAccount ? "not-allowed" : "pointer"
            }}
          >
            {isDeletingAccount ? "탈퇴 처리 중..." : "계정 탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, route }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(route)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 0",
        cursor: "pointer"
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 500 }}>
        {label}
      </div>

      <div style={{ color: "#C7C7CC" }}>
        ›
      </div>
    </div>
  );
}
