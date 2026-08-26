import { describe, expect, it } from "vitest";
import { sessionTokenFromCookieString } from "./sessionAuth";

describe("session authentication transport", () => {
  it("extracts the FerixRG account session token from a browser cookie string", () => {
    expect(sessionTokenFromCookieString("theme=light; app_session_id=secure-token; other=value")).toBe("secure-token");
  });

  it("does not accept unrelated or missing cookie values as a session", () => {
    expect(sessionTokenFromCookieString("theme=light; other=value")).toBeNull();
    expect(sessionTokenFromCookieString(null)).toBeNull();
  });
});
