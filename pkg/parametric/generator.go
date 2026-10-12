package parametric

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"math"

	"3dkemasansaas/pkg/stl"
)

type Generator interface {
	GenerateBox(length, width, height, wallThickness float64) ([]byte, *stl.MeshStats, error)
	GenerateCylinderJar(radius, height, wallThickness float64, segments int) ([]byte, *stl.MeshStats, error)
}

type generator struct{}

func NewGenerator() Generator {
	return &generator{}
}

// Helper to write a triangle in binary STL format
func writeTriangle(buf *bytes.Buffer, v1, v2, v3 [3]float32) {
	// Normal vector (0, 0, 0)
	_ = binary.Write(buf, binary.LittleEndian, [3]float32{0, 0, 0})
	_ = binary.Write(buf, binary.LittleEndian, v1)
	_ = binary.Write(buf, binary.LittleEndian, v2)
	_ = binary.Write(buf, binary.LittleEndian, v3)
	_ = binary.Write(buf, binary.LittleEndian, uint16(0)) // 2 bytes attribute
}

// GenerateBox creates a solid watertight hollow container box with floor and 4 walls (open top)
func (g *generator) GenerateBox(length, width, height, wallThickness float64) ([]byte, *stl.MeshStats, error) {
	if length <= 0 || width <= 0 || height <= 0 || wallThickness <= 0 {
		return nil, nil, fmt.Errorf("dimensi kotak tidak valid")
	}

	L := float32(length)
	W := float32(width)
	H := float32(height)
	T := float32(wallThickness)

	inL := L - 2*T
	inW := W - 2*T
	inH := H - T // bottom floor is T thick

	if inL <= 0 || inW <= 0 || inH <= 0 {
		return nil, nil, fmt.Errorf("ketebalan dinding terlalu besar untuk ukuran kotak ini")
	}

	trianglesBuf := new(bytes.Buffer)
	triangleCount := uint32(0)

	addQuad := func(v1, v2, v3, v4 [3]float32) {
		writeTriangle(trianglesBuf, v1, v2, v3)
		writeTriangle(trianglesBuf, v1, v3, v4)
		triangleCount += 2
	}

	// 1. Outer Bottom Face (Z = 0)
	addQuad([3]float32{0, 0, 0}, [3]float32{L, 0, 0}, [3]float32{L, W, 0}, [3]float32{0, W, 0})

	// 2. Outer 4 Side Walls
	// Front (Y = 0)
	addQuad([3]float32{0, 0, 0}, [3]float32{0, 0, H}, [3]float32{L, 0, H}, [3]float32{L, 0, 0})
	// Back (Y = W)
	addQuad([3]float32{L, W, 0}, [3]float32{L, W, H}, [3]float32{0, W, H}, [3]float32{0, W, 0})
	// Left (X = 0)
	addQuad([3]float32{0, W, 0}, [3]float32{0, W, H}, [3]float32{0, 0, H}, [3]float32{0, 0, 0})
	// Right (X = L)
	addQuad([3]float32{L, 0, 0}, [3]float32{L, 0, H}, [3]float32{L, W, H}, [3]float32{L, W, 0})

	// 3. Top Wall Lip (connecting outer wall to inner wall at Z = H)
	// Front lip
	addQuad([3]float32{0, 0, H}, [3]float32{0, T, H}, [3]float32{L, T, H}, [3]float32{L, 0, H})
	// Back lip
	addQuad([3]float32{0, W - T, H}, [3]float32{0, W, H}, [3]float32{L, W, H}, [3]float32{L, W - T, H})
	// Left lip
	addQuad([3]float32{0, T, H}, [3]float32{0, W - T, H}, [3]float32{T, W - T, H}, [3]float32{T, T, H})
	// Right lip
	addQuad([3]float32{L - T, T, H}, [3]float32{L - T, W - T, H}, [3]float32{L, W - T, H}, [3]float32{L, T, H})

	// 4. Inner Bottom Floor (Z = T)
	addQuad([3]float32{T, T, T}, [3]float32{0 + T, W - T, T}, [3]float32{L - T, W - T, T}, [3]float32{L - T, T, T})

	// 5. Inner 4 Side Walls (facing inside)
	// Inner Front
	addQuad([3]float32{T, T, T}, [3]float32{L - T, T, T}, [3]float32{L - T, T, H}, [3]float32{T, T, H})
	// Inner Back
	addQuad([3]float32{L - T, W - T, T}, [3]float32{T, W - T, T}, [3]float32{T, W - T, H}, [3]float32{L - T, W - T, H})
	// Inner Left
	addQuad([3]float32{T, W - T, T}, [3]float32{T, T, T}, [3]float32{T, T, H}, [3]float32{T, W - T, H})
	// Inner Right
	addQuad([3]float32{L - T, T, T}, [3]float32{L - T, W - T, T}, [3]float32{L - T, W - T, H}, [3]float32{L - T, T, H})

	// Assemble complete binary STL
	stlData := new(bytes.Buffer)
	header := make([]byte, 80)
	copy(header, "Procedural Parametric Box (3D Print Ready) - Kemasan3D SaaS")
	stlData.Write(header)
	_ = binary.Write(stlData, binary.LittleEndian, triangleCount)
	stlData.Write(trianglesBuf.Bytes())

	rawBytes := stlData.Bytes()
	stats, err := stl.ParseSTL(bytes.NewReader(rawBytes))
	if err != nil {
		return nil, nil, err
	}

	return rawBytes, stats, nil
}

// GenerateCylinderJar creates a solid cylindrical cosmetic jar
func (g *generator) GenerateCylinderJar(radius, height, wallThickness float64, segments int) ([]byte, *stl.MeshStats, error) {
	if radius <= 0 || height <= 0 || wallThickness <= 0 {
		return nil, nil, fmt.Errorf("dimensi silinder tidak valid")
	}
	if segments < 16 {
		segments = 32
	}

	R_out := radius
	R_in := radius - wallThickness
	H := height
	T := wallThickness

	if R_in <= 0 || H <= T {
		return nil, nil, fmt.Errorf("ketebalan dinding terlalu besar untuk radius ini")
	}

	trianglesBuf := new(bytes.Buffer)
	triangleCount := uint32(0)

	angleStep := (2 * math.Pi) / float64(segments)

	for i := 0; i < segments; i++ {
		a1 := float64(i) * angleStep
		a2 := float64(i+1) * angleStep

		cos1, sin1 := float32(math.Cos(a1)), float32(math.Sin(a1))
		cos2, sin2 := float32(math.Cos(a2)), float32(math.Sin(a2))

		// Outer bottom vertices
		ob1 := [3]float32{float32(R_out) * cos1, float32(R_out) * sin1, 0}
		ob2 := [3]float32{float32(R_out) * cos2, float32(R_out) * sin2, 0}
		center_b := [3]float32{0, 0, 0}

		// Outer top vertices
		ot1 := [3]float32{float32(R_out) * cos1, float32(R_out) * sin1, float32(H)}
		ot2 := [3]float32{float32(R_out) * cos2, float32(R_out) * sin2, float32(H)}

		// Inner top vertices
		it1 := [3]float32{float32(R_in) * cos1, float32(R_in) * sin1, float32(H)}
		it2 := [3]float32{float32(R_in) * cos2, float32(R_in) * sin2, float32(H)}

		// Inner bottom vertices
		ib1 := [3]float32{float32(R_in) * cos1, float32(R_in) * sin1, float32(T)}
		ib2 := [3]float32{float32(R_in) * cos2, float32(R_in) * sin2, float32(T)}
		center_ib := [3]float32{0, 0, float32(T)}

		// 1. Bottom outer cap
		writeTriangle(trianglesBuf, center_b, ob2, ob1)
		triangleCount++

		// 2. Outer side quad
		writeTriangle(trianglesBuf, ob1, ot1, ot2)
		writeTriangle(trianglesBuf, ob1, ot2, ob2)
		triangleCount += 2

		// 3. Top rim quad
		writeTriangle(trianglesBuf, ot1, it1, it2)
		writeTriangle(trianglesBuf, ot1, it2, ot2)
		triangleCount += 2

		// 4. Inner side quad
		writeTriangle(trianglesBuf, it1, ib1, ib2)
		writeTriangle(trianglesBuf, it1, ib2, it2)
		triangleCount += 2

		// 5. Inner bottom floor
		writeTriangle(trianglesBuf, center_ib, ib1, ib2)
		triangleCount++
	}

	stlData := new(bytes.Buffer)
	header := make([]byte, 80)
	copy(header, "Procedural Cosmetic Jar (3D Print Ready) - Kemasan3D SaaS")
	stlData.Write(header)
	_ = binary.Write(stlData, binary.LittleEndian, triangleCount)
	stlData.Write(trianglesBuf.Bytes())

	rawBytes := stlData.Bytes()
	stats, err := stl.ParseSTL(bytes.NewReader(rawBytes))
	if err != nil {
		return nil, nil, err
	}

	return rawBytes, stats, nil
}
