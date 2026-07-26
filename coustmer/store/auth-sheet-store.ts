import { create } from 'zustand';

export type AuthSheetView = 'login' | 'register' | 'forgot-password' | 'verify-otp';

type AuthSheetState = {
  visible: boolean;
  view: AuthSheetView;
  otpIdentifier?: string;
  open: (view?: AuthSheetView, options?: { otpIdentifier?: string }) => void;
  close: () => void;
  setView: (view: AuthSheetView, options?: { otpIdentifier?: string }) => void;
};

export const useAuthSheetStore = create<AuthSheetState>((set) => ({
  visible: false,
  view: 'login',
  otpIdentifier: undefined,
  open: (view = 'login', options) =>
    set({ visible: true, view, otpIdentifier: options?.otpIdentifier }),
  close: () => set({ visible: false, view: 'login', otpIdentifier: undefined }),
  setView: (view, options) =>
    set({ view, otpIdentifier: options?.otpIdentifier }),
}));
