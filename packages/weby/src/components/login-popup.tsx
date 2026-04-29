import { useForm } from "@tanstack/react-form";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";

interface LoginPopupProps {
  isDarkMode: boolean;
}

export const LoginPopup = ({ isDarkMode }: LoginPopupProps) => {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      password: "",
      username: "",
    },
    onSubmit: ({ value }) => {
      console.log("login attempt:", value);
      form.reset();
      setOpen(false);
    },
  });

  useEffect(() => {
    if (open && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96, y: 12 },
        { duration: 0.2, ease: "power2.out", opacity: 1, scale: 1, y: 0 },
      );
    }
  }, [open]);

  return (
    <>
      <button
        className={`text-[13px] lowercase focus:outline-none lg:fixed lg:right-6 lg:bottom-6 lg:z-40 ${
          isDarkMode
            ? "text-text-dark/60 hover:text-text-dark"
            : "text-text-light/60 hover:text-text-light"
        }`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        login
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
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
              <a
                href="https://github.com/parazeeknova/verso"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                verso
              </a>{" "}
              a self hosted knowledge base
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <form.Field
                name="username"
                validators={{
                  onChange: ({ value }) => (value.length < 1 ? "required" : undefined),
                }}
              >
                {(field) => (
                  <div>
                    <input
                      aria-label="Username"
                      className={`w-full border px-2 py-1.5 text-[13px] lowercase outline-none ${
                        isDarkMode
                          ? "border-border-dark bg-white/5 text-text-dark placeholder:text-text-dark/30"
                          : "border-border-light bg-black/3 text-text-light placeholder:text-text-light/30"
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
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => (value.length < 1 ? "required" : undefined),
                }}
              >
                {(field) => (
                  <div>
                    <input
                      aria-label="Password"
                      className={`w-full border px-2 py-1.5 text-[13px] lowercase outline-none ${
                        isDarkMode
                          ? "border-border-dark bg-white/5 text-text-dark placeholder:text-text-dark/30"
                          : "border-border-light bg-black/3 text-text-light placeholder:text-text-light/30"
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
              </form.Field>

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <button
                    className={`w-full py-1.5 text-[13px] lowercase ${
                      isDarkMode
                        ? "border border-border-dark bg-white/5 text-text-dark hover:bg-white/10"
                        : "border border-border-light bg-black/3 text-text-light hover:bg-black/5"
                    } disabled:opacity-30`}
                    disabled={!canSubmit}
                    type="submit"
                  >
                    {isSubmitting ? "..." : "login"}
                  </button>
                )}
              </form.Subscribe>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
