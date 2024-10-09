import { Play } from "lucide-react"


interface AColor {
    disabled: boolean
}

export default function PlayButton({ disabled }: AColor) {

    return <>
        <Play size={30} color={disabled ? 'grey' : 'white'} />
    </>
}