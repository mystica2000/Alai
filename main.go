package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

type WebRTCMessage struct {
	Type string // "offer" | "answer" | "ice-candidate"
	Message *webrtc.SessionDescription // base64 SDP Message
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("origin") == "http://localhost:5000"
	},
}

func decodeBase64ToSDP(str string, obj *webrtc.SessionDescription) {
	b, err := base64.StdEncoding.DecodeString(str);

	if err != nil {
		log.Print("error on decodeBase64 ",err);
	}

	fmt.Print(b);

}

func handleByMessageType(message WebRTCMessage) {
	if message.Type == "offer" {

	}
}

func serverWs(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Print("upgrade failed :",err);
		return;
	}

	defer c.Close()

	for {
		var webrtcMessage WebRTCMessage
		err := c.ReadJSON(&webrtcMessage);

		if err != nil {
			log.Println("read error: ",err);
			break;
		}

		log.Println("recv message :",webrtcMessage);
		handleByMessageType(webrtcMessage);
	}
}

func main()  {

	http.HandleFunc("/server_test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Server is running"));
	});

	http.HandleFunc("/ws", serverWs);

	fmt.Println("Server is running at http://localhost:8080/");
	err := http.ListenAndServe("0.0.0.0:8080",nil)
	if err != nil {
		panic(err)
	}

}