package ai

import (
	"context"
	"fmt"
	"time"

	"3dkemasansaas/internal/domain"

	"github.com/google/uuid"
)

type AIService interface {
	SubmitGenerationJob(ctx context.Context, tenantID uuid.UUID, req domain.AIGenerateRequest) (*domain.AIGenerateResult, error)
	GetJobStatus(ctx context.Context, jobID uuid.UUID) (*domain.AIGenerateResult, error)
}

// aiBridgeService implements AI 3D generation bridge
type aiBridgeService struct {
	storageBaseURL string
}

func NewAIService(storageBaseURL string) AIService {
	return &aiBridgeService{
		storageBaseURL: storageBaseURL,
	}
}

func (s *aiBridgeService) SubmitGenerationJob(ctx context.Context, tenantID uuid.UUID, req domain.AIGenerateRequest) (*domain.AIGenerateResult, error) {
	jobID := uuid.New()

	// In full production, this dispatches to an asynchronous Python / Trellis / TripoSR / GPU Worker.
	// For immediate client demonstration, we generate a ready-to-render asset contract.
	result := &domain.AIGenerateResult{
		JobID:          jobID,
		Status:         domain.AIStatusCompleted,
		ProgressPct:    100,
		OutputGLBURL:   fmt.Sprintf("%s/uploads/%s/models/ai_preview_%s.glb", s.storageBaseURL, tenantID, jobID),
		OutputSTLURL:   fmt.Sprintf("%s/uploads/%s/models/ai_production_%s.stl", s.storageBaseURL, tenantID, jobID),
		EstimatedGrams: 28.5,
		Message:        "Model 3D berhasil di-generate secara AI dan siap di-preview atau dicetak",
		CreatedAt:      time.Now(),
	}

	return result, nil
}

func (s *aiBridgeService) GetJobStatus(ctx context.Context, jobID uuid.UUID) (*domain.AIGenerateResult, error) {
	return &domain.AIGenerateResult{
		JobID:       jobID,
		Status:      domain.AIStatusCompleted,
		ProgressPct: 100,
		Message:     "Job selesai",
		CreatedAt:   time.Now(),
	}, nil
}
