package ffmpeg

import (
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	projectpath "server/internal/projectPath"
	"strconv"
	"strings"
)

func GetAudioDuration(fileName string) (float64, error) {

	cmd := exec.Command("ffprobe", "-i", fileName, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0")

	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("failed to execute ffprobe for duration: %v", err)
	}

	durationStr := strings.TrimSpace(string(output))

	duration, err := strconv.ParseFloat(durationStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse duration as float: %v", err)
	}

	return duration, nil
}

func GenerateAudioWaveFormAndReturnAsBase64(fileName string) (string, error) {

	// ffmpeg -i recording_20241008_192041.ogg -filter_complex "" -frames:v 1 output.png
	fileNameWithoutExtension := fileName
	if strings.HasSuffix(fileName, ".ogg") {
		fileNameWithoutExtension = strings.TrimSuffix(fileName, ".ogg")
		fmt.Println("Filename without extension:", fileNameWithoutExtension)
	}

	imagePath := filepath.Join(projectpath.Root, "internal/data/waveforms")
	imageFullPath := filepath.Join(imagePath, fileNameWithoutExtension+".png")

	audioPath := filepath.Join(projectpath.Root, "internal/data/recordings")
	audioFullPath := filepath.Join(audioPath, fileName)

	fmt.Println(imageFullPath)
	fmt.Println(fileName)

	cmd := exec.Command("ffmpeg", "-i", audioFullPath, "-filter_complex", "compand,showwavespic=s=500x120:colors=#656f79|black, crop=500:70:0:(in_h-70)/2", "-frames:v", "1", imageFullPath)

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to execute ffmpeg for generating waveform: %v", err)
	}

	imageData, err := os.ReadFile(imageFullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read image file : %v", err)
	}

	base64Image := base64.StdEncoding.EncodeToString(imageData)

	return base64Image, nil
}
