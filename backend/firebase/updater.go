package firebase

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"volos-backend/services"

	"cloud.google.com/go/firestore"
)

// Updater periodically checks the blockchain for new blocks and enqueues Firestore update jobs.
type Updater struct {
	FirestoreClient   *firestore.Client
	LatestBlockHeight int
	Mutex             sync.Mutex
	JobQueue          chan int
	NumWorkers        int
}

// NewUpdater creates a new Updater instance.
func NewUpdater(client *firestore.Client) *Updater {
	return &Updater{
		FirestoreClient:   client,
		LatestBlockHeight: services.BlockHeightOnDeploy,
		JobQueue:          make(chan int, 10), // buffered channel for jobs
		NumWorkers:        2,                  // can be increased for more concurrency
	}
}

// Start begins the checker and worker goroutines.
func (u *Updater) Start(interval time.Duration) {
	// Start worker goroutines
	for i := 0; i < u.NumWorkers; i++ {
		go u.worker()
	}
	// Start the checker goroutine
	go func() {
		for {
			u.checkAndEnqueue()
			time.Sleep(interval)
		}
	}()
}

// worker processes update jobs from the queue.
func (u *Updater) worker() {
	for minHeight := range u.JobQueue {
		log.Printf("Worker: updating Firestore from block %d...", minHeight)
		if err := UpdateFirestoreData(u.FirestoreClient, minHeight, false); err != nil {
			log.Printf("Error updating Firestore data: %v", err)
		}
	}
}

// checkAndEnqueue queries the node for the latest block height and enqueues a job if needed.
func (u *Updater) checkAndEnqueue() {
	resp, err := http.Get(services.Rpc + "/abci_info")
	if err != nil {
		log.Printf("Error querying abci_info: %v", err)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
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
		log.Printf("New block detected: %d (prev: %d). Enqueuing Firestore update...", lastBlockHeight, minHeight)
		u.JobQueue <- minHeight
	} else {
		u.Mutex.Unlock()
	}
}
