package webrtc

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"time"

	"server/internal/storage"

	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media/oggwriter"

	projectpath "server/internal/projectPath"
)

// Generate a unique file name for the recording based on the current number of recordings in the directory.
func CreateFileName() string {

	// Construct the path to the recordings directory using `filepath.Join`
	dataPath := filepath.Join(projectpath.Root, "internal/data/recordings/")

	// unique, avoid concurrency issue
	fname := "recording_" + time.Now().Format("20060102_150405") + ".ogg"
	fnameWithDir := filepath.Join(dataPath, fname)

	return fnameWithDir
}

func SaveRecordingToDisk(pc *webrtc.PeerConnection) (*webrtc.PeerConnection, error) {
	if _, err := pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
		return nil, fmt.Errorf("error adding audio transceiver: %v", err)
	}

	oggFile, err := oggwriter.New(CreateFileName(), 48000, 2)
	if err != nil {
		return nil, fmt.Errorf("error creating OGG writer: %v", err)
	}

	pc.OnTrack(func(tr *webrtc.TrackRemote, r *webrtc.RTPReceiver) {
		codec := tr.Codec()

		if strings.EqualFold(codec.MimeType, webrtc.MimeTypeOpus) {
			saveToDisk(oggFile, tr)
		}
	})

	pc.OnICEConnectionStateChange(func(cs webrtc.ICEConnectionState) {

		log.Printf("Connection State has Changed : %s \n", cs)

		if cs == webrtc.ICEConnectionStateDisconnected || cs == webrtc.ICEConnectionStateFailed || cs == webrtc.ICEConnectionStateClosed {

			if closeError := oggFile.Close(); closeError != nil {
				log.Printf("Error closing OGG file: %v", closeError)
				return
			}

			storage.AddFileToDB()

			log.Println("File successfully saved to disk and added to database")

			// Gracefully shut down the peer connection
			if closeErr := pc.Close(); closeErr != nil {
				log.Printf("Error closing peer connection: %v", closeErr)
			}

		}
	})

	return pc, nil
}

func saveToDisk(oggFile *oggwriter.OggWriter, track *webrtc.TrackRemote) {

	for {
		rtpPacket, _, err := track.ReadRTP()
		if err != nil {
			log.Printf("Error reading RTP packet: %v", err)
			return
		}

		if err := oggFile.WriteRTP(rtpPacket); err != nil {
			log.Printf("Error writing RTP packet to OGG file: %v", err)
			return
		}
	}
}
