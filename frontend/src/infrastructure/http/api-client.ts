export interface AuthUser { id: string; username: string; fullName: string; role: "admin" | "rep"; branchId: string }
export interface AuthResponse { token: string; userId: string; username: string; fullName: string; role: "admin" | "rep"; branchId: string }
export interface PageResult<T> { items: T[]; totalCount: number; page: number; pageSize: number }
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public customerId?: string) { super(message); }
}
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "/api" : "http://localhost:5018/api");
const TOKEN_KEY = "sewtec_crm_token_v1";
const USER_KEY = "sewtec_crm_user_v1";
export const SESSION_EVENT = "sewtec-session-change";
class ApiClient {
  private epoch = 0;
  private revisions = new Map<string, string>();
  getEpoch() { return this.epoch; }
  getToken(): string | null { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
  }
  private changed() {
    this.epoch++; this.revisions.clear();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
  }
  setSession(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); this.changed();
  }
  clearSession() {
    if (typeof window !== "undefined") { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
    this.changed();
  }
  externalSessionChanged() { this.changed(); }
  private remember(value: unknown) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(item => this.remember(item)); return; }
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && typeof record.revision === "string") this.revisions.set(record.id, record.revision);
    Object.values(record).filter(v => v && typeof v === "object").forEach(v => this.remember(v));
  }
  private async request<T>(endpoint: string, options: RequestInit = {}, blob = false): Promise<T> {
    const token = this.getToken(); const epoch = this.epoch;
    if (!token && endpoint !== "/auth/login") throw new ApiError("يرجى تسجيل الدخول.", 401);
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (typeof options.body === "string") {
      const body = JSON.parse(options.body);
      if (typeof body?.revision === "string") headers.set("If-Match", body.revision);
    }
    const id = endpoint.split("/")[2]?.split("?")[0];
    if (id && options.method && options.method !== "GET" && this.revisions.has(id) && !headers.has("If-Match")) headers.set("If-Match", this.revisions.get(id)!);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, cache: "no-store", signal: options.signal ?? AbortSignal.timeout(30000) });
    if (epoch !== this.epoch || token !== this.getToken()) throw new ApiError("تغيرت الجلسة؛ أعد فتح الصفحة.", 401, "session_changed");
    if (!response.ok) {
      if (response.status === 401) this.clearSession();
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message || (response.status === 403 ? "ليست لديك صلاحية لهذا الإجراء." : "تعذر إتمام الطلب. راجع البيانات وأعد المحاولة."), response.status, error.code, error.customerId);
    }
    if (blob) return await response.blob() as T;
    if (response.status === 204) return undefined as T;
    const result = await response.json(); this.remember(result);
    if (options.method && options.method !== "GET" && endpoint !== "/auth/login" && typeof window !== "undefined") window.dispatchEvent(new Event("sewtec-data-change"));
    return result;
  }
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== "") search.set(k, String(v)); });
    return this.request<T>(endpoint + (search.size ? `?${search}` : ""), { method: "GET" });
  }
  post<T>(endpoint: string, body?: unknown): Promise<T> { return this.request(endpoint, { method: "POST", body: JSON.stringify(body) }); }
  put<T>(endpoint: string, body?: unknown): Promise<T> { return this.request(endpoint, { method: "PUT", body: JSON.stringify(body) }); }
  patch<T>(endpoint: string, body?: unknown): Promise<T> { return this.request(endpoint, { method: "PATCH", body: JSON.stringify(body) }); }
  delete<T>(endpoint: string): Promise<T> { return this.request(endpoint, { method: "DELETE" }); }
  postFormData<T>(endpoint: string, body: FormData): Promise<T> { return this.request(endpoint, { method: "POST", body }); }
  async downloadFile(endpoint: string, filename: string) {
    const blob = await this.request<Blob>(endpoint, { method: "GET" }, true);
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  }
}
export const apiClient = new ApiClient();
