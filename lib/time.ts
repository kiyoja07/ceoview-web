export const getCurrentYYYYMM = () =>
  `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
