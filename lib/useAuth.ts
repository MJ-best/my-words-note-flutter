"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

/** 로그인 상태. user === undefined 는 아직 확인 중. */
export function useAuth(): { user: User | null | undefined } {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setUser), []);
  return { user };
}
