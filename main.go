package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/pion/interceptor"
	"github.com/pion/webrtc/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true;
	},
}

var pc *webrtc.PeerConnection

func initializeWebRTCPeer() error {
	if pc == nil {
		fmt.Println("Initializing Peer Connection");

		mediaEngine := &webrtc.MediaEngine{}

		if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
			return err
		}

		i := &interceptor.Registry{}

		if err := webrtc.RegisterDefaultInterceptors(mediaEngine, i); err != nil {
			return err
		}

		api := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine), webrtc.WithInterceptorRegistry(i))

		var err error;
		pc, err = api.NewPeerConnection(webrtc.Configuration{})

		if err != nil {
			return err
		}

		if _, err = pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
			return err
		}

		pc.OnTrack(func(tr *webrtc.TrackRemote, r *webrtc.RTPReceiver) {
			codec := tr.Codec()
			fmt.Print(codec);
		});

	}

	return nil
}


func decodeBase64ToSDP(str string, obj *webrtc.SessionDescription) {
	fmt.Println("decoding...");

	b, err := base64.StdEncoding.DecodeString(str);

	if err != nil {
		log.Print("error on decodeBase64 ",err);
	}

	if err = json.Unmarshal(b, obj); err != nil {
		panic(err)
	}

}

func encodeSDPtoBase64(obj *webrtc.SessionDescription) string {
	fmt.Println("encoding...");

	b, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}

	return base64.StdEncoding.EncodeToString(b)
}

func serverWs(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Print("upgrade failed :",err);
		return;
	}

	defer c.Close()

	for {



		mt, message, err := c.ReadMessage();

		if err != nil {
			log.Println("read error: ",err);
			break;
		}

		offer := webrtc.SessionDescription{}
		decodeBase64ToSDP(string(message), &offer);

		initializeWebRTCPeer();

		err = pc.SetRemoteDescription(offer)
		if err != nil {
			panic(err)
		}

		answer, err := pc.CreateAnswer(nil);

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

		encodedSDP := encodeSDPtoBase64(pc.LocalDescription());
		c.WriteMessage(mt, []byte(encodedSDP))

		//handleByMessageType(webrtcMessage);
	}
}

func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		w.Header().Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		next(w,r)
	}
}

func main()  {

	err := initializeWebRTCPeer()
	if err != nil {
        log.Fatal("Failed to initialize WebRTC peer:", err)
    }

	defer func ()  {
		if closeError := pc.Close(); closeError!=nil {
			fmt.Printf("cannot close peerconnection %v\n", closeError);
		}
	}()

	http.HandleFunc("/server_test", CORS(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Server is running"));
	}));

	http.HandleFunc("/ws", serverWs);

	fmt.Println("Server is running at http://localhost:8080/");
	httpServerErr := http.ListenAndServe("0.0.0.0:8080",nil)
	if err != nil {
		panic(httpServerErr)
	}

}