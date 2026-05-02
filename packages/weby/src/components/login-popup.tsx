import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthUser, Stats } from "#/types";
import { useAuth, useAuthActions } from "../hooks/use-auth";
import { useBootstrapState } from "../hooks/use-bootstrap-state";

interface LoginPopupProps {
  isDarkMode: boolean;
}

type PopupMode = "loading" | "login" | "bootstrap" | "account";

const validateUsername = (value: string): string | undefined => {
  if (value.length < 1) {
    return "required";
  }
  if (value.length < 3) {
    return "min 3 chars";
  }
  return undefined;
};

const validateEmail = (value: string): string | undefined => {
  if (value.length < 1) {
    return "required";
  }
  if (value.includes("@")) {
    return undefined;
  }
  return "invalid email";
};

const validatePassword = (value: string): string | undefined => {
  if (value.length < 1) {
    return "required";
  }
  if (value.length < 8) {
    return "min 8 chars";
  }
  return undefined;
};

interface AccountPanelProps {
  user: Pick<AuthUser, "username" | "email">;
  stats: { pages: number; posts: number; readmes: number } | undefined;
  onLogout: () => void;
  onNavigateConsole: () => void;
  isDarkMode: boolean;
}

const AccountPanel = ({
  user,
  stats,
  onLogout,
  onNavigateConsole,
  isDarkMode,
}: AccountPanelProps) => (
  <div className="space-y-3">
    <div className={`border-b pb-3 ${isDarkMode ? "border-border-dark" : "border-border-light"}`}>
      <p className={`text-[13px] ${isDarkMode ? "text-text-dark" : "text-text-light"}`}>
        @{user.username}
      </p>
      <p
        className={`mt-0.5 text-[11px] ${isDarkMode ? "text-text-dark/50" : "text-text-light/50"}`}
      >
        {user.email}
      </p>
    </div>

    {stats && (
      <div className={`text-[11px] ${isDarkMode ? "text-text-dark/40" : "text-text-light/40"}`}>
        <span className="mr-3">pages {stats.pages}</span>
        <span className="mr-3">posts {stats.posts}</span>
        <span>readmes {stats.readmes}</span>
      </div>
    )}

    <div
      className={`flex gap-0 border-t pt-3 ${isDarkMode ? "border-border-dark" : "border-border-light"}`}
    >
      <button
        className={`flex-1 py-1.5 text-[13px] lowercase ${
          isDarkMode
            ? "text-text-dark/50 hover:text-text-dark/80"
            : "text-text-light/50 hover:text-text-light/80"
        }`}
        onClick={onNavigateConsole}
        type="button"
      >
        console
      </button>
      <button
        className={`flex-1 py-1.5 text-[13px] lowercase ${
          isDarkMode ? "text-red-300/60 hover:text-red-300" : "text-red-600/60 hover:text-red-600"
        }`}
        onClick={onLogout}
        type="button"
      >
        logout
      </button>
    </div>
  </div>
);

export const LoginPopup = ({ isDarkMode }: LoginPopupProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PopupMode>("loading");
  const [serverError, setServerError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: user } = useAuth();
  const { data: bootstrapState } = useBootstrapState();
  const { login: loginAction, logout } = useAuthActions();
  const navigate = useNavigate();

  const { data: stats } = useQuery<Stats>({
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/stats", { signal });
      return response.ok ? response.json() : null;
    },
    queryKey: ["stats"],
    staleTime: 5 * 60 * 1000,
  });

  const isAuthenticated = user !== undefined && user !== null;

  const bootstrapForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await loginAction(value.username, value.password, value.email);
        setOpen(false);
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "Bootstrap failed");
      }
    },
  });

  const loginForm = useForm({
    defaultValues: {
      password: "",
      usernameOrEmail: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await loginAction(value.usernameOrEmail, value.password);
        setOpen(false);
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "Login failed");
      }
    },
  });

  const handleOpen = useCallback(() => {
    if (bootstrapState === undefined) {
      return;
    }
    setServerError(null);
    setMode(bootstrapState.bootstrapped ? "login" : "bootstrap");
    setOpen(true);
  }, [bootstrapState]);

  useEffect(() => {
    if (open && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96, y: 12 },
        { duration: 0.2, ease: "power2.out", opacity: 1, scale: 1, y: 0 },
      );
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <>
      <button
        className={`text-[13px] lowercase focus:outline-none lg:fixed lg:right-6 lg:bottom-6 lg:z-40 ${
          isDarkMode
            ? "text-text-dark/60 hover:text-text-dark"
            : "text-text-light/60 hover:text-text-light"
        }`}
        onClick={() => {
          if (isAuthenticated) {
            setMode("account");
            setOpen(true);
          } else {
            handleOpen();
          }
        }}
        type="button"
      >
        {isAuthenticated ? `@${user.username}` : "login"}
      </button>

      {open && (
        <div aria-label="Login" aria-modal="true" className="fixed inset-0 z-50" role="dialog">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            role="presentation"
          />
          <div
            ref={cardRef}
            className={`absolute right-4 bottom-16 w-64 border p-4 shadow-xl sm:right-6 sm:bottom-20 ${
              isDarkMode ? "border-border-dark bg-bg-dark" : "border-border-light bg-bg-light"
            }`}
          >
            <p
              className={`mb-4 text-[13px] ${
                isDarkMode ? "text-text-dark/60" : "text-text-light/60"
              }`}
            >
              powered by{" "}
              <a href="/about" className="underline" target="_blank" rel="noopener noreferrer">
                verso
              </a>{" "}
              a self hosted knowledge base
            </p>

            {mode === "loading" && (
              <p
                className={`text-center text-[13px] ${
                  isDarkMode ? "text-text-dark/50" : "text-text-light/50"
                }`}
              >
                loading...
              </p>
            )}

            {mode === "login" && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  loginForm.handleSubmit();
                }}
              >
                <loginForm.Field
                  name="usernameOrEmail"
                  validators={{
                    onChange: ({ value }) => (value.length < 1 ? "required" : undefined),
                  }}
                >
                  {(field) => (
                    <div>
                      <input
                        aria-label="Username or email"
                        className={`w-full border-b py-1.5 text-[13px] lowercase outline-none bg-transparent ${
                          isDarkMode
                            ? "border-border-dark placeholder:text-text-dark/30"
                            : "border-border-light placeholder:text-text-light/30"
                        }`}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="username or email"
                        value={field.state.value}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}
                        >
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </loginForm.Field>

                <loginForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => (value.length < 1 ? "required" : undefined),
                  }}
                >
                  {(field) => (
                    <div>
                      <input
                        aria-label="Password"
                        className={`w-full border-b py-1.5 text-[13px] lowercase outline-none bg-transparent ${
                          isDarkMode
                            ? "border-border-dark placeholder:text-text-dark/30"
                            : "border-border-light placeholder:text-text-light/30"
                        }`}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="password"
                        type="password"
                        value={field.state.value}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}
                        >
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </loginForm.Field>

                {serverError && (
                  <p className={`text-[11px] ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
                    {serverError}
                  </p>
                )}

                <loginForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <button
                      className={`w-full py-1.5 text-[13px] lowercase ${
                        isDarkMode
                          ? "text-text-dark/50 hover:text-text-dark/80"
                          : "text-text-light/50 hover:text-text-light/80"
                      } disabled:opacity-30`}
                      disabled={!canSubmit}
                      type="submit"
                    >
                      {isSubmitting ? "..." : "login"}
                    </button>
                  )}
                </loginForm.Subscribe>
              </form>
            )}

            {mode === "bootstrap" && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  bootstrapForm.handleSubmit();
                }}
              >
                <bootstrapForm.Field
                  name="username"
                  validators={{
                    onChange: ({ value }) => validateUsername(value),
                  }}
                >
                  {(field) => (
                    <div>
                      <input
                        aria-label="Username"
                        className={`w-full border-b py-1.5 text-[13px] lowercase outline-none bg-transparent ${
                          isDarkMode
                            ? "border-border-dark placeholder:text-text-dark/30"
                            : "border-border-light placeholder:text-text-light/30"
                        }`}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="username"
                        value={field.state.value}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}
                        >
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </bootstrapForm.Field>

                <bootstrapForm.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => validateEmail(value),
                  }}
                >
                  {(field) => (
                    <div>
                      <input
                        aria-label="Email"
                        className={`w-full border-b py-1.5 text-[13px] lowercase outline-none bg-transparent ${
                          isDarkMode
                            ? "border-border-dark placeholder:text-text-dark/30"
                            : "border-border-light placeholder:text-text-light/30"
                        }`}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="email"
                        type="email"
                        value={field.state.value}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}
                        >
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </bootstrapForm.Field>

                <bootstrapForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => validatePassword(value),
                  }}
                >
                  {(field) => (
                    <div>
                      <input
                        aria-label="Password"
                        className={`w-full border-b py-1.5 text-[13px] lowercase outline-none bg-transparent ${
                          isDarkMode
                            ? "border-border-dark placeholder:text-text-dark/30"
                            : "border-border-light placeholder:text-text-light/30"
                        }`}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="password"
                        type="password"
                        value={field.state.value}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            isDarkMode ? "text-red-300" : "text-red-600"
                          }`}
                        >
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </bootstrapForm.Field>

                {serverError && (
                  <p className={`text-[11px] ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
                    {serverError}
                  </p>
                )}

                <bootstrapForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      className={`w-full py-1.5 text-[13px] lowercase ${
                        isDarkMode
                          ? "text-text-dark/50 hover:text-text-dark/80"
                          : "text-text-light/50 hover:text-text-light/80"
                      } disabled:opacity-30`}
                      disabled={!canSubmit}
                      type="submit"
                    >
                      {isSubmitting ? "..." : "create account"}
                    </button>
                  )}
                </bootstrapForm.Subscribe>
              </form>
            )}

            {mode === "account" && user && (
              <AccountPanel
                isDarkMode={isDarkMode}
                onLogout={() => {
                  logout();
                  setOpen(false);
                }}
                onNavigateConsole={() => {
                  setOpen(false);
                  navigate({ to: "/home" });
                }}
                stats={stats ?? undefined}
                user={user}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
