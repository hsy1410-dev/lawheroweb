import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  IoHeart,
  IoHeartOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoShareSocialOutline,
  IoArrowBack,
  IoSend
} from "react-icons/io5";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";

function calculateLevel(postCount = 0, commentCount = 0) {
  if (postCount >= 500 && commentCount >= 1000) return 5;
  if (postCount >= 300 && commentCount >= 500) return 4;
  if (postCount >= 100 && commentCount >= 100) return 3;
  if (postCount >= 30 && commentCount >= 30) return 2;
  if (postCount >= 1 && commentCount >= 1) return 1;
  return 0;
}

function getFieldColor(field) {
  switch (field) {
    case "형사":
      return "#16A34A";
    case "민사":
      return "#D97706";
    case "부동산":
      return "#2563EB";
    case "도산/개인회생":
      return "#7C3AED";
    case "이혼":
      return "#DC2626";
    default:
      return "#6B7280";
  }
}

const getProfileImageUrl = (level) =>
  level > 0 ? `/images/level/${level}.png` : null;

const LAWYER_IMG = "/images/lawyer.png";

export default function CommunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, authReady } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const [liked, setLiked] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [saved, setSaved] = useState(false);

  // ✅ 작성자/댓글작성자 레벨(최적화 조회 방식)
  const [authorLevel, setAuthorLevel] = useState(0);
  const [commentAuthorLevels, setCommentAuthorLevels] = useState({}); // { uid: level }

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );

  const isInfo = post?.category?.toLowerCase?.() === "info";

  // -----------------------------
  // ✅ auth 준비 전엔 렌더 최소화
  // -----------------------------
  if (!authReady) return null;

  // -----------------------------
  // ✅ 게시글 구독 + 조회수 증가
  // -----------------------------
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "community_posts", id);

    updateDoc(ref, { viewCount: increment(1) }).catch(() => {});

    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  // -----------------------------
  // ✅ 댓글 구독
  // -----------------------------
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "community_posts", id, "comments"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id]);

  // -----------------------------
  // ✅ 작성자 레벨 (1회 구독 OK)
  // -----------------------------
  useEffect(() => {
    if (!post?.uid) return;
    const ref = doc(db, "app_users", post.uid);

    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setAuthorLevel(snap.data().profileLevel ?? 0);
    });
  }, [post?.uid]);

  // -----------------------------
  // ✅ 댓글 작성자 레벨: 무한 구독 X (getDocs로 묶어서 조회)
  // -----------------------------
  useEffect(() => {
    const uids = Array.from(
      new Set(comments.map((c) => c.uid).filter(Boolean))
    );

    if (uids.length === 0) {
      setCommentAuthorLevels({});
      return;
    }

    let cancelled = false;

    const fetchLevels = async () => {
      try {
        const result = {};
        const chunkSize = 10;

        for (let i = 0; i < uids.length; i += chunkSize) {
          const chunk = uids.slice(i, i + chunkSize);

          const q = query(
            collection(db, "app_users"),
            where(documentId(), "in", chunk)
          );

          const snap = await getDocs(q);
          snap.forEach((d) => {
            result[d.id] = d.data().profileLevel ?? 0;
          });
        }

        if (!cancelled) setCommentAuthorLevels(result);
      } catch (e) {
        console.log("댓글 작성자 레벨 조회 오류:", e);
      }
    };

    fetchLevels();

    return () => {
      cancelled = true;
    };
  }, [comments]);

  // -----------------------------
  // ✅ 게시글 좋아요 상태
  // -----------------------------
  useEffect(() => {
    if (!user || !id) return;

    const likeRef = doc(db, "community_posts", id, "likes", user.uid);
    return onSnapshot(likeRef, (snap) => setLiked(snap.exists()));
  }, [id, user]);

  // -----------------------------
  // ✅ 댓글 좋아요 상태 (각 댓글)
  // -----------------------------
  useEffect(() => {
    if (!user || comments.length === 0) return;

    const unsubs = comments.map((c) => {
      const ref = doc(
        db,
        "community_posts",
        id,
        "comments",
        c.id,
        "likes",
        user.uid
      );
      return onSnapshot(ref, (snap) => {
        setCommentLikes((prev) => ({ ...prev, [c.id]: snap.exists() }));
      });
    });

    return () => unsubs.forEach((u) => u && u());
  }, [comments, user, id]);

  // -----------------------------
  // ✅ 저장(북마크) 상태
  // -----------------------------
  useEffect(() => {
    if (!user || !post?.id) return;

    const ref = doc(db, "app_users", user.uid, "savedPosts", post.id);
    return onSnapshot(ref, (snap) => setSaved(snap.exists()));
  }, [user, post?.id]);

  const toggleSave = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!post?.id) return;

    const ref = doc(db, "app_users", user.uid, "savedPosts", post.id);

    try {
      if (saved) await deleteDoc(ref);
      else
        await setDoc(ref, {
          postId: post.id,
          title: post.title,
          savedAt: serverTimestamp(),
        });
    } catch (e) {
      console.log("저장 오류:", e);
    }
  };

  // -----------------------------
  // ✅ 공유: navigator.share + fallback
  // -----------------------------
  const handleShare = async () => {
    if (!post?.id) return;

    const webUrl = `https://lawhero-one.vercel.app//community/${post.id}`;
    const deepLink = `lawhero://community/${post.id}`;
    const message = `${post.title}\n\n앱에서 보기: ${deepLink}\n웹에서 보기: ${webUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: message, url: webUrl });
      } else {
        await navigator.clipboard.writeText(webUrl);
        alert("링크가 복사되었습니다!");
      }
    } catch (e) {
      console.log("공유 실패:", e);
    }
  };

  // -----------------------------
  // ✅ 최근 본 글 저장 (20개 유지)
  // -----------------------------
  useEffect(() => {
    if (!user || !post?.id) return;

    const saveRecent = async () => {
      const recentRef = collection(db, "app_users", user.uid, "recentPosts");

      await setDoc(
        doc(recentRef, post.id),
        {
          title: post.title,
          content: post.content,
          viewedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const q = query(recentRef, orderBy("viewedAt", "desc"));
      const snap = await getDocs(q);

      if (snap.size > 20) {
        const toDelete = snap.docs.slice(20);
        for (const d of toDelete) await deleteDoc(d.ref);
      }
    };

    saveRecent().catch(() => {});
  }, [post?.id, user?.uid]);

  // -----------------------------
  // ✅ 게시글 좋아요 토글
  // -----------------------------
  const toggleLike = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!id) return;

    const likeRef = doc(db, "community_posts", id, "likes", user.uid);
    const postRef = doc(db, "community_posts", id);
    const userLikeRef = doc(db, "app_users", user.uid, "likedPosts", id);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        await deleteDoc(userLikeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        await setDoc(userLikeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { likeCount: increment(1) });
      }
    } catch (e) {
      console.log("게시글 좋아요 오류:", e);
    }
  };

  // -----------------------------
  // ✅ 댓글 좋아요 토글
  // -----------------------------
  const toggleCommentLike = async (commentId) => {
    if (!user) return alert("로그인이 필요합니다.");

    const likeRef = doc(
      db,
      "community_posts",
      id,
      "comments",
      commentId,
      "likes",
      user.uid
    );

    const commentRef = doc(db, "community_posts", id, "comments", commentId);
    const isLiked = commentLikes[commentId];

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        await updateDoc(commentRef, { likeCount: increment(1) });
      }
    } catch (e) {
      console.log("댓글 좋아요 오류:", e);
    }
  };

  // -----------------------------
  // ✅ 댓글/대댓글 작성 + mention + 레벨업
  // -----------------------------
  const handleAddComment = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!commentText.trim()) return alert("댓글을 입력해주세요.");

    try {
      const userRef = doc(db, "app_users", user.uid);
      const userSnap = await getDoc(userRef);

      const nickname = userSnap.exists() ? userSnap.data().nickname : "사용자";

      let mentionNickname = null;
      if (commentText.startsWith("@")) {
        const firstSpace = commentText.indexOf(" ");
        if (firstSpace !== -1) mentionNickname = commentText.substring(1, firstSpace);
      }

      await addDoc(collection(db, "community_posts", id, "comments"), {
        uid: user.uid,
        nickname,
        content: commentText.trim(),
        likeCount: 0,
        parentId: replyTo ? replyTo.id : null,
        mention: mentionNickname,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "community_posts", id), {
        commentCount: increment(1),
      });

      await updateDoc(userRef, { commentCount: increment(1) });

      const updatedSnap = await getDoc(userRef);
      const data = updatedSnap.data() || {};
      const newLevel = calculateLevel(data.postCount || 0, data.commentCount || 0);

      if ((data.profileLevel || 0) < newLevel) {
        await updateDoc(userRef, { profileLevel: newLevel });
        alert("🎉 레벨 업! 프로필이 업그레이드 되었습니다!");
      }

      setCommentText("");
      setReplyTo(null);
    } catch (e) {
      console.log("댓글 작성 오류:", e);
      alert("댓글 작성 중 문제가 발생했습니다.");
    }
  };

  if (!post) return null;

  const paragraphs = post?.content?.split("\n").filter((p) => p.trim() !== "") || [];

  return (
    
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
        
      {/* 헤더 */}
      {isInfo ? (
  <div
    style={{
      background: getFieldColor(post.field),
      padding: "24px 20px 20px",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >

      {/* 뒤로가기 */}
      <button onClick={() => nav(-1)} style={iconBtnWhite}>
        <IoArrowBack size={22} color="white" />
      </button>

      {/* 우측 버튼 */}
      <div style={{ display: "flex", gap: 10 }}>

        {/* 저장 */}
        <button onClick={toggleSave} style={iconBtnWhite}>
          {saved ? (
            <IoBookmark size={20} color="white" />
          ) : (
            <IoBookmarkOutline size={20} color="white" />
          )}
        </button>

        {/* 공유 */}
        <button onClick={handleShare} style={iconBtnWhite}>
          <IoShareSocialOutline size={20} color="white" />
        </button>

      </div>
    </div>

    {/* 분야 */}
    <div style={{ marginTop: 14 }}>
      <span
        style={{
          background: "rgba(255,255,255,0.2)",
          padding: "6px 10px",
          borderRadius: 10,
          color: "white",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {post.field}
      </span>
    </div>

    {/* 제목 */}
    <h1
      style={{
        marginTop: 12,
        color: "white",
        fontSize: 22,
        fontWeight: 800,
        marginBottom: 0
      }}
    >
      {post.title}
    </h1>

  </div>
) : (

  /* 일반 게시글 헤더 */

  <div style={{ padding: "18px 20px 6px", display: "flex" }}>
    <button onClick={() => nav(-1)} style={iconBtnGray}>
      <IoArrowBack size={20} color="#374151" />
    </button>
  </div>

)}
      {/* 본문 */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 120px" }}>
        {isInfo ? (
          <div style={{ paddingTop: 10 }}>
            {paragraphs.map((p, idx) => {
              const text = p.trim();
              if (text.startsWith("Q")) {
                return (
                  <div key={idx} style={qBox}>
                    <div style={{ fontWeight: 800, lineHeight: 1.5 }}>{text}</div>
                  </div>
                );
              }
              if (text.startsWith("요약")) {
                return (
                  <div key={idx} style={summaryBox}>
                    <div style={{ color: "#3730A3", lineHeight: 1.6 }}>{text}</div>
                  </div>
                );
              }
              return (
                <p key={idx} style={{ color: "#374151", lineHeight: 1.7, fontSize: 16 }}>
                  {text}
                </p>
              );
            })}
          </div>
        ) : (
          <div style={card}>
            {/* 작성자 줄 + 프로필 이미지 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={avatarWrap}>
                {post.role === "expert" ? (
                  <img src={LAWYER_IMG} alt="lawyer" style={avatarImg} />
                ) : authorLevel > 0 ? (
                  <img src={getProfileImageUrl(authorLevel)} alt="level" style={avatarImg} />
                ) : (
                  <span style={{ color: "#9CA3AF", fontWeight: 900 }}>U</span>
                )}
              </div>
              <div style={{ fontWeight: 800 }}>{post.nickname || "작성자"}</div>
            </div>

            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 10 }}>
              {post.title}
            </div>
            <div style={{ color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {post.content}
            </div>

            <button onClick={toggleLike} style={likeRow}>
              <span style={{ fontSize: 18 }}>{liked ? (
  <IoHeart size={18} color="red" />
) : (
  <IoHeartOutline size={18} />
)}</span>
              <span style={{ fontWeight: 800 }}>{post.likeCount || 0}</span>
            </button>
          </div>
        )}

        {/* 댓글 */}
        <div style={{ marginTop: 18 }}>
          {rootComments.map((root) => (
            <div key={root.id} style={{ marginBottom: 14 }}>
              <div style={commentBox}>
                <button
                  onClick={() => {
                    setReplyTo({ id: root.id, nickname: root.nickname });
                    setCommentText(`@${root.nickname} `);
                  }}
                  style={commentHeaderBtn}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={avatarSmallWrap}>
                      {commentAuthorLevels[root.uid] > 0 ? (
                        <img
                          src={getProfileImageUrl(commentAuthorLevels[root.uid])}
                          alt="level"
                          style={avatarSmallImg}
                        />
                      ) : (
                        <span style={{ color: "#9CA3AF", fontWeight: 900 }}>U</span>
                      )}
                    </div>
                    <span style={{ fontWeight: 900 }}>{root.nickname}</span>
                  </div>
                </button>

                <div style={{ marginTop: 6 }}>
                  {root.mention && (
                    <span style={{ color: "#4F46E5", fontWeight: 900 }}>
                      @{root.mention}{" "}
                    </span>
                  )}
                  <span>{(root.content || "").replace(`@${root.mention || ""}`, "")}</span>
                </div>

                <button onClick={() => toggleCommentLike(root.id)} style={commentLikeBtn}>
                  <span>{commentLikes[root.id] ? (
  <IoHeart size={14} color="#EF4444" />
) : (
  <IoHeartOutline size={14} color="#9CA3AF" />
)}</span>
                  <span style={{ fontSize: 13 }}>{root.likeCount || 0}</span>
                </button>
              </div>

              {/* 대댓글 */}
              {comments
                .filter((c) => c.parentId === root.id)
                .map((reply) => (
                  <div key={reply.id} style={{ marginLeft: 24, marginTop: 8 }}>
                    <div style={commentBox}>
                      <button
                        onClick={() => {
                          setReplyTo({ id: reply.id, nickname: reply.nickname });
                          setCommentText(`@${reply.nickname} `);
                        }}
                        style={commentHeaderBtn}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={avatarSmallWrap}>
                            {commentAuthorLevels[reply.uid] > 0 ? (
                              <img
                                src={getProfileImageUrl(commentAuthorLevels[reply.uid])}
                                alt="level"
                                style={avatarSmallImg}
                              />
                            ) : (
                              <span style={{ color: "#9CA3AF", fontWeight: 900 }}>U</span>
                            )}
                          </div>
                          <span style={{ fontWeight: 900 }}>{reply.nickname}</span>
                        </div>
                      </button>

                      <div style={{ marginTop: 6 }}>
                        {reply.mention && (
                          <span style={{ color: "#4F46E5", fontWeight: 900 }}>
                            @{reply.mention}{" "}
                          </span>
                        )}
                        <span>
                          {(reply.content || "").replace(`@${reply.mention || ""}`, "")}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleCommentLike(reply.id)}
                        style={commentLikeBtn}
                      >
                        <span>{commentLikes[reply.id] ? (
  <IoHeart size={13} color="#EF4444" />
) : (
  <IoHeartOutline size={13} color="#9CA3AF" />
)}</span>
                        <span style={{ fontSize: 13 }}>{reply.likeCount || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ 댓글 입력바 fixed */}
      {user && (
        <div style={commentBarWrap}>
          <div style={commentBar}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyTo ? `@${replyTo.nickname}님에게 답글` : "댓글을 입력하세요"}
              rows={1}
              style={commentInput}
            />

            {commentText.length > 0 && (
              <button
                onClick={() => {
                  setCommentText("");
                  setReplyTo(null);
                }}
                style={clearBtn}
                title="지우기"
              >
                ✕
              </button>
            )}

            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              style={{
                ...sendBtn,
                background: commentText.trim() ? "#111827" : "#D1D5DB",
                cursor: commentText.trim() ? "pointer" : "not-allowed",
              }}
              title="전송"
            >
             <IoSend size={18} color="white" style={{ marginLeft: 2 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------
// styles
// -------------------
const card = {
  background: "white",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};

const likeRow = {
  marginTop: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const commentBox = {
  background: "#F8FAFC",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #EEF2F7",
};

const commentHeaderBtn = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
};

const commentLikeBtn = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#111827",
};

const commentBarWrap = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  background: "#F3F4F6",
  borderTop: "1px solid #E5E7EB",
  padding: "10px 12px",
};

const commentBar = {
  maxWidth: 720,
  margin: "0 auto",
  background: "#E5E7EB",
  borderRadius: 28,
  padding: "10px 10px 10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const commentInput = {
  flex: 1,
  resize: "none",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 15,
  lineHeight: 1.4,
  maxHeight: 160,
};

const clearBtn = {
  width: 28,
  height: 28,
  borderRadius: 14,
  border: "none",
  background: "#D1D5DB",
  cursor: "pointer",
};

const sendBtn = {
  width: 36,
  height: 36,
  borderRadius: 18,
  border: "none",
  color: "white",
  fontWeight: 900,
};

const iconBtnWhite = {
  border: "none",
  background: "rgba(255,255,255,0.2)",
  color: "white",
  width: 36,
  height: 36,
  borderRadius: 18,
  cursor: "pointer",
};

const iconBtnGray = {
  border: "none",
  background: "#F3F4F6",
  color: "#374151",
  width: 36,
  height: 36,
  borderRadius: 18,
  cursor: "pointer",
};

const qBox = {
  background: "#F3F4F6",
  padding: 16,
  borderRadius: 16,
  marginBottom: 16,
};

const summaryBox = {
  background: "#EEF2FF",
  padding: 16,
  borderRadius: 16,
  marginBottom: 16,
};

const avatarWrap = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: "#F3F4F6",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const avatarSmallWrap = {
  width: 28,
  height: 28,
  borderRadius: 14,
  background: "#F3F4F6",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avatarSmallImg = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};