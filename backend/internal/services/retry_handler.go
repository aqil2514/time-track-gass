// backend/internal/services/retry_handler.go
package services

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

type Worker struct {
	id          int
	queue       *RetryQueueService
	interval    time.Duration
	stopCh      chan struct{}
	stopOnce    sync.Once
	wg          sync.WaitGroup
	running     bool
	mu          sync.RWMutex
}

func NewWorker(id int, queue *RetryQueueService, interval time.Duration) *Worker {
	return &Worker{
		id:       id,
		queue:    queue,
		interval: interval,
		stopCh:   make(chan struct{}),
	}
}

// Start begins the worker's processing loop
func (w *Worker) Start(ctx context.Context) {
	w.mu.Lock()
	if w.running {
		w.mu.Unlock()
		return
	}
	w.running = true
	w.mu.Unlock()

	w.wg.Add(1)
	go w.run(ctx)
	log.Printf("[WORKER-%d] Started\n", w.id)
}

// Stop gracefully stops the worker
func (w *Worker) Stop() {
	w.mu.Lock()
	if !w.running {
		w.mu.Unlock()
		return
	}
	w.running = false
	w.mu.Unlock()

	w.stopOnce.Do(func() {
		close(w.stopCh)
	})
	w.wg.Wait()
	log.Printf("[WORKER-%d] Stopped\n", w.id)
}

// IsRunning returns whether the worker is currently running
func (w *Worker) IsRunning() bool {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.running
}

// run is the main worker loop
func (w *Worker) run(ctx context.Context) {
	defer w.wg.Done()

	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	// Initial tick
	w.processTick(ctx)

	for {
		select {
		case <-ticker.C:
			w.processTick(ctx)

		case <-w.stopCh:
			log.Printf("[WORKER-%d] Received stop signal\n", w.id)
			return

		case <-ctx.Done():
			log.Printf("[WORKER-%d] Context canceled\n", w.id)
			return
		}
	}
}

// processTick processes one task per tick
func (w *Worker) processTick(ctx context.Context) {
	// Try to claim a task
	task, err := w.queue.ClaimTask(ctx)
	if err != nil {
		log.Printf("[WORKER-%d] Error claiming task: %v\n", w.id, err)
		return
	}

	if task == nil {
		// No tasks available
		return
	}

	log.Printf("[WORKER-%d] Processing task %s (type: %s, attempt: %d/%d)\n",
		w.id, task.ID, task.TaskType, task.Attempt+1, task.MaxAttempts)

	// Process the task
	processErr := w.queue.ProcessTask(ctx, task)

	if processErr != nil {
		// Task failed, schedule retry
		failErr := w.queue.FailTask(ctx, task.ID, processErr.Error(), task.Attempt+1)
		if failErr != nil {
			log.Printf("[WORKER-%d] Error marking task as failed: %v\n", w.id, failErr)
		}
	} else {
		// Task succeeded
		completeErr := w.queue.CompleteTask(ctx, task.ID)
		if completeErr != nil {
			log.Printf("[WORKER-%d] Error completing task: %v\n", w.id, completeErr)
		}
	}
}

type WorkerPool struct {
	workers []*Worker
	queue   *RetryQueueService
	mu      sync.RWMutex
}

func NewWorkerPool(queue *RetryQueueService, numWorkers int, interval time.Duration) *WorkerPool {
	workers := make([]*Worker, numWorkers)
	for i := 0; i < numWorkers; i++ {
		workers[i] = NewWorker(i+1, queue, interval)
	}

	return &WorkerPool{
		workers: workers,
		queue:   queue,
	}
}

// Start starts all workers in the pool
func (p *WorkerPool) Start(ctx context.Context) {
	p.mu.Lock()
	defer p.mu.Unlock()

	log.Printf("[WORKER-POOL] Starting %d workers\n", len(p.workers))
	for _, w := range p.workers {
		w.Start(ctx)
	}
}

// Stop stops all workers in the pool
func (p *WorkerPool) Stop() {
	p.mu.Lock()
	defer p.mu.Unlock()

	log.Printf("[WORKER-POOL] Stopping %d workers\n", len(p.workers))
	for _, w := range p.workers {
		w.Stop()
	}
}

// Shutdown gracefully shuts down all workers with timeout
func (p *WorkerPool) Shutdown(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	log.Printf("[WORKER-POOL] Shutting down %d workers\n", len(p.workers))

	// Stop all workers
	for _, w := range p.workers {
		w.Stop()
	}

	// Wait for all workers to finish or timeout
	done := make(chan struct{})
	go func() {
		for _, w := range p.workers {
			w.wg.Wait()
		}
		close(done)
	}()

	select {
	case <-done:
		log.Printf("[WORKER-POOL] All workers shut down cleanly\n")
		return nil
	case <-ctx.Done():
		return fmt.Errorf("shutdown timeout: %w", ctx.Err())
	}
}

// GetActiveWorkerCount returns the number of active workers
func (p *WorkerPool) GetActiveWorkerCount() int {
	p.mu.RLock()
	defer p.mu.RUnlock()

	count := 0
	for _, w := range p.workers {
		if w.IsRunning() {
			count++
		}
	}
	return count
}

// GetStats returns pool statistics
func (p *WorkerPool) GetStats(ctx context.Context) (*WorkerPoolStats, error) {
	queueStats, err := p.queue.GetQueueStats(ctx)
	if err != nil {
		return nil, err
	}

	return &WorkerPoolStats{
		ActiveWorkers:  p.GetActiveWorkerCount(),
		TotalWorkers:   len(p.workers),
		QueueStats:     queueStats,
	}, nil
}

type WorkerPoolStats struct {
	ActiveWorkers int         `json:"active_workers"`
	TotalWorkers  int         `json:"total_workers"`
	QueueStats    *QueueStats `json:"queue_stats"`
}

// StartCleanupJob starts a periodic cleanup job for dead letters
// Returns a done channel that closes when the job exits
func StartCleanupJob(ctx context.Context, queue *RetryQueueService, interval time.Duration) chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		log.Printf("[CLEANUP] Started cleanup job (interval: %v)\n", interval)

		for {
			select {
			case <-ticker.C:
				if err := queue.CleanupDeadLetters(ctx); err != nil {
					log.Printf("[CLEANUP] Error: %v\n", err)
				}

			case <-ctx.Done():
				log.Printf("[CLEANUP] Stopped cleanup job\n")
				return
			}
		}
	}()
	return done
}

// StartRecoveryJob starts a periodic recovery job for stuck tasks
// Returns a done channel that closes when the job exits
func StartRecoveryJob(ctx context.Context, queue *RetryQueueService, interval time.Duration, stuckTaskThreshold time.Duration) chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		log.Printf("[RECOVERY] Started recovery job (interval: %v, threshold: %v)\n", interval, stuckTaskThreshold)

		for {
			select {
			case <-ticker.C:
				if err := queue.RecoverStuckTasks(ctx, stuckTaskThreshold); err != nil {
					log.Printf("[RECOVERY] Error: %v\n", err)
				}

			case <-ctx.Done():
				log.Printf("[RECOVERY] Stopped recovery job\n")
				return
			}
		}
	}()
	return done
}
