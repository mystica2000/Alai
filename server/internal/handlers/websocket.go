package handlers

import (
	"log"
	"net/http"
	"server/internal/webrtc"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Websocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Printf("Error during websocket upgrade")
		return
	}

	webrtc.HandleSignalling(conn)

	defer conn.Close()
}
