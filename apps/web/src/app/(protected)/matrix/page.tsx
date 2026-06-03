import { MatrixTemplate } from "@/features/matrix/matrix.template";
import { Metadata } from "next";

export const metadata:Metadata = {
    title:"Matriks Aktivitas"
}

export default function ActivityMatrixPage(){
    return <MatrixTemplate />
}