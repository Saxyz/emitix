import { api } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './types'

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', body, { public: true }),

  register: (body: RegisterRequest) =>
    api.post<LoginResponse>('/api/auth/register', body, { public: true }),

  logout: () =>
    api.post<void>('/api/auth/logout'),

  me: () =>
    api.get<MeResponse>('/api/auth/me'),

  forgotPassword: (body: ForgotPasswordRequest) =>
    api.post<void>('/api/auth/forgot-password', body, { public: true }),

  resetPassword: (body: ResetPasswordRequest) =>
    api.post<void>('/api/auth/reset-password', body, { public: true }),
}
