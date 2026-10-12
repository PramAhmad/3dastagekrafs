package stl_test

import (
	"bytes"
	"encoding/binary"
	"math"
	"testing"

	"3dkemasansaas/pkg/stl"
)

// Helper to construct a synthetic 10x10x10 mm binary STL cube
func createSyntheticBinarySTLCube() []byte {
	buf := new(bytes.Buffer)
	// 80 bytes header
	header := make([]byte, 80)
	copy(header, "Antigravity 3D Packaging STL Generator Test")
	buf.Write(header)

	// 12 triangles for a cube
	numTriangles := uint32(12)
	_ = binary.Write(buf, binary.LittleEndian, numTriangles)

	type triDef struct {
		v1, v2, v3 [3]float32
	}

	triangles := []triDef{
		// Top face (Z = 10)
		{v1: [3]float32{0, 0, 10}, v2: [3]float32{10, 0, 10}, v3: [3]float32{10, 10, 10}},
		{v1: [3]float32{0, 0, 10}, v2: [3]float32{10, 10, 10}, v3: [3]float32{0, 10, 10}},
		// Bottom face (Z = 0)
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{10, 10, 0}, v3: [3]float32{10, 0, 0}},
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{0, 10, 0}, v3: [3]float32{10, 10, 0}},
		// Front face (Y = 0)
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{10, 0, 0}, v3: [3]float32{10, 0, 10}},
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{10, 0, 10}, v3: [3]float32{0, 0, 10}},
		// Back face (Y = 10)
		{v1: [3]float32{0, 10, 0}, v2: [3]float32{10, 10, 10}, v3: [3]float32{10, 10, 0}},
		{v1: [3]float32{0, 10, 0}, v2: [3]float32{0, 10, 10}, v3: [3]float32{10, 10, 10}},
		// Left face (X = 0)
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{0, 0, 10}, v3: [3]float32{0, 10, 10}},
		{v1: [3]float32{0, 0, 0}, v2: [3]float32{0, 10, 10}, v3: [3]float32{0, 10, 0}},
		// Right face (X = 10)
		{v1: [3]float32{10, 0, 0}, v2: [3]float32{10, 10, 10}, v3: [3]float32{10, 0, 10}},
		{v1: [3]float32{10, 0, 0}, v2: [3]float32{10, 10, 0}, v3: [3]float32{10, 10, 10}},
	}

	for _, t := range triangles {
		// Normal (0, 0, 0)
		_ = binary.Write(buf, binary.LittleEndian, [3]float32{0, 0, 0})
		_ = binary.Write(buf, binary.LittleEndian, t.v1)
		_ = binary.Write(buf, binary.LittleEndian, t.v2)
		_ = binary.Write(buf, binary.LittleEndian, t.v3)
		_ = binary.Write(buf, binary.LittleEndian, uint16(0)) // attribute
	}

	return buf.Bytes()
}

func TestParseBinarySTLCube(t *testing.T) {
	cubeBytes := createSyntheticBinarySTLCube()
	stats, err := stl.ParseSTL(bytes.NewReader(cubeBytes))
	if err != nil {
		t.Fatalf("Failed to parse binary STL: %v", err)
	}

	if stats.TriangleCount != 12 {
		t.Errorf("Expected 12 triangles, got %d", stats.TriangleCount)
	}

	// 10x10x10 mm cube volume is exactly 1000 mm3 = 1.0 cm3
	expectedVolCM3 := 1.0
	if math.Abs(stats.VolumeCM3-expectedVolCM3) > 0.05 {
		t.Errorf("Expected volume ~%f cm3, got %f", expectedVolCM3, stats.VolumeCM3)
	}

	if stats.BoundingBox.SizeX != 10 || stats.BoundingBox.SizeY != 10 || stats.BoundingBox.SizeZ != 10 {
		t.Errorf("Expected bounding box 10x10x10, got %fx%fx%f",
			stats.BoundingBox.SizeX, stats.BoundingBox.SizeY, stats.BoundingBox.SizeZ)
	}

	if !stats.IsWatertight {
		t.Errorf("Expected watertight to be true")
	}
}
