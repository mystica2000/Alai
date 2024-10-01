package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/interceptor"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
	"github.com/pion/webrtc/v4/pkg/media/oggreader"
	"github.com/pion/webrtc/v4/pkg/media/oggwriter"
)

type Message struct {
	MsgType     string `json:"type"`
	MessageText string `json:"msg,omitempty"`
	MsgOption   string `json:"option, omitempty"`
	Payload     int    `json:"payload, omitempty"`
}

const (
	oggPageDuration = time.Millisecond * 20
)

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

	fname := "recordings/recording_" + strconv.Itoa(len(entries)+1) + ".ogg"

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

	return pc, nil
}

func initialLoadFromDiskPeerConnection(pc *webrtc.PeerConnection, id int) (*webrtc.PeerConnection, error) {
	iceConnectedCtx, iceConnectedCtxCancel := context.WithCancel(context.Background())

	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus}, "audio", "pion")

	if err != nil {
		log.Println("Error on local static sample")
		return nil, err
	}

	rtpSender, err := pc.AddTrack(audioTrack)
	if err != nil {
		log.Println("Error on AddTrack")
		return nil, err
	}

	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, rtcpErr := rtpSender.Read(rtcpBuf); rtcpErr != nil {
				return
			}
		}
	}()

	fileName, err := GetRecordFileNameByID(id)

	if err != nil {
		fmt.Println("Error: %v", err)
		return nil, err
	}

	go func() {
		file, oggErr := os.Open("recordings/" + fileName + ".ogg")

		if oggErr != nil {
			panic(oggErr)
		}

		ogg, _, oggErr := oggreader.NewWith(file)
		if oggErr != nil {
			panic(oggErr)
		}

		<-iceConnectedCtx.Done()

		var lastGranule uint64

		ticker := time.NewTicker(oggPageDuration)
		defer ticker.Stop()

		for ; true; <-ticker.C {
			pageData, pageHeader, oggErr := ogg.ParseNextPage()

			if errors.Is(oggErr, io.EOF) {
				fmt.Printf("All audio pages parsed and sent")
				pc.Close()
				return
			}

			if oggErr != nil {
				panic(oggErr)
			}

			sampleCount := float64(pageHeader.GranulePosition - lastGranule)
			lastGranule = pageHeader.GranulePosition
			sampleDuration := time.Duration((sampleCount/48000)*1000) * time.Millisecond

			if oggErr = audioTrack.WriteSample(media.Sample{Data: pageData, Duration: sampleDuration}); oggErr != nil {
				panic(oggErr)
			}
		}
	}()

	pc.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
		fmt.Printf("Connection State has changed %s \n", connectionState.String())
		if connectionState == webrtc.ICEConnectionStateConnected {
			iceConnectedCtxCancel()
		}
	})

	pc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		fmt.Printf("Peer Connection State has changed: %s\n", s.String())

		if s == webrtc.PeerConnectionStateFailed {
			// Wait until PeerConnection has had no network activity for 30 seconds or another failure. It may be reconnected using an ICE Restart.
			// Use webrtc.PeerConnectionStateDisconnected if you are interested in detecting faster timeout.
			// Note that the PeerConnection may come back from PeerConnectionStateDisconnected.
			fmt.Println("Peer Connection has gone to failed exiting")
			pc.Close()
		}

		if s == webrtc.PeerConnectionStateClosed {
			// PeerConnection was explicitly closed. This usually happens from a DTLS CloseNotify
			fmt.Println("Peer Connection has gone to closed exiting")
			pc.Close()
		}
	})

	return pc, nil
}

func initialSaveToDiskPeerConnection(pc *webrtc.PeerConnection) (*webrtc.PeerConnection, error) {
	if _, err := pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
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
		fmt.Println(webrtc.ICEConnectionStateClosed)

		if cs == webrtc.ICEConnectionStateDisconnected || cs == webrtc.ICEConnectionStateFailed || cs == webrtc.ICEConnectionStateClosed {

			if closeError := oggFile.Close(); closeError != nil {
				fmt.Println("WATTTTTTTT", closeError)
				panic(closeError)
			}

			fmt.Println("Done writing media files")

			AddFileToDB()

			// Gracefully shutdown the peer connection
			if closeErr := pc.Close(); closeErr != nil {
				panic(closeErr)
			}
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

		if msg.MsgOption != "record" && msg.MsgOption != "listen" {
			log.Println("Invalid MESSAGE: ", err)
			continue
		}

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

		if msg.MsgOption == "record" {

			pc, err = initialSaveToDiskPeerConnection(pc)

			if err != nil {
				log.Println("initializing save to disk: ", err)
				continue
			}

		} else {

			if msg.Payload <= 0 {
				log.Println("Payload missing ", err)
				return
			}

			pc, err = initialLoadFromDiskPeerConnection(pc, msg.Payload)

			if err != nil {
				log.Println("initializing load from disk: ", err)
				continue
			}
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

func handleGetRecordings(w http.ResponseWriter) {

	content, err := GetRecords()

	if err != nil {
		http.Error(w, "Could not GET", http.StatusInternalServerError)
		return
	}

	response := map[string][]byte{
		"recordings": content,
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

func handleUpdateRecording(w http.ResponseWriter) {

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

	http.HandleFunc("/recordings/", CORSMiddleware([]string{"GET", "POST", "PUT"})(func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodGet && r.Method != http.MethodDelete && r.Method != http.MethodPut {
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
		} else if r.Method == http.MethodPut {
			handleUpdateRecording(w)
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
