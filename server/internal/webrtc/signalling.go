package webrtc

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

type Message struct {
	Command string          `json:"command"`
	Payload int             `json:"payload"`
	Data    json.RawMessage `json:"data"`
}

type CommandResponse struct {
	Command string `json:"command"`
	Payload int    `json:"payload"`
	Result  string `json:"result"`
}

const (
	CLOSE_CONNECTION_SUCESS = "stop_done_initial_peer_connection"
)

func HandleSignalling(conn *websocket.Conn) {
	var pc *webrtc.PeerConnection

	log.Println("New Peer Connection Created")
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("\n Error reading message: %v", err)
			return
		}

		var message Message

		if err := json.Unmarshal(msg, &message); err != nil {
			log.Printf("\n Error unmarshaling message: %v", err)
			continue
		}

		switch message.Command {
		case "record", "listen":
			log.Printf("Got Command: %s", message.Command)
			if pc != nil {
				StopExistingPeerConnection(pc, conn, 0, message.Command) // Close existing connection
				pc = nil
			}

			pc, err = NewPeerConnection()
			if err != nil {
				log.Printf("Failed to create Peer Connection: %v", err)
				continue
			}

			HandleOffer(pc, message.Command, string(message.Data), conn, message.Payload)

		case "ice-candidate":
			log.Println("Got Command : ICE-CANDIDATE")
			if pc == nil {
				log.Println("No active peer connection")
				continue
			}
			if err := HandleICECandidate(pc, string(message.Data)); err != nil {
				log.Printf("Error handling ICE candidate: %v", err)
			}

		case "stop":
			log.Println("Got Command : STOP")
			StopExistingPeerConnection(pc, conn, 0, "stop")
			pc = nil

		case "play":
			log.Println("Got Command : PLAY -> which closes and returns echos payload")

			StopExistingPeerConnection(pc, conn, message.Payload, "play")
			pc = nil

		default:
			log.Println("Unknown Command")
		}
	}
}

func HandleOffer(pc *webrtc.PeerConnection, from string, sdp string, conn *websocket.Conn, payload int) {

	if from == "record" || from == "listen" {

		pc.OnICECandidate(func(i *webrtc.ICECandidate) {

			log.Println("Got ICECandidate via OnICECandidate")

			if i == nil {
				return
			}

			candidateJSON, err := json.Marshal(i.ToJSON())
			if err != nil {
				log.Printf("\nFailed to marshal ICE candidate: %v", err)
				return
			}

			message := CommandResponse{
				Command: "ice-candidate",
				Result:  string(candidateJSON),
			}

			if err := conn.WriteJSON(message); err != nil {
				log.Printf("\nFailed to send ICE candidate: %v", err)
			}

		})

		var offer webrtc.SessionDescription
		err := json.Unmarshal([]byte(sdp), &offer)
		if err != nil {
			log.Printf("\nFailed to parse SDP: %v", err)
			return
		}

		err = pc.SetRemoteDescription(offer)
		if err != nil {
			log.Printf("\nFailed to Set Remote Description %v", err)
			return
		}

		if from == "listen" {
			_, err = listenFromDisk(pc, payload, conn)

			if err != nil {
				log.Printf("\n Error on Initializing load from disk: %v", err)
			} else {
				log.Printf("\n Initializing load from disk: %v", err)
			}
		}

		answer, err := pc.CreateAnswer(nil)

		if err != nil {
			log.Printf("\nFailed to Create Answer %v", err)
			return
		}

		err = pc.SetLocalDescription(answer)
		if err != nil {
			log.Printf("\nFailed to Set Local Description %v", err)
			return
		}

		b, err := json.Marshal(answer)
		if err != nil {
			log.Printf("\nFailed to Marshal Answer %v", err)
			return
		}

		message := CommandResponse{
			Command: "answer",
			Result:  string(b),
		}

		conn.WriteJSON(message) // return which is answer

		if from == "record" {

			_, err = SaveRecordingToDisk(pc)

			if err != nil {
				log.Printf("\n Error on Initializing save to disk: %v", err)
			} else {
				log.Printf("\n Initializing save to disk: %v", err)
			}

		}

	} else {
		log.Println("Unknown Command - Not Record/Listen")
	}

	// if from == "record" then handle accordingly
	// if from == "listen" then handle accordingly

	// pretty much all steps are same for initializing
	// BUT differs for addTrack, receiveTrack for record/lisen
	// save to disk for one, load from disk for another
}

func HandleICECandidate(pc *webrtc.PeerConnection, candidateStr string) error {
	var candidate webrtc.ICECandidateInit
	err := json.Unmarshal([]byte(candidateStr), &candidate)
	if err != nil {
		return fmt.Errorf("\n failed to parse ICE candidate: %v", err)
	}
	return pc.AddICECandidate(candidate)
}

func StopExistingPeerConnection(pc *webrtc.PeerConnection, conn *websocket.Conn, id int, from string) {
	if pc != nil {
		if closeErr := pc.Close(); closeErr != nil {
			fmt.Printf("Cannot Close Peer Connection: %v", closeErr)
		} else {
			log.Println("Peer connection closed successfully.")
		}
	}

	if from != "stop" { // play

		response := CommandResponse{
			Command: "play_done",
			Payload: id,
			Result:  CLOSE_CONNECTION_SUCESS,
		}

		jsonMessage, err := json.Marshal(response)
		if err != nil {
			log.Println("Error marshaling JSON: ", err)
		} else {
			conn.WriteMessage(websocket.TextMessage, jsonMessage)
		}
	}

	log.Println("Peer connection closed via STOP command")
}
