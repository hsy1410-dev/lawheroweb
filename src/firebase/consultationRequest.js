import { doc, getDoc } from "firebase/firestore";

import { db } from "./firebase";

const PHONE_FIELDS = [
  "phone",
  "phoneNumber",
  "phoneInput",
  "mobile",
  "mobilePhone",
  "contactPhone",
];

export const WEB_APPLICATION_METADATA = Object.freeze({
  applicationSource: "web",
  platform: "web",
  isWeb: true,
});

export async function getApplicantPhone(user) {
  const userSnap = await getDoc(doc(db, "app_users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  for (const field of PHONE_FIELDS) {
    const value = userData[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return typeof user.phoneNumber === "string" ? user.phoneNumber.trim() : "";
}
