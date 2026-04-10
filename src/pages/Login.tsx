import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MagneticButton } from "@/components/magnetic-button"

type AuthMode = "sms" | "email"
type SmsStep = "phone" | "code"
type EmailStep = "login" | "register"

const API_BASE = "https://functions.poehali.dev/5c5296bd-cb57-41dc-8943-6002a3475fb7"

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>("sms")
  const [smsStep, setSmsStep] = useState<SmsStep>("phone")
  const [emailStep, setEmailStep] = useState<EmailStep>("login")
  const [role, setRole] = useState<"customer" | "cleaner">("customer")

  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [devCode, setDevCode] = useState("")

  const api = (action: string, payload: object) =>
    fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    })

  const handleSendCode = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await api("send-code", { phone })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDevCode(data.code || "")
      setSmsStep("code")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await api("verify-code", { phone, code, role })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate(data.user.role === "cleaner" ? "/cleaner" : "/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await api("login", { email, password })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate(data.user.role === "cleaner" ? "/cleaner" : "/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegister = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await api("register", { email, password, name, role })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate(data.user.role === "cleaner" ? "/cleaner" : "/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Фоновый градиент */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950 via-background to-yellow-950/20" />

      <div className="relative w-full max-w-md">
        {/* Логотип */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <button onClick={() => navigate("/")} className="transition-transform hover:scale-105">
            <img
              src="https://cdn.poehali.dev/projects/bee7d20a-b3b5-4571-a679-1d7d3bf59d45/bucket/9699e7e1-cc27-427f-beab-bf236bf6935c.jpeg"
              alt="Выберу и уберу"
              className="h-20 w-20 rounded-full object-cover shadow-[0_0_24px_rgba(201,162,39,0.4)] ring-2 ring-yellow-500/40"
            />
          </button>
          <p className="font-mono text-xs text-foreground/50">Личный кабинет</p>
        </div>

        {/* Карточка */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-md md:p-8">
          {/* Выбор роли */}
          <div className="mb-6 flex rounded-xl border border-foreground/10 p-1">
            {(["customer", "cleaner"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 rounded-lg py-2 font-sans text-sm font-medium transition-all duration-200 ${
                  role === r
                    ? "bg-yellow-500/20 text-yellow-300 shadow-sm"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                {r === "customer" ? "Заказчик" : "Клинер"}
              </button>
            ))}
          </div>

          {/* Выбор способа входа */}
          <div className="mb-6 flex rounded-xl border border-foreground/10 p-1">
            {(["sms", "email"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSmsStep("phone"); setEmailStep("login") }}
                className={`flex-1 rounded-lg py-2 font-sans text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                {m === "sms" ? "SMS-код" : "Email"}
              </button>
            ))}
          </div>

          {/* SMS форма */}
          {mode === "sms" && (
            <div className="space-y-4">
              {smsStep === "phone" ? (
                <>
                  <div>
                    <label className="mb-1.5 block font-mono text-xs text-foreground/50">Номер телефона</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 900 000 00 00"
                      className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-500/50 focus:outline-none"
                    />
                  </div>
                  {error && <p className="font-mono text-xs text-red-400">{error}</p>}
                  <MagneticButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleSendCode}
                  >
                    {loading ? "Отправка..." : "Получить код"}
                  </MagneticButton>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block font-mono text-xs text-foreground/50">
                      Код из SMS на {phone}
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground placeholder:text-foreground/30 focus:border-yellow-500/50 focus:outline-none"
                    />
                  </div>
                  {devCode && (
                    <p className="rounded-lg bg-yellow-500/10 px-3 py-2 font-mono text-xs text-yellow-400">
                      Тестовый код: <strong>{devCode}</strong>
                    </p>
                  )}
                  {error && <p className="font-mono text-xs text-red-400">{error}</p>}
                  <MagneticButton variant="primary" size="lg" className="w-full" onClick={handleVerifyCode}>
                    {loading ? "Проверка..." : "Войти"}
                  </MagneticButton>
                  <button
                    onClick={() => { setSmsStep("phone"); setError(""); setDevCode("") }}
                    className="w-full font-mono text-xs text-foreground/40 hover:text-foreground/70"
                  >
                    ← Изменить номер
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email форма */}
          {mode === "email" && (
            <div className="space-y-4">
              {emailStep === "register" && (
                <div>
                  <label className="mb-1.5 block font-mono text-xs text-foreground/50">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-500/50 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block font-mono text-xs text-foreground/50">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-foreground/50">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-500/50 focus:outline-none"
                />
              </div>
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <MagneticButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={emailStep === "login" ? handleEmailLogin : handleEmailRegister}
              >
                {loading ? "..." : emailStep === "login" ? "Войти" : "Зарегистрироваться"}
              </MagneticButton>
              <button
                onClick={() => { setEmailStep(emailStep === "login" ? "register" : "login"); setError("") }}
                className="w-full font-mono text-xs text-foreground/40 hover:text-foreground/70"
              >
                {emailStep === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-xs text-foreground/30">
          Нажимая «Войти», вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  )
}