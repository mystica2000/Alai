export default function StopButton() {

    const handleStop = () => {

    }

    return <>
        <button className="p-1 scale-125" onClick={handleStop}>
            <svg xmlns="http://www.w3.org/2000/svg" className="ionicon w-4" viewBox="0 0 512 512" fill="white">
                <path d="M392 432H120a40 40 0 01-40-40V120a40 40 0 0140-40h272a40 40 0 0140 40v272a40 40 0 01-40 40z" />
            </svg>
        </button>
    </>
}