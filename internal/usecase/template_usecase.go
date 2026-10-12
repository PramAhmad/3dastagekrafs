package usecase

import (
	"errors"
	"fmt"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/parametric"
	"3dkemasansaas/pkg/stl"
)

var StandardPackagingCatalog = []domain.PackagingTemplate{
	{
		ID:          "box_rectangular_v1",
		Name:        "Kotak Persegi (Mailer & Shipping Box)",
		Category:    domain.CategoryBox,
		Description: "Kemasan kotak kardus / art paper universal untuk e-commerce, sabun, parfum, atau produk UMKM.",
		PreviewURL:  "/presets/box_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"length_mm":         {MinMM: 30, MaxMM: 200, Default: 65, StepMM: 1},
			"width_mm":          {MinMM: 25, MaxMM: 150, Default: 45, StepMM: 1},
			"height_mm":         {MinMM: 20, MaxMM: 150, Default: 35, StepMM: 1},
			"wall_thickness_mm": {MinMM: 1.2, MaxMM: 5.0, Default: 1.6, StepMM: 0.2},
		},
		DefaultDimensions: map[string]float64{
			"length_mm": 65, "width_mm": 45, "height_mm": 35, "wall_thickness_mm": 1.6,
		},
	},
	{
		ID:          "pouch_standing_v1",
		Name:        "Standing Pouch Zipper (Kemasan Snack & Kopi)",
		Category:    domain.CategoryPouch,
		Description: "Kantong kemasan berdiri fleksibel dengan segel zipper press-to-close untuk makanan ringan, bubuk, dan biji kopi.",
		PreviewURL:  "/presets/pouch_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"length_mm": {MinMM: 60, MaxMM: 180, Default: 90, StepMM: 1},
			"width_mm":  {MinMM: 20, MaxMM: 80, Default: 40, StepMM: 1},
			"height_mm": {MinMM: 80, MaxMM: 220, Default: 130, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"length_mm": 90, "width_mm": 40, "height_mm": 130,
		},
	},
	{
		ID:          "jar_cosmetic_v1",
		Name:        "Toples Kosmetik Silinder (Cream & Balm Jar)",
		Category:    domain.CategoryJar,
		Description: "Wadah silinder dengan tutup ulir rapat untuk krim wajah, skincare, lulur, atau pomade.",
		PreviewURL:  "/presets/jar_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"radius_mm":         {MinMM: 15, MaxMM: 80, Default: 25, StepMM: 1},
			"height_mm":         {MinMM: 15, MaxMM: 120, Default: 35, StepMM: 1},
			"wall_thickness_mm": {MinMM: 1.2, MaxMM: 4.0, Default: 1.8, StepMM: 0.2},
		},
		DefaultDimensions: map[string]float64{
			"radius_mm": 25, "height_mm": 35, "wall_thickness_mm": 1.8,
		},
	},
	{
		ID:          "bottle_pump_v1",
		Name:        "Botol Pump Kosmetik (Serum & Lotion Bottle)",
		Category:    domain.CategoryBottle,
		Description: "Botol silinder modern dengan dispenser head untuk serum kecantikan, sabun cair, lotion, dan sanitizer.",
		PreviewURL:  "/presets/bottle_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"radius_mm": {MinMM: 15, MaxMM: 50, Default: 20, StepMM: 1},
			"height_mm": {MinMM: 60, MaxMM: 180, Default: 110, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"radius_mm": 20, "height_mm": 110,
		},
	},
	{
		ID:          "can_tin_v1",
		Name:        "Kaleng Tin Canister (Kemasan Teh & Biskuit)",
		Category:    domain.CategoryCan,
		Description: "Tabung kaleng bulat metalik vintage dengan tutup timbul untuk teh artisan, kopi kaleng, biskuit, dan lilin aromaterapi.",
		PreviewURL:  "/presets/can_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"radius_mm": {MinMM: 20, MaxMM: 70, Default: 30, StepMM: 1},
			"height_mm": {MinMM: 40, MaxMM: 160, Default: 80, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"radius_mm": 30, "height_mm": 80,
		},
	},
	{
		ID:          "box_triangle_v1",
		Name:        "Kotak Prisma Segitiga (Cake Slice & Toblerone Box)",
		Category:    domain.CategoryTriangle,
		Description: "Kemasan prisma 3 sisi geometris untuk cokelat batangan, slice cake, aksesoris, dan souvenir premium.",
		PreviewURL:  "/presets/triangle_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"length_mm": {MinMM: 40, MaxMM: 180, Default: 80, StepMM: 1},
			"width_mm":  {MinMM: 30, MaxMM: 100, Default: 45, StepMM: 1},
			"height_mm": {MinMM: 25, MaxMM: 100, Default: 40, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"length_mm": 80, "width_mm": 45, "height_mm": 40,
		},
	},
	{
		ID:          "cup_coffee_v1",
		Name:        "Paper Cup Kopi (Coffee & Beverage Cup)",
		Category:    domain.CategoryCup,
		Description: "Gelas kertas kerucut dengan tutup plastik lid untuk kafe, boba, kopi susu, dan minuman dingin/hangat.",
		PreviewURL:  "/presets/cup_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"radius_mm": {MinMM: 25, MaxMM: 55, Default: 35, StepMM: 1},
			"height_mm": {MinMM: 60, MaxMM: 160, Default: 100, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"radius_mm": 35, "height_mm": 100,
		},
	},
	{
		ID:          "box_pillow_v1",
		Name:        "Pillow Box Bantal (Kemasan Hijab & Aksesoris)",
		Category:    domain.CategoryPillow,
		Description: "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab, perhiasan, dasi, dan gift packaging.",
		PreviewURL:  "/presets/pillow_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"length_mm": {MinMM: 50, MaxMM: 200, Default: 100, StepMM: 1},
			"width_mm":  {MinMM: 30, MaxMM: 120, Default: 60, StepMM: 1},
			"height_mm": {MinMM: 15, MaxMM: 60, Default: 25, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"length_mm": 100, "width_mm": 60, "height_mm": 25,
		},
	},
	{
		ID:          "pouch_sealer_clip_v1",
		Name:        "Klip Segel Kemasan (Food Bag Sealer Clip)",
		Category:    domain.CategoryClip,
		Description: "Klip pengunci kedap udara untuk kemasan snack dan biji kopi UMKM.",
		PreviewURL:  "/presets/clip_preview.png",
		IsPrintable: true,
		Constraints: map[string]domain.DimensionConstraint{
			"length_mm": {MinMM: 40, MaxMM: 180, Default: 90, StepMM: 5},
			"width_mm":  {MinMM: 10, MaxMM: 25, Default: 14, StepMM: 1},
		},
		DefaultDimensions: map[string]float64{
			"length_mm": 90, "width_mm": 14,
		},
	},
}

type TemplateUsecase interface {
	GetCatalog() []domain.PackagingTemplate
	GetByID(id string) (*domain.PackagingTemplate, error)
	CreateTemplate(tmpl domain.PackagingTemplate) (*domain.PackagingTemplate, error)
	UpdateTemplate(id string, tmpl domain.PackagingTemplate) (*domain.PackagingTemplate, error)
	DeleteTemplate(id string) error
	GenerateSTL(templateID string, dims map[string]float64) ([]byte, *stl.MeshStats, string, error)
}

type templateUsecase struct {
	generator parametric.Generator
	templates []domain.PackagingTemplate
}

func NewTemplateUsecase(generator parametric.Generator) TemplateUsecase {
	initial := make([]domain.PackagingTemplate, len(StandardPackagingCatalog))
	copy(initial, StandardPackagingCatalog)
	return &templateUsecase{
		generator: generator,
		templates: initial,
	}
}

func (u *templateUsecase) GetCatalog() []domain.PackagingTemplate {
	return u.templates
}

func (u *templateUsecase) GetByID(id string) (*domain.PackagingTemplate, error) {
	for _, t := range u.templates {
		if t.ID == id {
			return &t, nil
		}
	}
	return nil, errors.New("template kemasan tidak ditemukan")
}

func (u *templateUsecase) CreateTemplate(tmpl domain.PackagingTemplate) (*domain.PackagingTemplate, error) {
	if tmpl.ID == "" {
		tmpl.ID = fmt.Sprintf("custom_%s_%d", tmpl.Category, len(u.templates)+1)
	}
	for _, t := range u.templates {
		if t.ID == tmpl.ID {
			return nil, errors.New("ID template sudah digunakan")
		}
	}
	u.templates = append(u.templates, tmpl)
	return &tmpl, nil
}

func (u *templateUsecase) UpdateTemplate(id string, tmpl domain.PackagingTemplate) (*domain.PackagingTemplate, error) {
	for i, t := range u.templates {
		if t.ID == id {
			tmpl.ID = id
			u.templates[i] = tmpl
			return &tmpl, nil
		}
	}
	return nil, errors.New("template kemasan tidak ditemukan")
}

func (u *templateUsecase) DeleteTemplate(id string) error {
	for i, t := range u.templates {
		if t.ID == id {
			u.templates = append(u.templates[:i], u.templates[i+1:]...)
			return nil
		}
	}
	return errors.New("template kemasan tidak ditemukan")
}

func (u *templateUsecase) GenerateSTL(templateID string, dims map[string]float64) ([]byte, *stl.MeshStats, string, error) {
	template, err := u.GetByID(templateID)
	if err != nil {
		return nil, nil, "", err
	}

	switch template.Category {
	case domain.CategoryBox, domain.CategoryTriangle, domain.CategoryPillow, domain.CategoryClip:
		L := dims["length_mm"]
		W := dims["width_mm"]
		H := dims["height_mm"]
		T := dims["wall_thickness_mm"]
		if L <= 0 { L = template.DefaultDimensions["length_mm"] }
		if W <= 0 { W = template.DefaultDimensions["width_mm"] }
		if H <= 0 { H = template.DefaultDimensions["height_mm"] }
		if T <= 0 { T = template.DefaultDimensions["wall_thickness_mm"] }
		if T <= 0 { T = 1.6 }

		stlBytes, stats, err := u.generator.GenerateBox(L, W, H, T)
		filename := fmt.Sprintf("%s_%.0fx%.0fx%.0f.stl", templateID, L, W, H)
		return stlBytes, stats, filename, err

	case domain.CategoryJar, domain.CategoryBottle, domain.CategoryCan, domain.CategoryCup:
		R := dims["radius_mm"]
		H := dims["height_mm"]
		T := dims["wall_thickness_mm"]
		if R <= 0 { R = template.DefaultDimensions["radius_mm"] }
		if H <= 0 { H = template.DefaultDimensions["height_mm"] }
		if T <= 0 { T = template.DefaultDimensions["wall_thickness_mm"] }
		if T <= 0 { T = 1.8 }

		stlBytes, stats, err := u.generator.GenerateCylinderJar(R, H, T, 32)
		filename := fmt.Sprintf("%s_r%.0fxh%.0f.stl", templateID, R, H)
		return stlBytes, stats, filename, err

	default:
		stlBytes, stats, err := u.generator.GenerateBox(60, 40, 30, 1.6)
		return stlBytes, stats, "packaging_custom.stl", err
	}
}
