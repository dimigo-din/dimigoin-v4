const base = {
  Colors: {
    Solid: {
      Red: "#ff4035",
      Orange: "#ff9a05",
      Yellow: "#f5c905",
      Green: "#32cc58",
      Blue: "#057fff",
      Indigo: "#5b59de",
      Purple: "#b756e8",
      Pink: "#ff325a",
      Brown: "#a78963",
      Black: "#000000",
      White: "#ffffff",
      Translucent: {
        Light: {
          // 10% alpha
          Red: "#ff40351a",
          Orange: "#ff9a051a",
          Yellow: "#f5c9051a",
          Green: "#32cc581a",
          Blue: "#057fff1a",
          Indigo: "#5b59de1a",
          Purple: "#b756e81a",
          Pink: "#ff325a1a",
          Brown: "#a789631a",
        },
        Dark: {
          // 20% alpha
          Red: "#ff403534",
          Orange: "#ff9a0534",
          Yellow: "#f5c90534",
          Green: "#32cc5834",
          Blue: "#057fff34",
          Indigo: "#5b59de34",
          Purple: "#b756e834",
          Pink: "#ff325a34",
          Brown: "#a7896334",
        },
      },
    },
    Background: {
      Standard: {
        Light: {
          Primary: "#ffffff", // ref: Solid/White
          Secondary: "#f6f6fa",
          Tertiary: "#ebecf5",
        },
        Dark: {
          Primary: "#000000", // ref: Solid/Black
          Secondary: "#09090a",
          Tertiary: "#0e0e0f",
        },
      },
      Inverted: {
        Light: {
          Primary: "#000000", // ref: Solid/Black
          Secondary: "#09090a",
          Tertiary: "#0e0e0f",
        },
        Dark: {
          Primary: "#ffffff", // ref: Solid/White
          Secondary: "#f6f6fa",
          Tertiary: "#ebecf5",
        },
      },
    },
    Content: {
      Standard: {
        // 70%, 50%, 30% each
        Light: {
          Primary: "#202128",
          Secondary: "#202128b3",
          Tertiary: "#20212880",
          Quaternary: "#2021284d",
        },
        Dark: {
          Primary: "#f4f4f5",
          Secondary: "#f4f4f5b3",
          Tertiary: "#f4f4f580",
          Quaternary: "#f4f4f54d",
        },
      },
      Inverted: {
        // 70%, 50%, 30% each
        Light: {
          Primary: "#f4f4f5",
          Secondary: "#f4f4f5b3",
          Tertiary: "#f4f4f580",
          Quaternary: "#f4f4f54d",
        },
        Dark: {
          Primary: "#202128",
          Secondary: "#202128b3",
          Tertiary: "#20212880",
          Quaternary: "#2021284d",
        },
      },
    },
    Line: {
      Light: {
        Divider: "#797b8a29", // 16% alpha
        Outline: "#797b8a1f", // 12% alpha
      },
      Dark: {
        Divider: "#797b8a52", // 32% alpha
        Outline: "#797b8a3d", // 24% alpha
      },
    },
    Components: {
      Fill: {
        Standard: {
          Light: {
            Primary: "#fefeff",
            Secondary: "#fafafa",
            Tertiary: "#f4f4f5",
          },
          Dark: {
            Primary: "#131314",
            Secondary: "#161617",
            Tertiary: "#1b1b1d",
          },
        },
        Inverted: {
          Light: {
            Primary: "#131314",
            Secondary: "#161617",
            Tertiary: "#1b1b1d",
          },
          Dark: {
            Primary: "#fefeff",
            Secondary: "#fafafa",
            Tertiary: "#f4f4f5",
          },
        },
      },
      Interaction: {
        Light: {
          Hover: "#20212814", // 8% alpha
          Focussed: "#2021281f", // 12% alpha
          Pressed: "#20212829", // 16% alpha
        },
        Dark: {
          Hover: "#f4f4f514", // 8% alpha
          Focussed: "#f4f4f51f", // 12% alpha
          Pressed: "#f4f4f529", // 16% alpha
        },
      },
      Translucent: {
        Light: {
          Primary: "#484f8a29", // 16% alpha
          Secondary: "#484f8a14", // 8% alpha
          Tertiary: "#484f8a0f", // 6% alpha
          Interactive: "#fefefff5", // 96% alpha
        },
        Dark: {
          Primary: "#74768a3d", // 24% alpha
          Secondary: "#72768a2e", // 18% alpha
          Tertiary: "#74768a29", // 16% alpha
          Interactive: "#fefeff1f", // 12% alpha
        },
      },
    },
    Core: {
      Brand: {
        Light: {
          Primary: "#e83c77",
          Tertiary: "#e83c7780", // 50% alpha
          Secondary: "#e83c771a", // 10% alpha
        },
        Dark: {
          Primary: "#e83c77",
          Tertiary: "#e83c7780", // 50%
          Secondary: "#e83c7734", // 20% alpha
        },
      },
      Status: {
        Positive: "#32cc58", // ref: Solid/Green
        Warning: "#f5c905", // ref: Solid/Yellow
        Negative: "#ff4035", // ref: Solid/Red
        Translucent: {
          Positive: "#32cc581a", // ref: Solid/Translucent/Green
          Warning: "#f5c9051a", // ref: Solid/Translucent/Yello
          Negative: "#ff40351a", // ref: Solid/Translucent/Red
        },
      },
    },
    Calendar: {
      Exam: "#5b59de",
      Home: "#32cc58",
      Vacation: "#057fff",
      Event: "#f5c905",
      Stay: "#ff4035",
    },
  },
  Component: {
    Radius: {
      100: "4px",
      200: "6px",
      300: "8px",
      400: "12px",
      500: "14px",
      600: "16px",
      700: "20px",
      800: "24px",
      circle: "1000px",
    },
    Spacing: {
      50: "2px",
      100: "4px",
      150: "6px",
      200: "8px",
      300: "12px",
      400: "16px",
      500: "20px",
      550: "24px",
      600: "28px",
      700: "32px",
      750: "36px",
      800: "40px",
      850: "48px",
      900: "64px",
      950: "72px",
      1000: "80px",
    },
  },
  Font: {
    Display: { size: "3rem", lineHeight: "70px", weight: { weak: 400, regular: 500, strong: 600 } },
    Title: { size: "1.5rem", lineHeight: "34px", weight: { weak: 400, regular: 500, strong: 600 } },
    Headline: {
      size: "1.25rem",
      lineHeight: "28px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
    Body: { size: "1rem", lineHeight: "24px", weight: { weak: 400, regular: 500, strong: 600 } },
    Callout: {
      size: "1.1rem",
      lineHeight: "20px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
    Footnote: {
      size: "0.75rem",
      lineHeight: "18px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
    Caption: {
      size: "0.625rem",
      lineHeight: "14px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
    Paragraph_Large: {
      size: "1rem",
      lineHeight: "28.8px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
    Paragraph_Small: {
      size: "0.875rem",
      lineHeight: "24px",
      weight: { weak: 400, regular: 500, strong: 600 },
    },
  },
};

export const lightTheme = {
  ...base,
  Colors: {
    Solid: {
      ...base.Colors.Solid,
      Translucent: base.Colors.Solid.Translucent.Light,
    },
    Background: {
      Standard: base.Colors.Background.Standard.Light,
      Inverted: base.Colors.Background.Inverted.Light,
    },
    Content: {
      Standard: base.Colors.Content.Standard.Light,
      Inverted: base.Colors.Content.Inverted.Light,
    },
    Line: base.Colors.Line.Light,
    Components: {
      Fill: {
        Standard: base.Colors.Components.Fill.Standard.Light,
        Inverted: base.Colors.Components.Fill.Inverted.Light,
      },
      Interaction: base.Colors.Components.Interaction.Light,
      Translucent: base.Colors.Components.Translucent.Light,
    },
    Core: {
      ...base.Colors.Core,
      Brand: base.Colors.Core.Brand.Light,
    },
    Calendar: base.Colors.Calendar,
  },
};

export const darkTheme = {
  ...base,
  Colors: {
    Solid: {
      ...base.Colors.Solid,
      Translucent: base.Colors.Solid.Translucent.Dark,
    },
    Background: {
      Standard: base.Colors.Background.Standard.Dark,
      Inverted: base.Colors.Background.Inverted.Dark,
    },
    Content: {
      Standard: base.Colors.Content.Standard.Dark,
      Inverted: base.Colors.Content.Inverted.Dark,
    },
    Line: base.Colors.Line.Dark,
    Components: {
      Fill: {
        Standard: base.Colors.Components.Fill.Standard.Dark,
        Inverted: base.Colors.Components.Fill.Inverted.Dark,
      },
      Interaction: base.Colors.Components.Interaction.Dark,
      Translucent: base.Colors.Components.Translucent.Dark,
    },
    Core: {
      ...base.Colors.Core,
      Brand: base.Colors.Core.Brand.Dark,
    },
    Calendar: base.Colors.Calendar,
  },
};

export type AppTheme = typeof lightTheme;
