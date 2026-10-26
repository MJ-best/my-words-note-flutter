"use client";

import { useState } from "react";
import { LANGS, langLabel } from "@/lib/types";
import { normalizeLang } from "@/lib/graph-utils";

/** 그래프에 이미 있는 언어 + 기본 언어 목록 + 직접 입력 */
export default function LangSelect({
  value,
  onChange,
  known,
}: {
  value: string;
  onChange: (v: string) => void;
  known: string[];
}) {
  const options = Array.from(new Set([...known, ...Object.keys(LANGS)]));
  const [custom, setCustom] = useState(!options.includes(value));

  if (custom) {
    return (
      <div className="row">
        <input
          className="input"
          value={value}
          placeholder="언어 코드 (예: th, id, pt)"
          onChange={(e) => onChange(normalizeLang(e.target.value))}
          autoFocus
        />
        <button type="button" className="btn" style={{ flex: "0 0 auto" }} onClick={() => { setCustom(false); onChange(options[0]); }}>
          목록
        </button>
      </div>
    );
  }
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => {
        if (e.target.value === "__custom") {
          setCustom(true);
          onChange("");
        } else onChange(e.target.value);
      }}
    >
      {options.map((code) => (
        <option key={code} value={code}>
          {langLabel(code)} ({code})
        </option>
      ))}
      <option value="__custom">직접 입력…</option>
    </select>
  );
}
