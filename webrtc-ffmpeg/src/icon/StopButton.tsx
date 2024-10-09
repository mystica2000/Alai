import { Square } from "lucide-react"

interface AColor {
    disabled: boolean
}


export default function StopButton({ disabled }: AColor) {

    return <>
        <Square size={30} color={disabled ? 'grey' : 'white'} />
    </>
}