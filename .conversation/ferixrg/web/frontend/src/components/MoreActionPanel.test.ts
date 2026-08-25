import { describe, expect, it } from "vitest";
import { moreActionDetails } from "./MoreActionPanel";

describe("More nested action map", () => {
  it("provides a dedicated destination for every visible non-Team More action", () => {
    expect(Object.keys(moreActionDetails).sort()).toEqual([
      "billing:AI credits", "billing:Billing history", "billing:Subscription", "billing:Usage limits",
      "platform:API keys", "platform:Developer & API", "platform:Integrations", "platform:Request a platform",
      "preferences:Accessibility", "preferences:Notifications", "preferences:Product updates", "preferences:Workspace defaults",
      "profile:Connected sessions", "profile:Email address", "profile:Password & security", "profile:Personal details",
      "resources:About", "resources:Documentation", "resources:Help Center", "resources:Privacy", "resources:Terms", "resources:What’s New",
      "support:Contact support", "support:Feature requests", "support:Report a problem", "support:Send feedback",
    ]);
  });

  it("keeps every destination actionable with a primary completion state", () => {
    Object.values(moreActionDetails).forEach(detail => {
      expect(detail.primary).toBeTruthy();
      expect(detail.completion).toBeTruthy();
      expect(detail.title).toBeTruthy();
    });
  });
});
