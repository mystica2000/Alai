import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Record() {
    return <Card className="h-full flex flex-col">
        <CardHeader className="flex-none ">
            <CardTitle>Record Audio</CardTitle>
            <CardDescription>
                create audio recordings
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 grow">
            <div>
                Hello
            </div>
        </CardContent>
        <CardFooter className="grow-0 h-32">
            test
        </CardFooter>
    </Card>
}