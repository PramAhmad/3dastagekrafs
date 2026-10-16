export type AssemblyFamily =
  | "four_wall_tuck_carton"
  | "rigid_set"
  | "food_clamshell"
  | "flexible_gusset_pouch"
  | "tapered_cup_sleeve"
  | "circular_tube"
  | "open_tray"
  | "food_formed_carton"
  | "gable_carton"
  | "faceted_tube"
  | "tapered_cup"
  | "rolled_wall_mailer"
  | "curved_pillow_carton"
  | "rsc_corrugated"
  | "film_seal_and_deformation"
  | "flat_sheet_or_curved_label_wrap"

export interface AssemblyPreviewSpec {
  family: AssemblyFamily
  dimensions: Record<string, number | Record<string, number>>
}

export const DIELINE_ASSEMBLY_CATALOG: Record<string, AssemblyPreviewSpec> = {
  "auto-lock-bottom": { family: "four_wall_tuck_carton", dimensions: { L: 90, W: 40, H: 140 } },
  "book-box": { family: "rigid_set", dimensions: { wrapperL: 372, wrapperW: 149, tray: { L: 146, W: 106, H: 24 } } },
  "burger-box": { family: "food_clamshell", dimensions: { L: 128, W: 128, H: 54, lidHeight: 48 } },
  "burger-clamshell": { family: "food_clamshell", dimensions: { L: 128, W: 128, H: 54, lidHeight: 48 } },
  "coffee-bag": { family: "flexible_gusset_pouch", dimensions: { filmWidth: 135, panelHeight: 205, bottomGusset: 50 } },
  "cup-sleeve": { family: "tapered_cup_sleeve", dimensions: { topOuterDiameter: 90, bottomOuterDiameter: 79, wallHeight: 55 } },
  cyl: { family: "circular_tube", dimensions: { outerDiameter: 75, H: 125 } },
  drawer: { family: "rigid_set", dimensions: { tray: { L: 140, W: 95, H: 35 }, sleeveClearance: 3 } },
  "food-tray": { family: "open_tray", dimensions: { L: 175, W: 110, H: 42 } },
  "fries-box": { family: "food_formed_carton", dimensions: { L: 85, W: 45, H: 110 } },
  "gable-box": { family: "gable_carton", dimensions: { L: 125, W: 85, H: 105, roofExtraHeight: 69 } },
  "hanger-box": { family: "four_wall_tuck_carton", dimensions: { L: 90, W: 40, H: 140 } },
  hex: { family: "faceted_tube", dimensions: { nominalDiameter: 75, H: 125 } },
  "ice-cream-tub": { family: "tapered_cup", dimensions: { topOuterDiameter: 105, bottomOuterDiameter: 88, H: 74 } },
  lidbase: { family: "rigid_set", dimensions: { base: { L: 140, W: 95, H: 35 }, lid: { L: 145, W: 100, H: 28 } } },
  mailer: { family: "rolled_wall_mailer", dimensions: { L: 220, W: 150, H: 55 } },
  "paper-cup": { family: "tapered_cup", dimensions: { topOuterDiameter: 90, bottomOuterDiameter: 62, H: 110 } },
  "paper-cup-packaging": { family: "tapered_cup", dimensions: { topOuterDiameter: 90, bottomOuterDiameter: 62, H: 110 } },
  "pillow-box": { family: "curved_pillow_carton", dimensions: { L: 130, W: 75, H: 42 } },
  "pizza-box": { family: "rolled_wall_mailer", dimensions: { L: 300, W: 300, H: 42 } },
  rte: { family: "four_wall_tuck_carton", dimensions: { L: 90, W: 40, H: 140 } },
  "shipping-box": { family: "rsc_corrugated", dimensions: { L: 250, W: 160, H: 140 } },
  "sleeve-tray": { family: "rigid_set", dimensions: { tray: { L: 155, W: 98, H: 28 }, sleeveClearance: 3 } },
  "spout-pouch": { family: "flexible_gusset_pouch", dimensions: { filmWidth: 125, panelHeight: 180, bottomGusset: 34 } },
  "standup-pouch": { family: "flexible_gusset_pouch", dimensions: { filmWidth: 140, panelHeight: 210, bottomGusset: 46 } },
  ste: { family: "four_wall_tuck_carton", dimensions: { L: 90, W: 40, H: 140 } },
  "window-carton": { family: "four_wall_tuck_carton", dimensions: { L: 90, W: 40, H: 140 } },
  "pillow-pack": { family: "film_seal_and_deformation", dimensions: { L: 140, W: 55, H: 120 } },
  "flat-sachet": { family: "film_seal_and_deformation", dimensions: { L: 95, W: 12, H: 150 } },
  "business-card": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 90, W: 0.35, H: 55 } },
  "can-label": { family: "flat_sheet_or_curved_label_wrap", dimensions: { outerDiameter: 66.5, H: 115 } },
  "certificate-a4": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 297, W: 0.2, H: 210 } },
  "flyer-a5": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 148, W: 0.15, H: 210 } },
  "jar-label": { family: "flat_sheet_or_curved_label_wrap", dimensions: { outerDiameter: 65, H: 65 } },
  "bottle-label": { family: "flat_sheet_or_curved_label_wrap", dimensions: { outerDiameter: 70, H: 90 } },
  "bottle-label-packaging": { family: "flat_sheet_or_curved_label_wrap", dimensions: { outerDiameter: 70, H: 90 } },
  letterhead: { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 210, W: 0.1, H: 297 } },
  "mousepad-mockup": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 230, W: 3, H: 200 } },
  "postcard-a6": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 148, W: 0.4, H: 105 } },
  "poster-a3": { family: "flat_sheet_or_curved_label_wrap", dimensions: { L: 297, W: 0.15, H: 420 } },
}

export function getAssemblyPreviewSpec(modelId?: string): AssemblyPreviewSpec | undefined {
  return modelId ? DIELINE_ASSEMBLY_CATALOG[modelId] : undefined
}
