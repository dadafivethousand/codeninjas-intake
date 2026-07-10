import { useState, useEffect } from "react";
import logo from "./assets/logo.png";

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function App() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [company, setCompany] = useState(""); // honeypot (bots fill hidden fields)
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const cleanedPhone = form.phone.replace(/\D/g, "");
  const isValid =
    form.firstName.trim() !== "" &&
    validateEmail(form.email) &&
    cleanedPhone.length === 10;

  // after a successful submit, auto-reset back to the empty form for the next lead
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 4000);
    return () => clearTimeout(t);
  }, [status]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const c = value.replace(/\D/g, "").slice(0, 10);
      let f = c;
      if (c.length > 3 && c.length <= 6) f = `(${c.slice(0, 3)}) ${c.slice(3)}`;
      else if (c.length > 6) f = `(${c.slice(0, 3)}) ${c.slice(3, 6)}-${c.slice(6)}`;
      setForm((p) => ({ ...p, phone: f }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: cleanedPhone, company }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err?.message || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <img className="logo" src={logo} alt="Code Ninjas Woodbridge" />

        {status === "success" ? (
          <div className="success">
            <div className="check" aria-hidden>✓</div>
            <h1>You're all set!</h1>
            <p>
              Thanks for reaching out — a member of our team will contact you
              shortly to book your child's free session.
            </p>
          </div>
        ) : (
          <>
            <h1 className="title">Reserve a Free Session</h1>

            <form onSubmit={onSubmit} noValidate>
              <div className="row">
                <label className="field">
                  <span>First name</span>
                  <input name="firstName" value={form.firstName} onChange={onChange} autoComplete="given-name" />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input name="lastName" value={form.lastName} onChange={onChange} autoComplete="family-name" />
                </label>
              </div>
   <div className="row">
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
              </label>

              <label className="field">
                <span>Phone</span>
                <input name="phone" inputMode="tel" value={form.phone} onChange={onChange} autoComplete="tel" />
              </label>
</div>
              {/* honeypot — hidden from real users */}
              <input
                className="hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />

              {status === "error" && <p className="err">{errorMsg}</p>}

              <button className="btn" type="submit" disabled={!isValid || status === "submitting"}>
                {status === "submitting" ? "Submitting…" : "Get Started →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
