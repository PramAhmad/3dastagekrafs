package parametric_test

import (
	"testing"

	"3dkemasansaas/pkg/parametric"
)

func TestGenerateBoxSTL(t *testing.T) {
	gen := parametric.NewGenerator()

	// 50 x 50 x 50 mm box with 2mm walls
	stlBytes, stats, err := gen.GenerateBox(50, 50, 50, 2)
	if err != nil {
		t.Fatalf("Failed to generate box STL: %v", err)
	}

	if len(stlBytes) == 0 {
		t.Errorf("Expected STL bytes to not be empty")
	}

	if !stats.IsWatertight {
		t.Errorf("Generated box must be watertight")
	}

	if stats.VolumeCM3 <= 0 {
		t.Errorf("Expected volume > 0, got %f", stats.VolumeCM3)
	}

	if stats.BoundingBox.SizeX != 50 || stats.BoundingBox.SizeY != 50 || stats.BoundingBox.SizeZ != 50 {
		t.Errorf("Bounding box size mismatch: got %fx%fx%f",
			stats.BoundingBox.SizeX, stats.BoundingBox.SizeY, stats.BoundingBox.SizeZ)
	}
}

func TestGenerateCylinderJarSTL(t *testing.T) {
	gen := parametric.NewGenerator()

	// 25mm radius (50mm diameter) x 40mm height jar with 2mm walls
	stlBytes, stats, err := gen.GenerateCylinderJar(25, 40, 2, 32)
	if err != nil {
		t.Fatalf("Failed to generate cylinder jar: %v", err)
	}

	if len(stlBytes) == 0 {
		t.Errorf("Expected STL bytes to not be empty")
	}

	if !stats.IsWatertight {
		t.Errorf("Generated jar must be watertight")
	}
}
