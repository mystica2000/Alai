package webrtc

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	projectpath "server/internal/projectPath"
	"server/internal/storage"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
	"github.com/pion/webrtc/v4/pkg/media/oggreader"
)

const (
	oggPageDuration = time.Millisecond * 20
)

func listenFromDisk(pc *webrtc.PeerConnection, id int, conn *websocket.Conn) (*webrtc.PeerConnection, error) {

	iceConnectedCtx, iceConnectedCtxCancel := context.WithCancel(context.Background())
	defer iceConnectedCtxCancel()

	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus}, "audio", "pion")

	if err != nil {
		return nil, fmt.Errorf("error on local static sample")
	}

	rtpSender, err := pc.AddTrack(audioTrack)
	if err != nil {
		return nil, fmt.Errorf("error on addTrack")
	}

	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, rtcpErr := rtpSender.Read(rtcpBuf); rtcpErr != nil {
				return
			}
		}
	}()

	fileName, err := storage.GetRecordFileNameByID(id)

	if err != nil {
		return nil, fmt.Errorf("error on get record by filename: %v", err)
	}

	done := make(chan struct{})

	go func() {
		dataPath := filepath.Join(projectpath.Root, "internal/data/recordings/")
		filePath := filepath.Join(dataPath, fileName)

		file, oggErr := os.Open(filePath)

		if oggErr != nil {
			panic(oggErr)
		}

		defer file.Close()

		ogg, _, oggErr := oggreader.NewWith(file)
		if oggErr != nil {
			panic(oggErr)
		}
		<-iceConnectedCtx.Done()

		var lastGranule uint64

		ticker := time.NewTicker(oggPageDuration)
		defer ticker.Stop()

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				pageData, pageHeader, oggErr := ogg.ParseNextPage()

				if errors.Is(oggErr, io.EOF) {
					fmt.Println("All audio pages parsed and sent!! ")

					message := CommandResponse{
						Payload: id,
						Command: "stop_done",
					}

					conn.WriteJSON(message)
					lastGranule = 0
					// Gracefully shutdown the peer connection
					if closeErr := pc.Close(); closeErr != nil {
						panic(closeErr)
					}
					return

				}

				if oggErr != nil {
					log.Printf("Error parsing OGG page: %v", err)
					return
				}

				sampleCount := float64(pageHeader.GranulePosition - lastGranule)
				lastGranule = pageHeader.GranulePosition
				fmt.Println(lastGranule)
				sampleDuration := time.Duration((sampleCount/48000)*1000) * time.Millisecond
				if oggErr = audioTrack.WriteSample(media.Sample{Data: pageData, Duration: sampleDuration}); oggErr != nil {
					log.Printf("Error writing sample: %v", err)
					return
				}
			}
		}

	}()

	pc.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
		fmt.Printf("Connection State has changed %s \n", connectionState.String())
		if connectionState == webrtc.ICEConnectionStateConnected {
			iceConnectedCtxCancel()
		}
	})

	pc.OnConnectionStateChange(func(pcs webrtc.PeerConnectionState) {
		if pcs == webrtc.PeerConnectionStateClosed {
			close(done)
		}
	})

	return pc, nil
}
