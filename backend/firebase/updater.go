// This file is part of the firebase package and implements a dynamic, concurrent Firestore updater.
// It uses ABCI to query the last block height from the chain, but processes new transactions from the indexer
// to update Firestore in parallel chunks, in the same way the indexer updates itself.
package firebase

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

type BlockRange struct {
	Start int
	End   int
}

// Updater periodically checks the blockchain for new blocks and enqueues Firestore update jobs.
type Updater struct {
	FirestoreClient   *firestore.Client
	LatestBlockHeight int
	Mutex             sync.Mutex
	JobQueue          chan BlockRange
	NumWorkers        int
	MaxChunkSize      int
	MaxSlots          int
}

// NewUpdater creates a new Updater instance.
func NewUpdater(client *firestore.Client) *Updater {
	return &Updater{
		FirestoreClient:   client,
		LatestBlockHeight: model.BlockHeightOnDeploy,
		JobQueue:          make(chan BlockRange, 100), // buffered channel for jobs
		NumWorkers:        2,                          // default, can be changed
		MaxChunkSize:      100,                        // default, can be changed
		MaxSlots:          100,                        // default, can be changed
	}
}

// Start begins the checker and worker goroutines.
func (u *Updater) Start(interval time.Duration) {
	for i := 0; i < u.MaxSlots; i++ {
		go u.worker()
	}

	go func() {
		for {
			u.checkAndEnqueue()
			time.Sleep(interval)
		}
	}()
}

// worker processes update jobs from the queue.
func (u *Updater) worker() {
	for br := range u.JobQueue {
		log.Printf("Worker: updating Firestore from block %d to %d...", br.Start, br.End)
		if err := UpdateFirestoreData(u.FirestoreClient, br.Start, false); err != nil {
			log.Printf("Error updating Firestore data: %v", err)
		}
	}
}

// checkAndEnqueue queries the node for the latest block height and enqueues jobs as needed.
func (u *Updater) checkAndEnqueue() {
	resp, err := http.Get(model.Rpc + "/abci_info")
	if err != nil {
		log.Printf("Error querying abci_info: %v", err)
		return
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading abci_info response: %v", err)
		return
	}

	var abciResp struct {
		Result struct {
			Response struct {
				LastBlockHeight string `json:"LastBlockHeight"`
			} `json:"response"`
		} `json:"result"`
	}
	if err := json.Unmarshal(body, &abciResp); err != nil {
		log.Printf("Error parsing abci_info JSON: %v", err)
		return
	}

	lastBlockHeightStr := abciResp.Result.Response.LastBlockHeight
	lastBlockHeight, err := strconv.Atoi(lastBlockHeightStr)
	if err != nil {
		log.Printf("Error converting LastBlockHeight to int: %v", err)
		return
	}

	u.Mutex.Lock()
	if lastBlockHeight != u.LatestBlockHeight {
		minHeight := u.LatestBlockHeight
		u.LatestBlockHeight = lastBlockHeight
		u.Mutex.Unlock()
		numBlocks := lastBlockHeight - minHeight
		if numBlocks <= 0 {
			return
		}
		maxChunks := u.MaxSlots
		chunkSize := u.MaxChunkSize
		if numBlocks < chunkSize {
			chunkSize = numBlocks
		}
		start := minHeight + 1
		for start <= lastBlockHeight && maxChunks > 0 {
			end := start + chunkSize - 1
			if end > lastBlockHeight {
				end = lastBlockHeight
			}
			u.JobQueue <- BlockRange{Start: start, End: end}
			start = end + 1
			maxChunks--
		}
		log.Printf("Enqueued Firestore update jobs for blocks %d to %d in chunks of %d (max %d workers)", minHeight+1, lastBlockHeight, u.MaxChunkSize, u.MaxSlots)
	} else {
		u.Mutex.Unlock()
	}
}
