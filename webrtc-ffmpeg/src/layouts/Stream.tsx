import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function Stream() {
    return <Card className="h-full">
        <CardHeader>
            <CardTitle>View Recordings</CardTitle>
            <CardDescription>
                contains Recordings list
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            Hello
        </CardContent>
        <CardFooter>
            test
        </CardFooter>
    </Card>
}