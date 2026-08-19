// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import Home from "./Home";

const setViewport = (width: number, reducedMotion: boolean) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({ matches: query.includes("prefers-reduced-motion") ? reducedMotion : false })),
  });
};

const renderMotionHero = () => {
  const view = render(createElement(Home));
  const montage = view.container.querySelector<HTMLDivElement>(".hero-montage");
  const phone = view.container.querySelector<HTMLElement>(".montage-phone");
  if (!montage || !phone) throw new Error("Expected landing hero motion layers");
  Object.defineProperty(montage, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ left: 0, top: 0, width: 400, height: 300 }),
  });
  return { montage, phone };
};

afterEach(cleanup);

describe("Home hero montage motion", () => {
  it("updates live montage CSS variables from desktop pointer movement", () => {
    setViewport(1440, false);
    const { montage, phone } = renderMotionHero();
    fireEvent.mouseMove(montage, { clientX: 400, clientY: 0 });
    expect(phone.style.getPropertyValue("--parallax-x")).toBe("4px");
    expect(phone.style.getPropertyValue("--parallax-y")).toBe("-4px");
  });

  it("does not update live montage CSS variables on mobile or under reduced motion", () => {
    setViewport(430, false);
    let hero = renderMotionHero();
    fireEvent.mouseMove(hero.montage, { clientX: 400, clientY: 0 });
    expect(hero.phone.style.getPropertyValue("--parallax-x")).toBe("");
    cleanup();
    setViewport(1440, true);
    hero = renderMotionHero();
    fireEvent.mouseMove(hero.montage, { clientX: 400, clientY: 0 });
    expect(hero.phone.style.getPropertyValue("--parallax-x")).toBe("");
  });

  it("routes public authentication actions to the simulated login and registration screens", () => {
    setViewport(1440, false);
    window.history.replaceState({}, "", "/");
    let view = render(createElement(Home));
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    expect(window.location.pathname).toBe("/auth/login");
    cleanup();
    window.history.replaceState({}, "", "/");
    view = render(createElement(Home));
    fireEvent.click(view.getByRole("button", { name: "Get Started" }));
    expect(window.location.pathname).toBe("/auth/register");
  });
});
