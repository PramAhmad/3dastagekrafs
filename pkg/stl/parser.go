package stl

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
)

type Vec3 struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type Triangle struct {
	Normal Vec3   `json:"normal"`
	V1     Vec3   `json:"v1"`
	V2     Vec3   `json:"v2"`
	V3     Vec3   `json:"v3"`
}

type MeshStats struct {
	TriangleCount uint32  `json:"triangle_count"`
	VolumeMM3     float64 `json:"volume_mm3"`
	VolumeCM3     float64 `json:"volume_cm3"`
	SurfaceAreaMM2 float64 `json:"surface_area_mm2"`
	BoundingBox   BoundingBox `json:"bounding_box"`
	IsWatertight  bool    `json:"is_watertight"`
}

type BoundingBox struct {
	MinX float64 `json:"min_x"`
	MaxX float64 `json:"max_x"`
	MinY float64 `json:"min_y"`
	MaxY float64 `json:"max_y"`
	MinZ float64 `json:"min_z"`
	MaxZ float64 `json:"max_z"`
	SizeX float64 `json:"size_x_mm"` // Length
	SizeY float64 `json:"size_y_mm"` // Width
	SizeZ float64 `json:"size_z_mm"` // Height
}

// ParseSTL automatically detects whether STL is binary or ASCII and calculates mesh statistics
func ParseSTL(r io.Reader) (*MeshStats, error) {
	// Read first 512 bytes to sniff format
	buf := make([]byte, 512)
	n, err := io.ReadFull(r, buf)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return nil, fmt.Errorf("gagal membaca file STL: %w", err)
	}

	combinedReader := io.MultiReader(bytes.NewReader(buf[:n]), r)

	// Check if ASCII STL (starts with "solid " and does not contain null bytes)
	isASCII := false
	trimmed := strings.TrimSpace(string(buf[:n]))
	if strings.HasPrefix(trimmed, "solid") && !bytes.Contains(buf[:n], []byte{0}) {
		isASCII = true
	}

	if isASCII {
		return parseASCII(combinedReader)
	}
	return parseBinary(combinedReader)
}

func parseBinary(r io.Reader) (*MeshStats, error) {
	// 80 bytes header
	header := make([]byte, 80)
	if _, err := io.ReadFull(r, header); err != nil {
		return nil, errors.New("header binary STL tidak valid")
	}

	// 4 bytes triangle count (little endian)
	var numTriangles uint32
	if err := binary.Read(r, binary.LittleEndian, &numTriangles); err != nil {
		return nil, errors.New("gagal membaca jumlah segitiga STL")
	}

	if numTriangles == 0 {
		return nil, errors.New("file STL kosong (0 segitiga)")
	}

	var totalSignedVolume float64
	var totalSurfaceArea float64

	minX, minY, minZ := math.MaxFloat64, math.MaxFloat64, math.MaxFloat64
	maxX, maxY, maxZ := -math.MaxFloat64, -math.MaxFloat64, -math.MaxFloat64

	// Buffer per triangle = 50 bytes (12 bytes normal + 36 bytes 3 vertices + 2 bytes attribute)
	triangleBuf := make([]byte, 50)

	for i := uint32(0); i < numTriangles; i++ {
		if _, err := io.ReadFull(r, triangleBuf); err != nil {
			return nil, fmt.Errorf("file STL terpotong pada segitiga %d: %w", i, err)
		}

		v1 := Vec3{
			X: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[12:16]))),
			Y: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[16:20]))),
			Z: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[20:24]))),
		}
		v2 := Vec3{
			X: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[24:28]))),
			Y: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[28:32]))),
			Z: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[32:36]))),
		}
		v3 := Vec3{
			X: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[36:40]))),
			Y: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[40:44]))),
			Z: float64(math.Float32frombits(binary.LittleEndian.Uint32(triangleBuf[44:48]))),
		}

		// Update Bounding Box
		for _, v := range []Vec3{v1, v2, v3} {
			if v.X < minX { minX = v.X }
			if v.X > maxX { maxX = v.X }
			if v.Y < minY { minY = v.Y }
			if v.Y > maxY { maxY = v.Y }
			if v.Z < minZ { minZ = v.Z }
			if v.Z > maxZ { maxZ = v.Z }
		}

		// Signed Volume of Tetrahedron: V = (v1 . (v2 x v3)) / 6.0
		crossX := v2.Y*v3.Z - v2.Z*v3.Y
		crossY := v2.Z*v3.X - v2.X*v3.Z
		crossZ := v2.X*v3.Y - v2.Y*v3.X
		signedVol := (v1.X*crossX + v1.Y*crossY + v1.Z*crossZ) / 6.0
		totalSignedVolume += signedVol

		// Triangle Area: || (v2 - v1) x (v3 - v1) || / 2.0
		d12 := Vec3{X: v2.X - v1.X, Y: v2.Y - v1.Y, Z: v2.Z - v1.Z}
		d13 := Vec3{X: v3.X - v1.X, Y: v3.Y - v1.Y, Z: v3.Z - v1.Z}
		cx := d12.Y*d13.Z - d12.Z*d13.Y
		cy := d12.Z*d13.X - d12.X*d13.Z
		cz := d12.X*d13.Y - d12.Y*d13.X
		area := 0.5 * math.Sqrt(cx*cx + cy*cy + cz*cz)
		totalSurfaceArea += area
	}

	volMM3 := math.Abs(totalSignedVolume)
	volCM3 := volMM3 / 1000.0

	return &MeshStats{
		TriangleCount:  numTriangles,
		VolumeMM3:      volMM3,
		VolumeCM3:      volCM3,
		SurfaceAreaMM2: totalSurfaceArea,
		BoundingBox: BoundingBox{
			MinX:  minX,
			MaxX:  maxX,
			MinY:  minY,
			MaxY:  maxY,
			MinZ:  minZ,
			MaxZ:  maxZ,
			SizeX: maxX - minX,
			SizeY: maxY - minY,
			SizeZ: maxZ - minZ,
		},
		IsWatertight: volCM3 > 0.0001,
	}, nil
}

func parseASCII(r io.Reader) (*MeshStats, error) {
	scanner := bufio.NewScanner(r)
	var totalSignedVolume float64
	var totalSurfaceArea float64
	var numTriangles uint32

	minX, minY, minZ := math.MaxFloat64, math.MaxFloat64, math.MaxFloat64
	maxX, maxY, maxZ := -math.MaxFloat64, -math.MaxFloat64, -math.MaxFloat64

	var currentVertices []Vec3

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "vertex") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				x, _ := strconv.ParseFloat(parts[1], 64)
				y, _ := strconv.ParseFloat(parts[2], 64)
				z, _ := strconv.ParseFloat(parts[3], 64)
				v := Vec3{X: x, Y: y, Z: z}
				currentVertices = append(currentVertices, v)

				if v.X < minX { minX = v.X }
				if v.X > maxX { maxX = v.X }
				if v.Y < minY { minY = v.Y }
				if v.Y > maxY { maxY = v.Y }
				if v.Z < minZ { minZ = v.Z }
				if v.Z > maxZ { maxZ = v.Z }
			}
		} else if strings.HasPrefix(line, "endfacet") {
			if len(currentVertices) == 3 {
				v1, v2, v3 := currentVertices[0], currentVertices[1], currentVertices[2]
				numTriangles++

				crossX := v2.Y*v3.Z - v2.Z*v3.Y
				crossY := v2.Z*v3.X - v2.X*v3.Z
				crossZ := v2.X*v3.Y - v2.Y*v3.X
				signedVol := (v1.X*crossX + v1.Y*crossY + v1.Z*crossZ) / 6.0
				totalSignedVolume += signedVol

				d12 := Vec3{X: v2.X - v1.X, Y: v2.Y - v1.Y, Z: v2.Z - v1.Z}
				d13 := Vec3{X: v3.X - v1.X, Y: v3.Y - v1.Y, Z: v3.Z - v1.Z}
				cx := d12.Y*d13.Z - d12.Z*d13.Y
				cy := d12.Z*d13.X - d12.X*d13.Z
				cz := d12.X*d13.Y - d12.Y*d13.X
				area := 0.5 * math.Sqrt(cx*cx + cy*cy + cz*cz)
				totalSurfaceArea += area
			}
			currentVertices = currentVertices[:0]
		}
	}

	volMM3 := math.Abs(totalSignedVolume)
	volCM3 := volMM3 / 1000.0

	return &MeshStats{
		TriangleCount:  numTriangles,
		VolumeMM3:      volMM3,
		VolumeCM3:      volCM3,
		SurfaceAreaMM2: totalSurfaceArea,
		BoundingBox: BoundingBox{
			MinX:  minX,
			MaxX:  maxX,
			MinY:  minY,
			MaxY:  maxY,
			MinZ:  minZ,
			MaxZ:  maxZ,
			SizeX: maxX - minX,
			SizeY: maxY - minY,
			SizeZ: maxZ - minZ,
		},
		IsWatertight: volCM3 > 0.0001,
	}, nil
}
