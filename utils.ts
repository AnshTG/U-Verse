
import { format } from 'date-fns';

export const setCookie = (name: string, value: string, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const calculateAdminPassword = (): string => {
  // IST is UTC + 5:30
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utc + istOffset);
  
  const hh = format(istDate, 'HH');
  const mm = format(istDate, 'mm');
  const hhmmString = hh + mm;
  const hhmmInt = parseInt(hhmmString, 10);
  
  return (hhmmInt * 2).toString();
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'PPP');
  } catch {
    return date;
  }
};
