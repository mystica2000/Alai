package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"server/internal/config"
	"server/internal/handlers"
	"syscall"
	"time"
)

type Server struct {
	config *config.Config
	http   *http.Server
}

func New(config *config.Config) *Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", corsMiddleware(handlers.Websocket))
	mux.HandleFunc("/recordings/", corsMiddleware(handlers.Recordings))
	mux.HandleFunc("/server_test", corsMiddleware(handlers.ServerTest))

	return &Server{
		config: config,
		http: &http.Server{
			Addr:    ":" + config.Port,
			Handler: mux,
		},
	}
}

func (s *Server) Start() error {
	go func() {
		log.Printf("Server is running at http://localhost:%s/", s.config.Port)
		if err := s.http.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe(): %v", err)
		}
	}()

	return s.gracefulShutdown(s.http)
}

func (s *Server) gracefulShutdown(srv *http.Server) error {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
	return nil
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		allowedOrigins := []string{"http://localhost:5173", "http://localhost:4173"}
		origin := r.Header.Get("Origin")

		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next.ServeHTTP(w, r)
	}
}
