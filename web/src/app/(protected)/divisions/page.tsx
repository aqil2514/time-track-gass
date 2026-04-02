import { DivisionTemplate } from "@/features/divisions/divisions.template";
import { Metadata } from "next";

export const metadata:Metadata = {
    title:"Manajemen Divisi"
}

export default function DivisionPage(){
    return <DivisionTemplate />
}