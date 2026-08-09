// App-wide design system — neo-brutalist: warm cream background, thick
// black borders, hard offset shadows (no blur), mustard primary accent.
// Every screen imports colors/fonts/radii from here, so this file is the
// single source of truth for the whole app's look.

export const colors = {
  appBg: "#FCF9F8",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F3F2",
  ink: "#1C1B1B",
  inkSoft: "#4F4632",
  border: "#1C1B1B", // borders are always ink — that's the neo-brutalist look
  outlineVariant: "#D4C5AB",

  accent: "#FFC107", // mustard — selected state + primary CTA
  accentDeep: "#785900",
  onAccent: "#1C1B1B", // text on mustard is dark, not white, per the reference

  sage: "#3F7A4E",
  sageBg: "#DCEEDF",
  rose: "#BA1A1A",
  roseBg: "#FFDAD6",
  track: "#DCD9D9",
  onInk: "#FCF9F8",
};

export const fonts = {
  display: "PlusJakartaSans_800ExtraBold",
  displayMedium: "PlusJakartaSans_700Bold",
  body: "BeVietnamPro_400Regular",
  bodyMedium: "BeVietnamPro_500Medium",
  bodySemibold: "BeVietnamPro_600SemiBold",
  bodyBold: "BeVietnamPro_700Bold",
  mono: "IBMPlexMono_500Medium",
  monoSemibold: "IBMPlexMono_600SemiBold",
  // Aliases matching the reference design's naming (headline-xl/lg/md, label-bold/sm)
  headlineXl: "PlusJakartaSans_800ExtraBold",
  headlineLg: "PlusJakartaSans_800ExtraBold",
  headlineMd: "PlusJakartaSans_700Bold",
  labelBold: "BeVietnamPro_700Bold",
  labelSm: "BeVietnamPro_600SemiBold",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const spacing = (n: number) => n * 4;
