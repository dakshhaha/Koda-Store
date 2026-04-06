import "server-only";

const dictionaries = {
  "en-US": () => import("@/dictionaries/en-US.json").then((module) => module.default),
  "hi-IN": () => import("@/dictionaries/hi-IN.json").then((module) => module.default),
  "en-IN": () => import("@/dictionaries/en-US.json").then((module) => module.default),
  "en-GB": () => import("@/dictionaries/en-US.json").then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  const loader = dictionaries[locale as keyof typeof dictionaries] || dictionaries["en-US"];
  return loader();
};
