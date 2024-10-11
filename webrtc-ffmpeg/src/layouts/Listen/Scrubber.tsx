import { useRecordState } from "@/hooks/useRecordState";
import useWebSocketStore from "@/hooks/useWebsocket";
import { useEffect, useRef, useState } from "react"

interface AScrubberProps {
    ImageUri: string;
    Id: number;
    Duration: number;
}

export default function Scrubber({ ImageUri, Id, Duration }: AScrubberProps) {

    const currentTask = useWebSocketStore((state) => state.currentTask);
    const currentPlayingRecord = useRecordState((state) => state.getPlayingRecord);
    const canvasRef = useRef(null);
    const animationRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const progressRef = useRef<number>(0);

    useEffect(() => {
        InitializeCanvas();
    }, [ImageUri])

    useEffect(() => {

        if (currentTask == "listen") {
            const record = currentPlayingRecord();
            if (record && record.id == Id) {
                lastUpdateTimeRef.current = performance.now();
                startCanvas(0);
            } else {
                resetCanvas();
                // reset playing
            }
        } else {
            // reset playing
            resetCanvas();
        }

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };

    }, [currentTask, currentTask, Id, Duration])


    const InitializeCanvas = () => {
        const canvas: any = canvasRef.current;
        if (canvas != null) {
            const context = canvas?.getContext('2d');

            const baseImage = new Image();

            if (!/^.*data.*base64.*$/gi.test(ImageUri)) {
                ImageUri = 'data:image/png;base64,'.concat(ImageUri);
            }

            baseImage.src = ImageUri;
            baseImage.onload = function () {
                canvas.height = baseImage.height;
                context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
            }
        }
    }

    const startCanvas = (timestamp: number) => {

        console.log("WHAT?!!!", currentTask)
        if (currentTask == "listen") {

            InitializeCanvas();

            const canvas: any = canvasRef.current;
            const context = canvas?.getContext('2d');


            const elapsedTime = timestamp - lastUpdateTimeRef.current;
            progressRef.current = Math.min(elapsedTime / 1000, Duration);


            context.globalCompositeOperation = "source-atop";
            const overlayWidth = canvas.width * (progressRef.current / Duration);
            context.fillStyle = "#00ab6b";
            context.fillRect(0, 0, overlayWidth, canvas.height);

            context.globalCompositeOperation = "source-over";

            const lineX = overlayWidth; // X position for the line
            const startY = 2; // Start at the top of the canvas
            const endY = canvas.height - 2; // End at the bottom of the canvas

            context.lineWidth = 2;
            context.strokeStyle = "#00ab6b";
            context.beginPath(); // Start a new path
            context.moveTo(lineX, startY);  // Start drawing the line from the end of the progress bar
            context.lineTo(lineX, endY); // Expand the line to the right
            context.stroke();

            if (progressRef.current < Duration) {
                animationRef.current = requestAnimationFrame(startCanvas);
            } else {
                resetCanvas();
            }
        } else {
            resetCanvas();
        }
    }

    const resetCanvas = () => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }
        progressRef.current = 0;
        lastUpdateTimeRef.current = 0;
        InitializeCanvas()
    }

    return <>
        <canvas ref={canvasRef} className="w-full object-contain" />
    </>
}