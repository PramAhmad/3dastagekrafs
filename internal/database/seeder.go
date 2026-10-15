package database

import (
	"log"

	"3dkemasansaas/internal/domain"
	"gorm.io/gorm"
)

// Seed populates the database with initial standard packaging categories and templates
// if the respective tables are empty, eliminating hardcoded flat JSON files.
func Seed(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	// 1. Seed Categories if empty
	var catCount int64
	db.Model(&domain.Category{}).Count(&catCount)
	if catCount == 0 {
		log.Println("[SEED] Memulai seeding master kategori kemasan ke database...")
		defaultCategories := []domain.Category{
			{
				ID:           "BOX",
				Name:         "Kotak / Box",
				Description:  "Kemasan kotak kardus corrugated & art paper universal untuk e-commerce, sabun, dan parfum.",
				ImageURL:     "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 1,
			},
			{
				ID:           "POUCH",
				Name:         "Standing Pouch",
				Description:  "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi dan snack.",
				ImageURL:     "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 2,
			},
			{
				ID:           "JAR",
				Name:         "Toples / Jar",
				Description:  "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, dan lulur.",
				ImageURL:     "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 3,
			},
			{
				ID:           "BOTTLE",
				Name:         "Botol Kosmetik & Pump",
				Description:  "Botol silinder modern dengan dispenser head untuk serum, sabun cair, dan lotion.",
				ImageURL:     "https://images.unsplash.com/photo-1608248597359-598971f114c0?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 4,
			},
			{
				ID:           "CAN",
				Name:         "Kaleng (Tin Can)",
				Description:  "Tabung kaleng metalik vintage dengan tutup timbul untuk teh artisan dan biskuit.",
				ImageURL:     "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 5,
			},
			{
				ID:           "TRIANGLE",
				Name:         "Prisma Segitiga",
				Description:  "Kemasan prisma 3 sisi geometris untuk cokelat batangan dan slice cake.",
				ImageURL:     "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 6,
			},
			{
				ID:           "CUP",
				Name:         "Paper Cup",
				Description:  "Gelas kertas kerucut dengan tutup plastik lid untuk kafe dan minuman.",
				ImageURL:     "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 7,
			},
			{
				ID:           "PILLOW",
				Name:         "Pillow Box",
				Description:  "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab dan gift.",
				ImageURL:     "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 8,
			},
			{
				ID:           "CLIP",
				Name:         "Klip Segel Kemasan",
				Description:  "Klip pengunci kedap udara untuk kemasan plastik snack dan biji kopi UMKM.",
				ImageURL:     "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
				IsActive:     true,
				DisplayOrder: 9,
			},
		}

		for _, cat := range defaultCategories {
			if err := db.Create(&cat).Error; err != nil {
				log.Printf("[WARN] Gagal seed kategori %s: %v", cat.ID, err)
			}
		}
		log.Printf("[SEED] ✓ Berhasil menyimpan %d kategori ke tabel database 'categories'", len(defaultCategories))
	}

	// 2. Seed Templates if empty
	var tmplCount int64
	db.Model(&domain.PackagingTemplate{}).Count(&tmplCount)
	if tmplCount == 0 {
		log.Println("[SEED] Memulai seeding master template kemasan ke database...")
		defaultTemplates := []domain.PackagingTemplate{
			{
				ID:              "box_rectangular_v1",
				Name:            "Kotak Persegi (Mailer Box)",
				Category:        "BOX",
				Description:     "Kemasan kotak kardus corrugated & art paper universal untuk e-commerce, sabun, parfum, dan gift box.",
				IsPrintable:     true,
				Badge:           "Terpopuler",
				DefaultDimsJSON: `{"length_mm":65,"width_mm":45,"height_mm":35,"wall_thickness_mm":1.6}`,
				ConstraintsJSON: `{"length_mm":{"min_mm":30,"max_mm":200,"default_mm":65,"step_mm":1},"width_mm":{"min_mm":25,"max_mm":150,"default_mm":45,"step_mm":1},"height_mm":{"min_mm":20,"max_mm":150,"default_mm":35,"step_mm":1},"wall_thickness_mm":{"min_mm":1.2,"max_mm":5.0,"default_mm":1.6,"step_mm":0.2}}`,
				MaterialsJSON:   `["corrugated","kraft","matte_art","glossy","black_matte","ivory","duplex"]`,
			},
			{
				ID:              "pouch_standing_v1",
				Name:            "Standing Pouch Zipper",
				Category:        "POUCH",
				Description:     "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi, keripik, dan snack UMKM.",
				IsPrintable:     true,
				Badge:           "Favorit Makanan",
				DefaultDimsJSON: `{"length_mm":90,"width_mm":40,"height_mm":130,"wall_thickness_mm":1.6}`,
				ConstraintsJSON: `{"length_mm":{"min_mm":60,"max_mm":180,"default_mm":90,"step_mm":1},"width_mm":{"min_mm":20,"max_mm":80,"default_mm":40,"step_mm":1},"height_mm":{"min_mm":80,"max_mm":220,"default_mm":130,"step_mm":1}}`,
				MaterialsJSON:   `["kraft","glossy","matte_art","metallic_gold","metallic_silver"]`,
			},
			{
				ID:              "jar_cosmetic_v1",
				Name:            "Toples Kosmetik Silinder (Jar)",
				Category:        "JAR",
				Description:     "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, lulur, atau pomade.",
				IsPrintable:     true,
				Badge:           "Skincare & Beauty",
				DefaultDimsJSON: `{"radius_mm":25,"height_mm":35,"wall_thickness_mm":1.8}`,
				ConstraintsJSON: `{"radius_mm":{"min_mm":15,"max_mm":80,"default_mm":25,"step_mm":1},"height_mm":{"min_mm":15,"max_mm":120,"default_mm":35,"step_mm":1},"wall_thickness_mm":{"min_mm":1.2,"max_mm":4.0,"default_mm":1.8,"step_mm":0.2}}`,
				MaterialsJSON:   `["frosted","glossy","matte_art","metallic_gold","black_matte"]`,
			},
			{
				ID:              "bottle_pump_v1",
				Name:            "Botol Pump Serum & Lotion",
				Category:        "BOTTLE",
				Description:     "Botol silinder langsing dengan pompa presisi untuk lotion, serum wajah, toner, dan sanitizer cair.",
				IsPrintable:     true,
				Badge:           "Kosmetik Cair",
				DefaultDimsJSON: `{"radius_mm":20,"height_mm":95,"wall_thickness_mm":1.8}`,
				ConstraintsJSON: `{"radius_mm":{"min_mm":12,"max_mm":50,"default_mm":20,"step_mm":1},"height_mm":{"min_mm":50,"max_mm":180,"default_mm":95,"step_mm":1},"wall_thickness_mm":{"min_mm":1.2,"max_mm":3.5,"default_mm":1.8,"step_mm":0.2}}`,
				MaterialsJSON:   `["glossy","matte_art","frosted","black_matte"]`,
			},
			{
				ID:              "can_tea_v1",
				Name:            "Kaleng Teh & Biskuit (Tin Can)",
				Category:        "CAN",
				Description:     "Tabung kaleng tinplate metalik kedap udara untuk artisan tea, roasted coffee bean, dan kue kering lebaran.",
				IsPrintable:     true,
				Badge:           "Vintage Metal",
				DefaultDimsJSON: `{"radius_mm":35,"height_mm":85,"wall_thickness_mm":1.2}`,
				ConstraintsJSON: `{"radius_mm":{"min_mm":20,"max_mm":70,"default_mm":35,"step_mm":1},"height_mm":{"min_mm":40,"max_mm":160,"default_mm":85,"step_mm":1},"wall_thickness_mm":{"min_mm":0.8,"max_mm":2.5,"default_mm":1.2,"step_mm":0.1}}`,
				MaterialsJSON:   `["metallic","metallic_gold","metallic_silver","matte_art"]`,
			},
		}

		for _, tmpl := range defaultTemplates {
			if err := db.Create(&tmpl).Error; err != nil {
				log.Printf("[WARN] Gagal seed template %s: %v", tmpl.ID, err)
			}
		}
		log.Printf("[SEED] ✓ Berhasil menyimpan %d templates ke tabel database 'packaging_templates'", len(defaultTemplates))
	}

	return nil
}
