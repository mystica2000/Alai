package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/pion/interceptor"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media/oggwriter"
)

type Message struct {
	MsgType     string `json:"type"`
	MessageText string `json:"msg,omitempty"`
	IsPaused    bool   `json:"pause,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func createTempFileName() string {

	file, err := os.Open("recordings")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	entries, err := file.Readdirnames(0)
	if err != nil {
		panic(err)
	}

	fname := "recordings/output_" + strconv.Itoa(len(entries)+1) + ".ogg"

	return fname
}

func initializeWebRTCPeer() (*webrtc.PeerConnection, error) {
	fmt.Println("Initializing Peer Connection")

	mediaEngine := &webrtc.MediaEngine{}

	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, err
	}

	i := &interceptor.Registry{}

	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, i); err != nil {
		return nil, err
	}

	api := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine), webrtc.WithInterceptorRegistry(i))

	pc, err := api.NewPeerConnection(webrtc.Configuration{})

	if err != nil {
		return nil, err
	}

	if _, err = pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
		return nil, err
	}

	oggFile, err := oggwriter.New(createTempFileName(), 48000, 2)
	if err != nil {
		panic(err)
	}

	pc.OnTrack(func(tr *webrtc.TrackRemote, r *webrtc.RTPReceiver) {
		codec := tr.Codec()
		fmt.Print(codec)

		if strings.EqualFold(codec.MimeType, webrtc.MimeTypeOpus) {
			fmt.Println("Got opus track, saving to disk as output.opus ")
			saveToDisk(oggFile, tr)
		}
	})

	pc.OnICEConnectionStateChange(func(cs webrtc.ICEConnectionState) {
		fmt.Printf("Connection State has changed %s \n", cs)

		if cs == webrtc.ICEConnectionStateDisconnected || cs == webrtc.ICEConnectionStateFailed {

			if closeError := oggFile.Close(); closeError != nil {
				panic(closeError)
			}

			fmt.Println("Done writing media files")

			// Gracefully shutdown the peer connection
			if closeErr := pc.Close(); closeErr != nil {
				panic(closeErr)
			}

			os.Exit(0)
		}
	})

	return pc, nil
}

func saveToDisk(oggFile *oggwriter.OggWriter, track *webrtc.TrackRemote) {

	for {
		rtpPacket, _, err := track.ReadRTP()
		if err != nil {
			fmt.Println(err)
			return
		}

		if err := oggFile.WriteRTP(rtpPacket); err != nil {
			fmt.Print(err)
			return
		}
	}
}

func decodeBase64ToSDP(str string, obj *webrtc.SessionDescription) {
	fmt.Println("decoding...")

	b, err := base64.StdEncoding.DecodeString(str)

	if err != nil {
		log.Print("error on decodeBase64 ", err)
	}

	if err = json.Unmarshal(b, obj); err != nil {
		panic(err)
	}

}

func encodeSDPtoBase64(obj *webrtc.SessionDescription) string {
	fmt.Println("encoding...")

	b, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}

	return base64.StdEncoding.EncodeToString(b)
}

func serveWS(w http.ResponseWriter, r *http.Request) {

	c, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Print("upgrade failed :", err)
		return
	}

	defer c.Close()

	var pc *webrtc.PeerConnection
	pc, rtcError := initializeWebRTCPeer()
	if rtcError != nil {
		log.Fatal("Failed to initialize WebRTC peer:", err)
	}

	defer func() {
		if closeError := pc.Close(); closeError != nil {
			fmt.Printf("cannot close peerconnection %v\n", closeError)
		}
	}()

	for {

		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read error: ", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Println("JSON unmarshal error: ", err)
			continue
		}

		switch msg.MsgType {
		case "offer":
			{
				offer := webrtc.SessionDescription{}
				decodeBase64ToSDP(string(msg.MessageText), &offer)

				err = pc.SetRemoteDescription(offer)
				if err != nil {
					panic(err)
				}

				answer, err := pc.CreateAnswer(nil)

				if err != nil {
					panic(err)
				}

				// similar to onIceCandidate call on the browser
				gatherComplete := webrtc.GatheringCompletePromise(pc)

				err = pc.SetLocalDescription(answer)
				if err != nil {
					panic(err)
				}

				<-gatherComplete

				encodedSDP := encodeSDPtoBase64(pc.LocalDescription())
				c.WriteMessage(mt, []byte(encodedSDP)) // return answer
			}
		default:
			{
				log.Println("No Message!!")
			}
		}

	}
}

func extractNumber(name string) int {
	parts := strings.Split(name, "_")
	if len(parts) > 1 {
		var num int

		fmt.Sscanf(parts[1], "%d", &num)
		return num
	}
	return 0
}

func handleGetRecordings(w http.ResponseWriter) {

	file, err := os.Open("recordings")
	if err != nil {
		http.Error(w, "Could not open recordings directory", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	entries, err := file.Readdirnames(0)
	if err != nil {
		http.Error(w, "Could not read recordings", http.StatusInternalServerError)
		return
	}

	var recordings []string

	for _, entry := range entries {
		if strings.HasSuffix(entry, ".ogg") {
			nameWithoutExtension := strings.TrimSuffix(entry, filepath.Ext(entry))
			recordings = append(recordings, nameWithoutExtension)
		}
	}

	sort.Slice(recordings, func(i, j int) bool {
		return extractNumber(recordings[i]) < extractNumber(recordings[j])
	})

	response := map[string][]string{
		"recordings": recordings,
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode recordings to JSON", http.StatusInternalServerError)
		return
	}
}

func handleDeleteRecording(w http.ResponseWriter, id string) {

	if id == "" {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

}

func CORSMiddleware(allowedMethods []string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Methods", strings.Join(allowedMethods, ","))

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}
}

func main() {

	http.HandleFunc("/server_test", CORSMiddleware([]string{"GET"})(func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Write([]byte("Server is running"))
	}))

	http.HandleFunc("/ws", serveWS)

	http.HandleFunc("/recordings/", CORSMiddleware([]string{"GET", "POST"})(func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodGet && r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if r.Method == http.MethodDelete {
			id := strings.TrimPrefix(r.URL.Path, "/recordings/")
			if id == "" {
				http.Error(w, "Invalid ID", http.StatusBadRequest)
				return
			}
			// Perform delete operation with the ID
			handleDeleteRecording(w, id)
			return
		} else {
			handleGetRecordings(w)
		}

	}))

	fmt.Println("Server is running at http://localhost:8080/")
	httpServerErr := http.ListenAndServe("0.0.0.0:8080", nil)
	if httpServerErr != nil {
		panic(httpServerErr)
	}

}
