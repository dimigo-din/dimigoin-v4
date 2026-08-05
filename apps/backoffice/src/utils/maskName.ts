export const maskName = (s: string) => {
  return s.length < 2 ? s : s.length === 2 ? s[0] + "0" : s.slice(0, -2) + "0" + s.at(-1);
};
