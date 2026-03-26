export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateInput = (date?: string | Date | null): string => {
  if (!date) return "";
  if (typeof date === "string") {
    return date.split("T")[0] || "";
  }

  const isoString = date.toISOString();
  return isoString.split("T")[0] || "";
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateThaiInput = (date?: string | Date | null): string => {
  if (!date) return "";

  const formatDateParts = (value: string) => {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}-${month}-${year}`;
  };

  if (typeof date === "string") {
    return formatDateParts(date.split("T")[0] || "");
  }

  const isoString = date.toISOString();
  return formatDateParts(isoString.split("T")[0] || "");
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("th-TH").format(price);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const toDateInputFormat = (date: string | Date | undefined | null): string => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getImgInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getPrefixName = (prefixId?: number | string | null): string => {
  const prefixMap: Record<number | string, string> = {
  '250ae8ee-9f0a-4b94-a2c4-a475752dc3e6': 'นาย',
  '6ec2c1dd-ab31-47d3-8870-680baac1b8da': 'นาง',
  '9b91d6d5-c414-4a92-b44a-2ad07250271c': 'นางสาว',
  }
  if (!prefixId) return ''
  return prefixMap[prefixId] || ''
};

export const calAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

