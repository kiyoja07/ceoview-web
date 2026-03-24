export type LabeledOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type KeyLabel<K extends string> = {
  key: K;
  label: string;
};

export type NavDefinition = {
  href?: string;
  slug?: string;
  label: string;
  activePrefix?: string;
};
