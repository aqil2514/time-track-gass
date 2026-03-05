import { DashboardTemplate } from "@/features/dashboard/dashboard.template";
import { Metadata } from "next";

export const metadata:Metadata = {
    title:"Dashboard"
}

export default function DashboardPage(){
    return <DashboardTemplate />
}